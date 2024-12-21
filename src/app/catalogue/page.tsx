"use client";
import Slider from "@/components/Slider";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

const data = [
  {
    title: "AQIQAH",
    paket: [
      {
        title: "Paket 1",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 0,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
      {
        title: "Paket 2",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 10,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
      {
        title: "Paket 3",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 0,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
      {
        title: "Paket 4",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 0,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
    ],
  },
  {
    title: "KENDURI",
    paket: [
      {
        title: "Paket Kenduri 1",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 0,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
      {
        title: "Paket Kenduri 2",
        image: "/kambing.jpg",
        harga: 1000000,
        diskon: 10,
        deskripsi: [
          {
            subtitle: "Kambing mulai dari harga 2 - 3 jt/ekor.",
          },
          {
            subtitle: "Harga kambing mneyesuaikan kebutuhan",
          },
          {
            subtitle: "Biaya masak 500 - 600rb.",
          },
          {
            subtitle: "Menu masakan kambing hanya Tongseng/Gulai.",
          },
          {
            subtitle:
              "Pemesanan bisa dalam bentuk uraian atau bisa langsung dibagi didalam box sesuai jumlah request pemesan dengan kemasan plastik",
          },
        ],
      },
    ],
  },
];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);

  const categories = data.map((item) => ({
    value: item.title.toLowerCase(),
    label: item.title,
  }));

  const filteredData = value
    ? data.filter((item) => item.title.toLowerCase() === value)
    : data;

  return (
    <div className="max-w-screen-sm mx-auto">
      <div className="bg-[#b23847] flex flex-col justify-start items-center p-6">
        <Image src="/logo.jpg" alt="AD Catering" width={200} height={200} />

        <p className="text-white text-center mt-[-20px] mb-8">
          The Best Catering In Jogja
        </p>
        <div className="w-full flex gap-4 justify-between items-center mt-6">
          <Button variant="outline" className="w-fit">
            Back Home
          </Button>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {value
                  ? categories.find((category) => category.value === value)
                      ?.label
                  : "Select category"}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.value}
                        value={category.value}
                        onSelect={(currentValue) => {
                          setValue(
                            currentValue === value ? null : currentValue
                          );
                          setOpen(false);
                        }}
                      >
                        {category.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            value === category.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {filteredData.map((item, index) => (
          <div key={index} className="w-full flex-col gap-8">
            <Slider data={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
