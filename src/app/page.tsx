import Image from "next/image";
import Link from "next/link";
import {
  FaBookOpen,
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaWhatsapp,
} from "react-icons/fa";

export default function Home() {
  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="bg-[#b23847] h-screen flex flex-col justify-center items-center p-6">
        {/* Gambar tetap di atas */}
        <Image src="/logo.jpg" alt="AD Catering" width={200} height={200} />

        {/* Deskripsi tentang logo */}
        <p className="text-white text-center mt-[-20px] mb-8">
          The Best Catering In Jogja
        </p>

        {/* Katalog dan tombol lainnya */}
        <div className="flex flex-col gap-4 w-full px-10 md:px-28">
          <Link
            href="/catalogue"
            className="bg-[#f9f9f9] text-[#b23847] flex items-center justify-center gap-2 px-4 py-4 rounded-lg transition duration-300 ease-in-out transform hover:bg-[#b23847] hover:text-[#f9f9f9] hover:scale-105"
          >
            <FaBookOpen size={20} />
            Ad Catering Catalogue
          </Link>

          <Link
            href="https://wa.me/6281313780998"
            className="bg-[#f9f9f9] text-[#b23847] flex items-center justify-center gap-2 px-4 py-4 rounded-lg transition duration-300 ease-in-out transform hover:bg-[#b23847] hover:text-[#f9f9f9] hover:scale-105"
          >
            <FaShoppingCart size={20} />
            Order Here
          </Link>

          <Link
            href="https://maps.app.goo.gl/7pLF4jNHvFzgaPqu6"
            className="bg-[#f9f9f9] text-[#b23847] flex items-center justify-center gap-2 px-4 py-4 rounded-lg transition duration-300 ease-in-out transform hover:bg-[#b23847] hover:text-[#f9f9f9] hover:scale-105"
          >
            <FaMapMarkerAlt size={20} />
            Our Location Bedingin
          </Link>

          <Link
            href="https://maps.app.goo.gl/hon2yAc3b9kNyXDg7"
            className="bg-[#f9f9f9] text-[#b23847] flex items-center justify-center gap-2 px-4 py-4 rounded-lg transition duration-300 ease-in-out transform hover:bg-[#b23847] hover:text-[#f9f9f9] hover:scale-105"
          >
            <FaMapMarkerAlt size={20} />
            Our Location Cabang Krapyak
          </Link>

          <div className="border border-white w-full"></div>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-4 mt-8 text-white">
          <Link
            href="https://www.instagram.com/catering_ad/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram size={30} />
          </Link>
          <Link href="#" target="_blank" rel="noopener noreferrer">
            <FaFacebook size={30} />
          </Link>
          <Link
            href="https://wa.me/6281313780998"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp size={30} />
          </Link>
        </div>
      </div>
    </div>
  );
}
