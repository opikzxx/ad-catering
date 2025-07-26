import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function Page() {
  return (
    <div className="">
      <div className="w-full mt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Menus</h1>
          <Link href="/administrator/products/add">
            <Button size="sm">Add Menu</Button>
          </Link>
        </div>
      </div>
      <Separator className="mt-4" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>Kenduri 1</TableCell>
            <TableCell>Kenduri</TableCell>
            <TableCell>$250.00</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline">
                  <PencilIcon />
                </Button>
                <Button size="sm">
                  <TrashIcon />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
