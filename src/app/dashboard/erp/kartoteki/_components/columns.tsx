'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Product, convertToLocalProduct } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Pencil, Trash, Unplug } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

import Link from "next/link";

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[80px] font-mono text-xs">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: "Nazwa",
    cell: ({ row }) => {
        const source = row.original.source;
        return (
            <div className="flex flex-col">
                <Link href={`/dashboard/erp/kartoteki/${row.original.id}`} className="font-medium hover:underline">
                    {row.getValue("name")}
                </Link>
                {source === 'woocommerce' && (
                    <span className="text-xs text-muted-foreground">WooCommerce</span>
                )}
            </div>
        )
    }
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "stockQuantity",
    header: "Stan",
    cell: ({ row }) => {
        const qty = row.getValue("stockQuantity") as number;
        return (
            <Badge variant={qty > 0 ? "outline" : "destructive"}>
                {qty ?? 0} {row.original.unit || 'szt'}
            </Badge>
        )
    }
  },
  {
    accessorKey: "purchasePrice",
    header: "Cena Zakupu (Netto)",
    cell: ({ row }) => {
        const price = row.getValue("purchasePrice") as number;
        return price ? formatCurrency(price / 100) : '-';
    }
  },
  {
    accessorKey: "source",
    header: "Źródło",
    cell: ({ row }) => {
        const source = row.getValue("source") as string;
        return (
            <Badge variant={source === 'local' ? "default" : "secondary"}>
                {source === 'local' ? 'Lokalne' : 'Sklep'}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Otwórz menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/erp/kartoteki/${product.id}`}>
                    Szczegóły
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id.toString())}>
              Kopiuj ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {product.source === 'woocommerce' && (
                <DropdownMenuItem onClick={async () => {
                    try {
                        await convertToLocalProduct(product.id);
                        toast.success("Produkt odłączony od sklepu (stał się lokalny)");
                    } catch {
                        toast.error("Błąd podczas konwersji");
                    }
                }}>
                    <Unplug className="mr-2 h-4 w-4" /> Przejmij (Zrób lokalny)
                </DropdownMenuItem>
            )}
            <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" /> Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
