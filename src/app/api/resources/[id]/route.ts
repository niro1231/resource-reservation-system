
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";

export const runtime = "nodejs";

const updateSchema = resourceSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/resources/:id
// Update resource details or change its active status.
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Invalid resource ID." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please correct the resource details.",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (Object.keys(result.data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(resource);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    console.error("Failed to update resource:", error);

    return NextResponse.json(
      { error: "Unable to update resource." },
      { status: 500 }
    );
  }
}
