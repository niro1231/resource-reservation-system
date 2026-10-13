
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/reservation-validations";

export const runtime = "nodejs";

// GET /api/reservations
// Return reservations together with their resource details.
export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Failed to fetch reservations:", error);

    return NextResponse.json(
      { error: "Unable to load reservations." },
      { status: 500 }
    );
  }
}

// POST /api/reservations
// Create a reservation if the resource is active
// and the requested time period is available.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = reservationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please correct the reservation details.",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      resourceId,
      reservedBy,
      purpose,
      startTime,
      endTime,
    } = result.data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Serializable transactions help protect the availability
    // check against concurrent reservation requests.
    // Retry serialization conflicts a limited number of times.
    let reservation: object | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const outcome = await prisma.$transaction(
          async (tx) => {
            const resource = await tx.resource.findUnique({
              where: { id: resourceId },
              select: {
                id: true,
                isActive: true,
              },
            });

            if (!resource) {
              return { kind: "not-found" as const };
            }

            if (!resource.isActive) {
              return { kind: "inactive" as const };
            }

            const conflict = await tx.reservation.findFirst({
              where: {
                resourceId,
                status: "CONFIRMED",
                startTime: { lt: end },
                endTime: { gt: start },
              },
              select: { id: true },
            });

            if (conflict) {
              return { kind: "conflict" as const };
            }

            const created = await tx.reservation.create({
              data: {
                resourceId,
                reservedBy,
                purpose,
                startTime: start,
                endTime: end,
                status: "CONFIRMED",
              },
              include: {
                resource: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    location: true,
                    isActive: true,
                  },
                },
              },
            });

            return {
              kind: "created" as const,
              reservation: created,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          }
        );

        if (outcome.kind === "not-found") {
          return NextResponse.json(
            { error: "The selected resource does not exist." },
            { status: 404 }
          );
        }

        if (outcome.kind === "inactive") {
          return NextResponse.json(
            {
              error: "This resource is inactive and cannot be reserved.",
            },
            { status: 400 }
          );
        }

        if (outcome.kind === "conflict") {
          return NextResponse.json(
            {
              error:
                "This resource is already reserved during the selected time. Please choose another time.",
            },
            { status: 409 }
          );
        }

        reservation = outcome.reservation;
        break;
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        if (!isSerializationConflict || attempt === 2) {
          throw error;
        }
      }
    }

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            "Unable to complete the reservation. Please try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Failed to create reservation:", error);

    return NextResponse.json(
      { error: "Unable to create reservation." },
      { status: 500 }
    );
  }
}
