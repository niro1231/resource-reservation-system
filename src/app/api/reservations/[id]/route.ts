
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/reservations/:id
// Cancel a confirmed reservation without deleting it.
export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Invalid reservation ID." },
        { status: 400 }
      );
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This reservation has already been cancelled." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
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

    return NextResponse.json(reservation);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    console.error("Failed to cancel reservation:", error);

    return NextResponse.json(
      { error: "Unable to cancel reservation." },
      { status: 500 }
    );
  }
}
