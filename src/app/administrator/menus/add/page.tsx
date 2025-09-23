"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import * as z from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  ArrowLeft,
  PlusCircle,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
} from "lucide-react";

// Constants
const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Types
interface Category {
  id: string;
  name: string;
}

interface ApiError {
  message: string;
  code?: string;
  details?: Array<{
    path?: string[];
    message: string;
  }>;
}

interface ValidationDetail {
  path?: string[];
  message: string;
}

// Form Schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Menu name must be at least 2 characters.",
    })
    .max(100, {
      message: "Menu name must be less than 100 characters.",
    }),
  description: z
    .array(z.string().min(1, { message: "Description point cannot be empty." }))
    .min(1, { message: "At least one description point is required." })
    .max(20, { message: "Maximum 20 description points allowed." }),
  price: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 10000000;
    },
    {
      message: "Price must be a valid number between 1 and 10,000,000.",
    }
  ),
  discountedPrice: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = Number(val);
        return !isNaN(num) && num > 0 && num <= 10000000;
      },
      {
        message:
          "Discounted price must be a valid number between 1 and 10,000,000.",
      }
    ),
  categoryId: z
    .string({
      required_error: "Please select a category.",
    })
    .min(1, { message: "Please select a category." }),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  imageAlt: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return val.length <= 255;
      },
      {
        message: "Image alt text must be less than 255 characters.",
      }
    ),
  image: z
    .any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type FormValues = z.infer<typeof formSchema>;

// API Helper
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      message:
        data.message ||
        data.error ||
        `HTTP ${response.status}: ${response.statusText}`,
      code: data.code,
      details: data.details,
    };
    throw error;
  }

  return data;
};

// Components
const LoadingForm = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-40 w-full" />
  </div>
);

const ErrorBanner = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">{error}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  </div>
);

const ImagePreview = ({
  src,
  alt,
  onClear,
}: {
  src: string;
  alt: string;
  onClear: () => void;
}) => (
  <div className="mt-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium">Preview:</p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        <X className="h-4 w-4 mr-2" />
        Remove
      </Button>
    </div>
    <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="192px"
        priority={false}
      />
    </div>
  </div>
);

