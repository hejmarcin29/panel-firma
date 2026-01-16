"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, ShoppingCart, Beaker } from "lucide-react"

export type ShopProduct = {
    id: string
    name: string
    sku: string
    category?: { name: string } | null
    collection?: { name: string } | null
    mountingMethodDictionary?: { name: string } | null
    floorPatternDictionary?: { name: string } | null
    isShopVisible: boolean | null
    isPurchasable: boolean | null
    isSampleAvailable: boolean | null
}

export const columns: ColumnDef<ShopProduct>[] = [
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
    accessorKey: "name",
    header: "Nazwa Produktu",
    cell: ({ row }) => {
      const collection = row.original.collection?.name;
      return (
        <div className="flex flex-col">
            <span className="font-medium">{row.getValue("name")}</span>
            {collection && <span className="text-xs text-muted-foreground">{collection}</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "category.name",
    id: "category",
    header: "Kategoria",
    enableSorting: false, // relations sorting is complex, disabling for now unless requested
  },
  {
    accessorKey: "floorPatternDictionary.name",
    id: "pattern",
    header: "Wzór",
    enableSorting: false,
  },
  {
    accessorKey: "mountingMethodDictionary.name",
    id: "mounting",
    header: "Montaż",
    enableSorting: false,
  },
  {
    accessorKey: "isShopVisible",
    header: "Widoczność",
    cell: ({ row }) => {
      const isVisible = row.getValue("isShopVisible")
      return isVisible ? (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
             <Eye className="mr-1 h-3 w-3" /> Widoczny
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
            <EyeOff className="mr-1 h-3 w-3" /> Ukryty
        </Badge>
      )
    },
  },
  {
    accessorKey: "isPurchasable",
    header: "Sprzedaż",
    cell: ({ row }) => {
        const isPurchasable = row.getValue("isPurchasable")
        return isPurchasable ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ShoppingCart className="mr-1 h-3 w-3" /> Tak
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
              Nie
          </Badge>
        )
      },
  },
  {
      accessorKey: "isSampleAvailable",
      header: "Próbki",
      cell: ({ row }) => {
          const isSample = row.getValue("isSampleAvailable")
          return isSample ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Beaker className="mr-1 h-3 w-3" /> Tak
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
                Nie
            </Badge>
          )
        },
    },
]
