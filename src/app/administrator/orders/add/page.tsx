"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Trash2, CalendarIcon, ArrowLeft, ArchiveIcon } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock product list
const productList = [
  { id: "1", name: "Product A", price: 250000, discountedPrice: 225000 },
  { id: "2", name: "Product B", price: 350000, discountedPrice: 315000 },
  { id: "3", name: "Product C", price: 450000, discountedPrice: 427500 },
  { id: "4", name: "Product D", price: 550000, discountedPrice: 495000 },
];

const productSchema = z.object({
  id: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const formSchema = z.object({
  orderDate: z.date({
    required_error: "Please select a date and time for the order.",
  }),
  orderTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: "Please enter a valid time in HH:MM format.",
  }),
  customerName: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  telephone: z.string().regex(/^\+62\d{9,}$/, {
    message: "Please enter a valid Indonesian phone number starting with +62.",
  }),
  products: z.array(productSchema).min(1, "At least one product is required"),
  shippingAddress: z.string().min(10, {
    message: "Shipping address must be at least 10 characters.",
  }),
  paymentMethod: z.enum(["cash", "bank_transfer"], {
    required_error: "Please select a payment method.",
  }),
  useDownpayment: z.boolean().default(false),
  downpaymentAmount: z
    .number()
    .min(0, "Downpayment cannot be negative")
    .optional(),
});

export default function Page() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date(),
      customerName: "",
      telephone: "+62",
      products: [{ id: "", quantity: 1 }],
      shippingAddress: "",
      paymentMethod: "cash",
      useDownpayment: false,
      downpaymentAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // toast({
    //   title: "Order submitted",
    //   description: "Your order has been submitted successfully.",
    // });
    console.log(values);
  }

  const watchProducts = form.watch("products");
  const watchUseDownpayment = form.watch("useDownpayment");
  const watchDownpaymentAmount = form.watch("downpaymentAmount");

  const total = watchProducts.reduce((total, product) => {
    const productDetails = productList.find((p) => p.id === product.id);
    return (
      total +
      (productDetails ? productDetails.discountedPrice * product.quantity : 0)
    );
  }, 0);

  const remainingAmount =
    total - (watchUseDownpayment ? watchDownpaymentAmount || 0 : 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Date Picker */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          //   disabled={(date) =>
                          //     date > new Date() || date < new Date("1900-01-01")
                          //   }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date for this order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Picker */}
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().substring(11, 16)
                            : ""
                        }
                        className="w-[120px]"
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          const date =
                            field.value instanceof Date
                              ? field.value
                              : new Date();
                          date.setHours(hours, minutes, 0, 0); // Set jam, menit, dan detik
                          field.onChange(date); // Simpan kembali nilai date
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose the time for this order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name={`products.${index}.id`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Product</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productList.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name} - Rp{" "}
                                    {product.discountedPrice.toLocaleString(
                                      "id-ID"
                                    )}{" "}
                                    (was Rp{" "}
                                    {product.price.toLocaleString("id-ID")})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`products.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove product</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ id: "", quantity: 1 })}
                  >
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="useDownpayment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Use Downpayment
                          </FormLabel>
                          <FormDescription>
                            Enable to add a downpayment to this order
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {watchUseDownpayment && (
                    <FormField
                      control={form.control}
                      name="downpaymentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Downpayment Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {watchUseDownpayment && (
                    <div className="flex justify-between font-bold">
                      <span>Remaining Amount:</span>
                      <span>Rp {remainingAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the full name of the customer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone</FormLabel>
                      <FormControl>
                        <Input placeholder="+628123456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the customers Indonesian telephone number starting
                        with +62.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, City, Country"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the full shipping address for the order.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the payment method for this order.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" type="button">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" type="button">
              <ArchiveIcon className="mr-2 h-4 w-4" /> Archive
            </Button>
          </div>
          <Button type="submit" className="">
            Submit Order
          </Button>
        </div>
      </form>
    </Form>
  );
}
