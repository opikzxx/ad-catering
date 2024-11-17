export default function Card() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex gap-2 h-[100px] w-[270px] rounded-lg items-center bg-cover bg-center text-white p-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(46, 49, 135, 0.7), rgba(0, 0, 0, 0.4)), url('/example.png')",
        }}
      >
        <div className="font-semibold text-xs">
          Program Reguler className. Maksimal 6 anak
        </div>
        <div className="bg-[#ee8924] font-bold rounded-lg text-center p-2">
          KELAS 1 - REGULER
        </div>
      </div>

      <div className="h-[180px] w-[270px] p-4 px-6 overflow-auto text-slate-500 text-xs">
        <ul className="list-disc space-y-2">
          <li>
            Terdiri dari maksimal 7 anak setiap kelas, sangat kondusif untuk
            proses belajar.
          </li>
          <li>Durasi belajar 90 menit persesi.</li>
          <li>Tentor muda, berkualitas, dan berpengalaman.</li>
          <li>
            Target minimal masuk 3 besar dalam kelas, lulus ujian nasional dan
            mendapat sekolah yang diinginkan.
          </li>
          <li>Laporan perkembangan setiap dua bulan sekali.</li>
        </ul>
      </div>

      <div className="flex justify-between items-center w-[270px] p-6 text-black">
        <div className="flex gap-2 items-center">
          <div className="bg-red-600 text-white text-xs p-1 rounded-lg">0%</div>
          <div className="flex flex-col">
            <div className="text-[10px] line-through">Rp. 136000</div>
            <div className="text-xs font-bold">Rp. 136000</div>
          </div>
        </div>

        <button className="bg-[#303092] text-white font-medium rounded-lg shadow px-4 py-2 text-sm transition duration-300 hover:bg-blue-700">
          Pilih
        </button>
      </div>
    </div>
  );
}
