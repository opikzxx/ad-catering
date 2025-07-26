// types/public-menu.ts

export interface PublicMenu {
  id: string;
  name: string;
  description: string[];
  price: number;
  discountedPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  imageAlt?: string;
}

export interface PublicCategory {
  id: string;
  name: string;
  menus: PublicMenu[];
}

export interface PublicMenuResponse {
  categories: PublicCategory[];
}

// Helper function to format price to Rupiah
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

// Helper function to calculate discounted price
export const getDiscountedPrice = (menu: PublicMenu): number | undefined => {
  if (menu.discountedPrice) {
    return menu.discountedPrice;
  }
  if (menu.discountPercent && menu.discountPercent > 0) {
    return menu.price - (menu.price * menu.discountPercent) / 100;
  }
  return undefined;
};

// Helper function to check if menu has discount
export const hasDiscount = (menu: PublicMenu): boolean => {
  return !!(
    menu.discountedPrice ||
    (menu.discountPercent && menu.discountPercent > 0)
  );
};

// API fetch function
export const fetchPublicMenu = async (
  category?: string
): Promise<PublicMenuResponse> => {
  const url = new URL("/api/public/menu", window.location.origin);
  if (category) {
    url.searchParams.set("category", category);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch menu: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};
