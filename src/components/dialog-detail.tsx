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
import { MessageCircle, Heart, Star } from "lucide-react";

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

// Helper function to format price to Rupiah
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductDetailDialog({
  isOpen,
  onClose,
  product,
  categoryName = "Menu",
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) return null;

  // Calculate prices
  const hasDiscount = product.diskon > 0;
  const displayPrice = product.hargaDiskon;
  const originalPrice = product.harga;
  const totalPrice = displayPrice * quantity;

  const handleQuantityChange = (action: "increase" | "decrease") => {
    if (action === "increase") {
      setQuantity((prev) => Math.min(prev + 1, 99));
    } else {
      setQuantity((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleWhatsAppOrder = () => {
    const message = `Halo, saya tertarik untuk memesan:

📦 *${product.title}*
🏷️ Kategori: ${categoryName}
💰 Harga: ${formatPrice(displayPrice)}${
      hasDiscount ? ` (Diskon ${product.diskon}%)` : ""
    }
📊 Jumlah: ${quantity}
💵 Total: ${formatPrice(totalPrice)}

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

          {/* Favorite button */}
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

          {/* Rating badge (mock data) */}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => handleQuantityChange("decrease")}
                disabled={quantity <= 1}
                className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 font-medium min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange("increase")}
                disabled={quantity >= 99}
                className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
              >
                +
              </button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold">{formatPrice(totalPrice)}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* WhatsApp Order Button */}
          <Button
            onClick={handleWhatsAppOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Pesan via WhatsApp
          </Button>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            size="lg"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
