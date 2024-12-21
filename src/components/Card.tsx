interface CardProps {
  data: {
    title: string;
    image: string;
    harga: number;
    diskon: number;
    deskripsi: {
      subtitle: string;
    }[];
  };
}
export default function Card({ data }: CardProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-[80px] md:h-[120px] w-[180px] md:w-[230px] rounded-lg items-center bg-cover bg-center text-white p-2 md:p-5"
        style={{
          backgroundImage: " url('/nasi-box.jpg')",
        }}
      >
        <div className="absolute top-2 bg-[#ee8924] text-[10px] md:text-md font-extrabold rounded-lg text-center p-1 md:p-2">
          {data.title}
        </div>
      </div>

      <div className="h-[120px] md:h-[140px] w-[180px] md:w-[230px] p-2 md:p-4 px-4 md:px-6 overflow-auto text-slate-500 text-[10px] md:text-xs">
        <ul className="list-disc space-y-1 md:space-y-2">
          {data.deskripsi.map((deskripsi, index) => (
            <li key={index}>{deskripsi.subtitle}</li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center w-[180px] md:w-[230px] p-2 md:p-4 text-black">
        <div className="flex gap-2 items-center">
          <div className="bg-red-600 text-white text-[10px] md:text-xs p-1 rounded-lg">
            {data.diskon}%
          </div>
          <div className="flex flex-col">
            <div className="text-[8px] md:text-[10px] line-through">
              Rp. 136000
            </div>
            <div className="text-[10px] md:text-xs font-bold">
              Rp. {data.harga}
            </div>
          </div>
        </div>

        <button className="bg-[#303092] text-xs md:text-sm text-white font-medium rounded-lg shadow px-2 md:px-4 py-1 md:py-2 text-sm transition duration-300 hover:bg-blue-700">
          Pilih
        </button>
      </div>
    </div>
  );
}
