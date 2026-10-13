
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";

export const runtime = "nodejs";

// GET /api/resources
// List all resources.
export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Failed to fetch resources:", error);

    return NextResponse.json(
      { error: "Unable to load resources." },
      { status: 500 }
    );
  }
}

// POST /api/resources
// Create a resource.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = resourceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please correct the resource details.",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        name: result.data.name,
        type: result.data.type,
        description: result.data.description || null,
        location: result.data.location || null,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    console.error("Failed to create resource:", error);

    return NextResponse.json(
      { error: "Unable to create resource." },
      { status: 500 }
    );
  }
}
