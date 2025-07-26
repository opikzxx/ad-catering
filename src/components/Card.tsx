import React, { useState } from "react";
import Image from "next/image";
import ProductDetailDialog from "./dialog-detail";

interface CardProps {
  data: {
    title: string;
    image: string;
    harga: number;
    hargaDiskon: number;
    diskon: number;
    deskripsi: {
      subtitle: string;
    }[];
  };
  categoryName?: string;
  onSelect?: (item: CardProps["data"]) => void;
}

// Helper function to format price to Rupiah
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

export default function Card({
  data,
  categoryName = "Menu",
  onSelect,
}: CardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Determine if we have a discount
  const hasDiscount = data.diskon > 0;

  // Use the correct pricing logic
  const displayPrice = hasDiscount ? data.hargaDiskon : data.harga;
  const originalPrice = data.harga;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(data);
    }
    // Open detail dialog
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col items-center bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        {/* Image Section */}
        <div className="relative h-[80px] md:h-[120px] w-[180px] md:w-[230px] rounded-t-lg overflow-hidden">
          <Image
            src={data.image}
            alt={data.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 180px, 230px"
            onError={(e) => {
              // Fallback to default image on error
              const target = e.target as HTMLImageElement;
              target.src = "/nasi-box.jpg";
            }}
          />

          {/* Title Badge */}
          <div className="absolute top-2 left-2 bg-[#ee8924] text-[10px] md:text-sm font-extrabold rounded-lg text-center p-1 md:p-2 text-white max-w-[160px] md:max-w-[200px] truncate shadow-sm">
            {data.title}
          </div>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] md:text-xs font-bold p-1 rounded-lg shadow-sm">
              -{data.diskon}%
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="h-[120px] md:h-[140px] w-[180px] md:w-[230px] p-2 md:p-4 px-4 md:px-6 overflow-auto text-slate-500 text-[10px] md:text-xs">
          <ul className="list-disc space-y-1 md:space-y-2 pl-3">
            {data.deskripsi.slice(0, 3).map((deskripsi, index) => (
              <li key={index} className="leading-relaxed">
                {deskripsi.subtitle}
              </li>
            ))}
            {data.deskripsi.length > 3 && (
              <li className="text-blue-600 font-medium cursor-pointer hover:underline">
                +{data.deskripsi.length - 3} more details...
              </li>
            )}
          </ul>
        </div>

        {/* Price and Action Section */}
        <div className="flex justify-between items-center w-[180px] md:w-[230px] p-2 md:p-4 text-black border-t border-gray-100">
          <div className="flex gap-2 items-center">
            {hasDiscount ? (
              <>
                {/* Show discount badge and prices */}
                <div className="bg-red-600 text-white text-[10px] md:text-xs p-1 rounded-lg font-bold">
                  {data.diskon}%
                </div>
                <div className="flex flex-col">
                  <div className="text-[8px] md:text-[10px] line-through text-gray-400">
                    {formatPrice(originalPrice)}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-green-600">
                    {formatPrice(displayPrice)}
                  </div>
                </div>
              </>
            ) : (
              /* Show normal price without discount */
              <div className="flex flex-col">
                <div className="text-[10px] md:text-xs font-bold">
                  {formatPrice(displayPrice)}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSelect}
            className="bg-[#303092] text-xs md:text-sm text-white font-medium rounded-lg shadow px-2 md:px-4 py-1 md:py-2 transition duration-300 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95"
          >
            Pilih
          </button>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        product={data}
        categoryName={categoryName}
      />
    </>
  );
}
