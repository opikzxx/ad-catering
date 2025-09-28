import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Response types sesuai dengan struktur page
interface PublicMenu {
  id: string;
  name: string;
  description: string[];
  price: number;
  discountedPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  imageAlt?: string;
}

interface PublicCategory {
  id: string;
  name: string;
  menus: PublicMenu[];
}

interface PublicMenuResponse {
  categories: PublicCategory[];
}

// GET - Public endpoint for categories and menus
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");

    // Build category filter
    const categoryWhere = categoryFilter
      ? { name: { contains: categoryFilter, mode: "insensitive" as const } }
      : {};

    // Fetch categories with their published menus
    const categories = await prisma.category.findMany({
      where: {
        ...categoryWhere,
        menus: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      include: {
        menus: {
          where: {
            status: "PUBLISHED",
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discountedPrice: true,
            discountPercent: true,
            imageUrl: true,
            imageAlt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform data to match the expected structure
    const transformedCategories: PublicCategory[] = categories.map(
      (category) => ({
        id: category.id,
        name: category.name.toUpperCase(), // Match the uppercase style from your data
        menus: category.menus.map((menu) => ({
          id: menu.id,
          name: menu.name,
          description: menu.description,
          price: Number(menu.price), // Convert Decimal to number
          discountedPrice: menu.discountedPrice
            ? Number(menu.discountedPrice)
            : undefined, // Convert Decimal to number
          discountPercent: menu.discountPercent || undefined,
          imageUrl: menu.imageUrl || undefined,
          imageAlt: menu.imageAlt || undefined,
        })),
      })
    );

    const response: PublicMenuResponse = {
      categories: transformedCategories,
    };

    // Set cache headers for better performance
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    headers.set("Content-Type", "application/json");

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("GET /api/public/menu error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add OPTIONS for CORS if needed
export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");

  return new NextResponse(null, { status: 200, headers });
}
