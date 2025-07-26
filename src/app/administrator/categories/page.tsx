"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  FolderIcon,
} from "lucide-react";

// Types
interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    menus: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CategoryResponse {
  categories: Category[];
  pagination: Pagination;
}

interface ApiError {
  message: string;
  code?: string;
  details?: Array<{
    path?: string[];
    message: string;
  }>;
}

// Constants
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;
const MAX_RETRIES = 3;

// Form Schemas
const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
    .refine((val) => val.trim().length > 0, "Category name cannot be empty"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

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

const useCategoryFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  // Update URL params
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, currentPage, router]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCurrentPage(1);
  }, []);

  return {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    debouncedSearch,
    clearFilters,
    hasActiveFilters: search,
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
    <TableCell colSpan={5} className="text-center py-12">
      <div className="flex items-center justify-center space-x-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading categories...</span>
      </div>
    </TableCell>
  </TableRow>
);

const EmptyRow = ({ onAdd }: { onAdd: () => void }) => (
  <TableRow>
    <TableCell colSpan={5} className="text-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <FolderIcon className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <div className="text-lg font-medium">No categories found</div>
          <div className="text-sm text-muted-foreground">
            Get started by creating your first category
          </div>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Category
        </Button>
      </div>
    </TableCell>
  </TableRow>
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

// Category Form Dialog
const CategoryFormDialog = ({
  category,
  open,
  onOpenChange,
  onSuccess,
}: {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const isEdit = !!category;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    } else {
      form.reset({ name: "" });
    }
  }, [category, form]);

  const onSubmit = useCallback(
    async (values: CategoryFormValues) => {
      if (!session?.accessToken) {
        toast.error("Authentication required");
        return;
      }

      try {
        setLoading(true);

        const url = isEdit
          ? `/api/admin/categories/${category!.id}`
          : "/api/admin/categories";

        const method = isEdit ? "PUT" : "POST";

        await apiRequest(url, {
          method,
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ name: values.name.trim() }),
        });

        toast.success(
          `Category ${isEdit ? "updated" : "created"} successfully!`
        );
        onSuccess();
        onOpenChange(false);
        form.reset();
      } catch (error) {
        console.error(
          `Error ${isEdit ? "updating" : "creating"} category:`,
          error
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to ${isEdit ? "update" : "create"} category`;
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken, isEdit, category, onSuccess, onOpenChange, form]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category name. This will affect all associated menus."
              : "Create a new category for organizing your menu items."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter category name"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name for your menu category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Suspense fallback component
const CategoriesPageFallback = () => (
  <div className="container mx-auto py-6">
    <Skeleton className="h-8 w-64 mb-4" />
    <Skeleton className="h-4 w-96 mb-8" />
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
);

// Inner component that uses useSearchParams
const CategoriesPageContent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();

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
    currentPage,
    setCurrentPage,
    debouncedSearch,
    clearFilters,
    hasActiveFilters,
  } = useCategoryFilters();

  // Memoized values
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${session?.accessToken}`,
    }),
    [session?.accessToken]
  );

  // API functions
  const fetchCategories = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const data: CategoryResponse = await apiRequest(
        `/api/admin/categories?${params}`,
        { headers: authHeaders }
      );

      setCategories(data.categories);
      setPagination(data.pagination);
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching categories:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch categories";
      setError(errorMessage);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchCategories(), 1000 * Math.pow(2, retryCount));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, authHeaders, status, retryCount]);

  const handleDelete = useCallback(
    async (categoryId: string) => {
      if (!session?.accessToken) {
        toast.error("Authentication required");
        return;
      }

      try {
        setDeleting(categoryId);

        await apiRequest(`/api/admin/categories/${categoryId}`, {
          method: "DELETE",
          headers: authHeaders,
        });

        toast.success("Category deleted successfully");
        await fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete category";
        toast.error(errorMessage);
      } finally {
        setDeleting(null);
      }
    },
    [session?.accessToken, authHeaders, fetchCategories]
  );

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    fetchCategories();
  }, [fetchCategories]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentPage]
  );

  const handleAddCategory = useCallback(() => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Effects
  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [fetchCategories, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, setCurrentPage]);

  // Loading state for unauthenticated
  if (status === "loading") {
    return <CategoriesPageFallback />;
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
            Please sign in to access the category management.
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
          <h1 className="text-lg font-bold tracking-tight">
            Category Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Organize your menu items into categories
          </p>
        </div>
        <Button onClick={handleAddCategory} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
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
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

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

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Menu Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRow />
            ) : categories.length === 0 ? (
              <EmptyRow onAdd={handleAddCategory} />
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          category._count.menus > 0 ? "default" : "secondary"
                        }
                      >
                        {category._count.menus}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={
                              deleting === category.id ||
                              category._count.menus > 0
                            }
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{category.name}</strong>? This action
                              cannot be undone.
                              {category._count.menus > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <strong>Warning:</strong> This category has{" "}
                                  {category._count.menus} menu item(s). You must
                                  move or delete these items first.
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(category.id)}
                              disabled={category._count.menus > 0}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting === category.id
                                ? "Deleting..."
                                : "Delete"}
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

      {/* Category Form Dialog */}
      <CategoryFormDialog
        category={editingCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
};

// Main component wrapped with Suspense
export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesPageFallback />}>
      <CategoriesPageContent />
    </Suspense>
  );
}
