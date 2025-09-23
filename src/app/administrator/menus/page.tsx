"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  PencilIcon,
  TrashIcon,
  Search,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Types
interface Category {
  id: string;
  name: string;
}

interface Menu {
  id: string;
  name: string;
  description: string[];
  price: number;
  discountedPrice?: number;
  discountPercent?: number;
  status: "DRAFT" | "PUBLISHED";
  imageUrl?: string;
  imageKey?: string;
  imageAlt?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MenuResponse {
  menus: Menu[];
  pagination: Pagination;
}

interface ApiError {
  message: string;
  code?: string;
}

// Constants
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;
const MAX_RETRIES = 3;

// Custom hooks
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useMenuFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "all"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  // Update URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, selectedCategory, selectedStatus, currentPage, router]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  }, []);

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    currentPage,
    setCurrentPage,
    debouncedSearch,
    clearFilters,
    hasActiveFilters:
      search || selectedCategory !== "all" || selectedStatus !== "all",
  };
};

// API functions
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.message || "An error occurred");
  }

  return response.json();
};

// Components
const LoadingRow = () => (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-12">
      <div className="flex items-center justify-center space-x-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading menus...</span>
      </div>
    </TableCell>
  </TableRow>
);

const EmptyRow = () => (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <div className="text-lg font-medium">No menus found</div>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const MenuImage = ({ menu }: { menu: Menu }) => {
  const [imageError, setImageError] = useState(false);

  if (!menu.imageUrl || imageError) {
    return (
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border">
        <span className="text-xs text-muted-foreground">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
      <Image
        src={menu.imageUrl}
        alt={menu.imageAlt || menu.name}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        sizes="64px"
        priority={false}
      />
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className?: string;
}) => (
  <div className="bg-card rounded-lg border p-4">
    <div className={`text-2xl font-bold ${className}`}>{value}</div>
    <div className="text-sm text-muted-foreground">{title}</div>
  </div>
);

const PaginationInfo = ({ pagination }: { pagination: Pagination }) => (
  <p className="text-sm text-muted-foreground">
    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
    {pagination.total} results
  </p>
);

const PaginationButtons = ({
  pagination,
  currentPage,
  onPageChange,
}: {
  pagination: Pagination;
  currentPage: number;
  onPageChange: (page: number) => void;
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const totalPages = pagination.pages;

    // Always show first page
    pages.push(1);

    // Show ellipsis if needed
    if (currentPage > 3 && totalPages > 5) {
      pages.push("...");
    }

    // Show pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2 && totalPages > 5) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {getVisiblePages().map((page, index) => (
        <React.Fragment key={index}>
          {page === "..." ? (
            <span className="px-2 py-1 text-muted-foreground">...</span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pagination.pages}
      >
        Next
      </Button>
    </div>
  );
};

// Suspense fallback component
const MenuListPageFallback = () => (
  <div className="container mx-auto py-6">
    <Skeleton className="h-8 w-64 mb-4" />
    <Skeleton className="h-4 w-96 mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
);

// Inner component that uses useSearchParams
const MenuListPageContent = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 0,
  });

  const { data: session, status } = useSession();
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    currentPage,
    setCurrentPage,
    debouncedSearch,
    clearFilters,
    hasActiveFilters,
  } = useMenuFilters();

  // Memoized values
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${session?.accessToken}`,
    }),
    [session?.accessToken]
  );

  const statsData = useMemo(
    () => ({
      total: pagination.total,
      published: menus.filter((m) => m.status === "PUBLISHED").length,
      drafts: menus.filter((m) => m.status === "DRAFT").length,
    }),
    [menus, pagination.total]
  );

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // API functions
  const fetchMenus = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
      });

      const data: MenuResponse = await apiRequest(
        `/api/admin/menus?${params}`,
        { headers: authHeaders }
      );

      setMenus(data.menus);
      setPagination(data.pagination);
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching menus:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch menus";
      setError(errorMessage);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchMenus(), 1000 * Math.pow(2, retryCount));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    selectedCategory,
    selectedStatus,
    authHeaders,
    status,
    retryCount,
  ]);

  const fetchCategories = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const data = await apiRequest("/api/admin/categories", {
        headers: authHeaders,
      });
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Don't show toast for categories error as it's not critical
    }
  }, [authHeaders, status]);

  const handleDelete = useCallback(
    async (menuId: string) => {
      if (!session?.accessToken) {
        toast.error("Authentication required");
        return;
      }

      try {
        setDeleting(menuId);

        await apiRequest(`/api/admin/menus/${menuId}`, {
          method: "DELETE",
          headers: authHeaders,
        });

        toast.success("Menu deleted successfully");

        // Refresh the list
        await fetchMenus();
      } catch (error) {
        console.error("Error deleting menu:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete menu";
        toast.error(errorMessage);
      } finally {
        setDeleting(null);
      }
    },
    [session?.accessToken, authHeaders, fetchMenus]
  );

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    fetchMenus();
  }, [fetchMenus]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentPage]
  );

  // Effects
  useEffect(() => {
    if (status === "authenticated") {
      fetchMenus();
    }
  }, [fetchMenus, status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [fetchCategories, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus, setCurrentPage]);

  // Loading state for unauthenticated
  if (status === "loading") {
    return <MenuListPageFallback />;
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please sign in to access the menu management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage your restaurant menu items and categories
          </p>
        </div>
        <Link href="/administrator/menus/add">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add New Menu
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Error State */}
      {error && retryCount >= MAX_RETRIES && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menus by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full lg:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Menus" value={statsData.total} />
        <StatsCard
          title="Published"
          value={statsData.published}
          className="text-green-600"
        />
        <StatsCard
          title="Drafts"
          value={statsData.drafts}
          className="text-yellow-600"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Menu Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRow />
            ) : menus.length === 0 ? (
              <EmptyRow />
            ) : (
              menus.map((menu) => (
                <TableRow key={menu.id} className="hover:bg-muted/50">
                  <TableCell>
                    <MenuImage menu={menu} />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-base">{menu.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {menu.description.join(" • ")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {menu.category.name}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {menu.discountedPrice ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-green-600">
                              {formatPrice(menu.discountedPrice)}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              -{menu.discountPercent}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(menu.price)}
                          </p>
                        </>
                      ) : (
                        <p className="font-bold">{formatPrice(menu.price)}</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        menu.status === "PUBLISHED" ? "default" : "secondary"
                      }
                      className="font-medium"
                    >
                      {menu.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">
                        {new Date(menu.updatedAt).toLocaleDateString("id-ID")}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(menu.updatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/administrator/menus/${menu.id}`}>
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleting === menu.id}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{menu.name}</strong>? This action cannot
                              be undone and will also delete the associated
                              image.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(menu.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting === menu.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <PaginationInfo pagination={pagination} />
          <PaginationButtons
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

// Main component wrapped with Suspense
export default function MenuListPage() {
  return (
    <Suspense fallback={<MenuListPageFallback />}>
      <MenuListPageContent />
    </Suspense>
  );
}
