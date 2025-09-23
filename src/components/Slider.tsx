"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Card from "./Card";
import "swiper/css";
import "./style.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { useRef } from "react";

interface Description {
  subtitle: string;
}

interface Paket {
  title: string;
  image: string;
  harga: number;
  hargaDiskon: number;
  diskon: number;
  deskripsi: Description[];
}

interface SliderProps {
  data: {
    title: string;
    paket: Paket[];
  };
}

export default function Slider({ data }: SliderProps) {
  // Create a ref to hold the Swiper instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const swiperRef = useRef<any>(null);

  // Function to go to the previous slide
  const handlePrevClick = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  // Function to go to the next slide
  const handleNextClick = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slideNext();
    }
  };

  return (
    <div className="max-w-screen-sm mx-auto mt-4">
      <div className="flex justify-between items-center py-2">
        <h1 className="text-lg font-bold text-white">{data.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="p-1" onClick={handlePrevClick}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" className="p-1" onClick={handleNextClick}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Swiper
        spaceBetween={15}
        watchSlidesProgress={true}
        slidesPerView="auto"
        className="mySwiper"
        ref={swiperRef} // Attach the swiper instance to the ref
      >
        {data.paket.map((paket, index) => (
          <SwiperSlide key={index}>
            <Card data={paket} categoryName={data.title} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
