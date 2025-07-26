"use client";

import React, { useState, useEffect, useCallback } from "react";
import Slider from "@/components/Slider";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  RefreshCw,
  AlertCircle,
  Home,
} from "lucide-react";
import { toast } from "sonner";

// Types untuk compatibility dengan Slider component
interface SliderMenu {
  title: string;
  image: string;
  harga: number;
  hargaDiskon: number;
  diskon: number;
  deskripsi: Array<{
    subtitle: string;
  }>;
}

interface SliderData {
  title: string;
  paket: SliderMenu[];
}

// API Types
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

// Helper function to transform API data to Slider format
const transformDataForSlider = (categories: PublicCategory[]): SliderData[] => {
  return categories.map((category) => ({
    title: category.name,
    paket: category.menus.map((menu) => ({
      title: menu.name,
      image: menu.imageUrl || "/kambing.jpg", // fallback image
      harga: menu.price,
      hargaDiskon: menu.discountedPrice || 0,
      diskon: menu.discountPercent || 0,
      deskripsi: menu.description.map((desc) => ({
        subtitle: desc,
      })),
    })),
  }));
};

// API fetch function
const fetchMenuData = async (
  category?: string
): Promise<PublicMenuResponse> => {
  const url = new URL("/api/public/menus", window.location.origin);
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

// Loading component
const LoadingState = () => (
  <div className="w-full flex flex-col items-center justify-center py-12 space-y-4">
    <RefreshCw className="h-8 w-8 animate-spin text-white" />
    <p className="text-white text-center">Loading menu...</p>
  </div>
);

// Error component
const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="w-full flex flex-col items-center justify-center py-12 space-y-4">
    <AlertCircle className="h-8 w-8 text-white" />
    <p className="text-white text-center">Failed to load menu</p>
    <p className="text-white/80 text-sm text-center">{error}</p>
    <Button
      variant="outline"
      onClick={onRetry}
      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="w-full flex flex-col items-center justify-center py-12 space-y-4">
    <AlertCircle className="h-8 w-8 text-white" />
    <p className="text-white text-center">No menu items found</p>
    <p className="text-white/80 text-sm text-center">
      Try selecting a different category or check back later
    </p>
  </div>
);

export default function MenuPage() {
  // State management
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null);

  // Derived state
  const categories =
    menuData?.categories.map((item) => ({
      value: item.name.toLowerCase(),
      label: item.name,
    })) || [];

  const filteredData = value
    ? menuData?.categories.filter(
        (item) => item.name.toLowerCase() === value
      ) || []
    : menuData?.categories || [];

  const sliderData = transformDataForSlider(filteredData);

  // Fetch menu data
  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchMenuData();
      setMenuData(data);

      if (data.categories.length === 0) {
        toast.info("No menu categories available at the moment");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load menu";
      setError(errorMessage);
      console.error("Error loading menu:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (currentValue: string) => {
      setValue(currentValue === value ? null : currentValue);
      setOpen(false);
    },
    [value]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Handle back to home
  const handleBackHome = useCallback(() => {
    // You can replace this with your actual home navigation logic
    window.location.href = "/";
  }, []);

  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="bg-[#b23847] flex flex-col justify-start items-center p-6 min-h-screen">
        {/* Header */}
        <Image
          src="/logo.jpg"
          alt="AD Catering"
          width={200}
          height={200}
          priority
        />

        <p className="text-white text-center mt-[-20px] mb-8">
          The Best Catering In Jogja
        </p>

        {/* Navigation and Filter */}
        <div className="w-full flex gap-4 justify-between items-center mt-6 mb-6">
          <Button
            variant="outline"
            className="w-fit bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={handleBackHome}
          >
            <Home className="h-4 w-4 mr-2" />
            Back Home
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={loading || categories.length === 0}
              >
                {value
                  ? categories.find((category) => category.value === value)
                      ?.label
                  : loading
                  ? "Loading categories..."
                  : categories.length === 0
                  ? "No categories available"
                  : "Select category"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {/* Add "All Categories" option */}
                    <CommandItem
                      value="all"
                      onSelect={() => handleCategorySelect("all")}
                    >
                      All Categories
                      <Check
                        className={cn(
                          "ml-auto",
                          value === null ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.value}
                        value={category.value}
                        onSelect={handleCategorySelect}
                      >
                        {category.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            value === category.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : sliderData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="w-full space-y-6">
            {sliderData.map((item, index) => (
              <div key={`${item.title}-${index}`} className="w-full">
                <Slider data={item} />
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        {!loading && !error && menuData && (
          <div className="w-full mt-8 pt-6 border-t border-white/20">
            <p className="text-white/80 text-sm text-center">
              {menuData.categories.length} categories •{" "}
              {menuData.categories.reduce(
                (total, cat) => total + cat.menus.length,
                0
              )}{" "}
              menu items
            </p>
            <p className="text-white/60 text-xs text-center mt-2">
              Last updated: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
