import Slider from "@/components/Slider";
import Image from "next/image";

export default function Page() {
  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="bg-[#b23847] h-screen flex flex-col justify-start items-center p-6">
        <Image src="/logo.jpg" alt="AD Catering" width={200} height={200} />

        {/* Deskripsi tentang logo */}
        <p className="text-white text-center mt-[-20px] mb-8">
          The Best Catering In Jogja
        </p>
        <div className="bg-white">
          <Slider />
        </div>
      </div>
    </div>
  );
}
