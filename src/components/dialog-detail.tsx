import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Heart, Star, Calendar } from "lucide-react";

interface ProductDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    title: string;
    image: string;
    harga: number;
    hargaDiskon: number;
    diskon: number;
    deskripsi: {
      subtitle: string;
    }[];
  } | null;
  categoryName?: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

// Helper: today's date in YYYY-MM-DD for min attribute
const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export default function ProductDetailDialog({
  isOpen,
  onClose,
  product,
  categoryName = "Menu",
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [orderDate, setOrderDate] = useState("");

  if (!product) return null;

  const hasDiscount = product.diskon > 0;
  const displayPrice = product.hargaDiskon;
  const originalPrice = product.harga;
  const totalPrice = displayPrice * quantity;

  const handleWhatsAppOrder = () => {
    const formattedDate = orderDate
      ? formatDateDisplay(orderDate)
      : "Belum ditentukan";

    const message = `Halo, saya tertarik untuk memesan:

📦 *${product.title}*
🏷️ Kategori: ${categoryName}
💰 Harga: ${formatPrice(displayPrice)}${
      hasDiscount ? ` (Diskon ${product.diskon}%)` : ""
    }
📊 Jumlah: ${quantity}
📅 Tanggal Pesanan: ${formattedDate}

Mohon informasi lebih lanjut mengenai pemesanan. Terima kasih!`;

    const whatsappUrl = `https://wa.me/6281313780998?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold pr-8">
            {product.title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          </div>
        </DialogHeader>

        {/* Product Image */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover"
            sizes="400px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/nasi-box.jpg";
            }}
          />
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
          <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">4.8</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {hasDiscount ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(displayPrice)}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      -{product.diskon}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold">
                  {formatPrice(displayPrice)}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-3">
          <h4 className="font-semibold">Deskripsi Produk</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {product.deskripsi.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span className="leading-relaxed">{item.subtitle}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Quantity Selector */}
        <div className="space-y-3">
          <h4 className="font-semibold">Jumlah Pesanan</h4>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={quantity}
                min={1}
                max={1000}
                placeholder="Masukkan jumlah..."
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    setQuantity(Math.min(val, 1000));
                  } else if (e.target.value === "") {
                    setQuantity(1);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none
                   focus:ring-2 focus:ring-green-500 focus:border-green-500
                   text-gray-700
                   [appearance:textfield]
                   [&::-webkit-outer-spin-button]:appearance-none
                   [&::-webkit-inner-spin-button]:appearance-none"
              />
              {quantity >= 1000 && (
                <p className="text-xs text-red-500 mt-1">Maksimal 1000 item</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-bold text-green-600">
                {formatPrice(totalPrice)}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-semibold">Tanggal Pesanan</h4>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={orderDate}
              min={getTodayString()}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none 
                         focus:ring-2 focus:ring-green-500 focus:border-green-500 
                         text-gray-700 cursor-pointer"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleWhatsAppOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Pesan via WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-300 hover:bg-gray-100 transition-all duration-200"
            size="lg"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
