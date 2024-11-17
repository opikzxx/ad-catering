"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Card from "./Card";
import "swiper/css";
import "./style.css";

export default function Slider() {
  return (
    <div className="">
      <Swiper
        spaceBetween={15}
        watchSlidesProgress={true}
        slidesPerView="auto"
        className="mySwiper"
      >
        <SwiperSlide>
          <Card />
        </SwiperSlide>
        <SwiperSlide>
          <Card />
        </SwiperSlide>
        <SwiperSlide>
          <Card />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
