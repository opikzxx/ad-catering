import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProductStatus, Prisma } from "@/generated/prisma";
import { getTokenFromHeader, verifyAuthToken } from "@/lib/verify-jwt";

// Validation schema
const createMenuSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z
    .array(z.string())
    .min(1, "At least one description is required"),
  price: z.number().positive("Price must be positive"),
  discountedPrice: z
    .number()
    .positive("Discounted price must be positive")
    .optional(),
  discountPercent: z
    .number()
    .int("Discount percent must be an integer")
    .min(0)
    .max(100, "Discount percent must be between 0-100")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  imageUrl: z.string().url("Invalid image URL").optional(),
  imageKey: z.string().optional(),
  imageAlt: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
});

// GET - List all menus
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const session = token ? verifyAuthToken(token) : null;

    if (!session || session.user_role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.MenuWhereInput = {};

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status && (status === "DRAFT" || status === "PUBLISHED")) {
      where.status = status as ProductStatus;
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.menu.count({ where }),
    ]);

    return NextResponse.json({
      menus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/administrator/menus error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new menu
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    const session = token ? verifyAuthToken(token) : null;

    if (!session || session.user_role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMenuSchema.parse(body);

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    // Calculate discount percent if discounted price is provided
    const finalData = {
      ...validatedData,
      price: validatedData.price,
      discountedPrice: validatedData.discountedPrice,
      discountPercent:
        validatedData.discountedPrice && !validatedData.discountPercent
          ? Math.round(
              ((validatedData.price - validatedData.discountedPrice) /
                validatedData.price) *
                100
            )
          : validatedData.discountPercent,
    };

    const menu = await prisma.menu.create({
      data: finalData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Menu created successfully",
        menu,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("POST /api/administrator/menus error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