// Main Component
export default function AddMenuPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoized values
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${session?.accessToken}`,
    }),
    [session?.accessToken]
  );

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: [""],
      price: "",
      discountedPrice: "",
      categoryId: "",
      status: "DRAFT",
      imageAlt: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "description",
  });

  // Price validation
  const watchedPrice = form.watch("price");
  const watchedDiscountedPrice = form.watch("discountedPrice");

  useEffect(() => {
    if (watchedPrice && watchedDiscountedPrice) {
      const price = Number(watchedPrice);
      const discountedPrice = Number(watchedDiscountedPrice);

      if (discountedPrice >= price) {
        form.setError("discountedPrice", {
          type: "manual",
          message: "Discounted price must be less than the original price.",
        });
      } else {
        form.clearErrors("discountedPrice");
      }
    }
  }, [watchedPrice, watchedDiscountedPrice, form]);

  // API Functions
  const fetchCategories = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      const data = await apiRequest("/api/admin/categories", {
        headers: authHeaders,
      });

      setCategories(data.categories || []);
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching categories:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch categories";
      setCategoriesError(errorMessage);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(
          () => fetchCategories(),
          RETRY_DELAY * Math.pow(2, retryCount)
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, [authHeaders, status, retryCount]);

  const handleRetryCategories = useCallback(() => {
    setRetryCount(0);
    fetchCategories();
  }, [fetchCategories]);

  // Form Handlers
  const handleImageClear = useCallback(() => {
    setImagePreview(null);
    form.setValue("image", undefined);
    form.clearErrors("image");

    // Reset the file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, [form]);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setImagePreview(null);
        return;
      }

      // Validate file size and type
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size too large. Maximum size is 5MB.");
        form.setError("image", {
          type: "manual",
          message: "File size too large. Maximum size is 5MB.",
        });
        // Reset the input
        e.target.value = "";
        setImagePreview(null);
        return;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
        form.setError("image", {
          type: "manual",
          message: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
        });
        // Reset the input
        e.target.value = "";
        setImagePreview(null);
        return;
      }

      // Clear any previous errors
      form.clearErrors("image");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
        setImagePreview(null);
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    },
    [form]
  );

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!session?.accessToken) {
        toast.error("Authentication required");
        return;
      }

      try {
        setLoading(true);

        // Prepare form data
        const formData = new FormData();

        const menuData = {
          name: values.name.trim(),
          description: values.description
            .map((desc) => desc.trim())
            .filter((desc) => desc !== ""),
          price: Number(values.price),
          ...(values.discountedPrice && {
            discountedPrice: Number(values.discountedPrice),
          }),
          categoryId: values.categoryId,
          status: values.status,
          imageAlt: values.imageAlt?.trim() || values.name.trim(),
        };

        formData.append("data", JSON.stringify(menuData));

        if (values.image?.[0]) {
          formData.append("image", values.image[0]);
        }

        const response = await fetch("/api/admin/menus", {
          method: "POST",
          headers: authHeaders,
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("Menu created successfully!");
          router.push("/administrator/menus");
        } else {
          const error: ApiError = {
            message: result.error || result.message || "Failed to create menu",
            details: result.details,
          };

          toast.error(error.message);

          // Handle validation errors
          if (error.details) {
            error.details.forEach((detail: ValidationDetail) => {
              const fieldPath = detail.path?.join(".") || "general";
              toast.error(`${fieldPath}: ${detail.message}`);
            });
          }
        }
      } catch (error) {
        console.error("Error creating menu:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error creating menu";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken, authHeaders, router]
  );

  const handleSaveAsDraft = useCallback(() => {
    form.setValue("status", "DRAFT");
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const handlePublish = useCallback(() => {
    form.setValue("status", "PUBLISHED");
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  // Effects
  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [fetchCategories, status]);

  // Loading state for unauthenticated
  if (status === "loading") {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <LoadingForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-muted-foreground">
              Please sign in to add a new menu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-md">
            <Link href="/administrator/menus">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            Add New Menu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error Banner */}
          {categoriesError && retryCount >= MAX_RETRIES && (
            <ErrorBanner
              error={categoriesError}
              onRetry={handleRetryCategories}
            />
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Menu Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menu Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter menu name"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive name for your menu item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={() => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormDescription>
                      Add multiple points to describe your menu (max 20 points)
                    </FormDescription>
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={`description.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Input
                                    placeholder={`Description point ${
                                      index + 1
                                    }`}
                                    {...field}
                                    disabled={loading}
                                  />
                                </FormControl>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    disabled={loading}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    {fields.length < 20 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append("")}
                        disabled={loading}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Description Point
                      </Button>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (IDR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25000"
                          min="1"
                          max="10000000"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Price in Indonesian Rupiah (1 - 10,000,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discounted Price (IDR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="22000"
                          min="1"
                          max="10000000"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Must be less than original price.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={categoriesLoading || loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                categoriesLoading
                                  ? "Loading categories..."
                                  : "Select a category"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the appropriate category for this menu item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Draft items are not visible to customers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Image Upload */}
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, name } }) => (
                  <FormItem>
                    <FormLabel>Product Image *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleImageChange(e);
                          }}
                          disabled={loading}
                          name={name}
                          // Remove value and other props that cause controlled/uncontrolled conflict
                        />
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload a product image (max 5MB)
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Supported formats: JPEG, PNG, WebP. Recommended size:
                      800x600px or higher.
                    </FormDescription>
                    <FormMessage />

                    {imagePreview && (
                      <ImagePreview
                        src={imagePreview}
                        alt="Product preview"
                        onClear={handleImageClear}
                      />
                    )}
                  </FormItem>
                )}
              />

              {/* Image Alt Text */}
              <FormField
                control={form.control}
                name="imageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Alt Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe the image for accessibility"
                        maxLength={255}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Helps screen readers and improves SEO. Defaults
                      to menu name if not provided.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Link href="/administrator/menus">
                  <Button
                    variant="outline"
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </Link>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={handleSaveAsDraft}
                    className="w-full sm:w-auto"
                  >
                    {loading && form.getValues("status") === "DRAFT" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save as Draft
                  </Button>

                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handlePublish}
                    className="w-full sm:w-auto"
                  >
                    {loading && form.getValues("status") === "PUBLISHED" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Publish Menu
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
