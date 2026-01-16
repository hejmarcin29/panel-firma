"use client"

import { Table } from "@tanstack/react-table"
import { X, CheckCircle, Eye, EyeOff, ShoppingCart, Beaker } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/shop/data-table-view-options"

import { DataTableFacetedFilter } from "@/components/shop/data-table-faceted-filter"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { bulkToggleShopVisibility, bulkTogglePurchasable, bulkToggleSamplesAvailability } from "../actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  categories: { label: string; value: string }[]
  collections: { label: string; value: string }[]
  patterns: { label: string; value: string }[]
  mountingMethods: { label: string; value: string }[]
}

export function DataTableToolbar<TData>({
  table,
  categories,
  collections,
  patterns,
  mountingMethods
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBulkAction = async (action: string) => {
      if (selectedRows.length === 0) return
      setIsLoading(true)
      
      const ids = selectedRows.map(row => (row.original as { id: string }).id)
      
      try {
          switch(action) {
              case 'show':
                  await bulkToggleShopVisibility(ids, true)
                  toast.success(`Pokazano ${ids.length} produktów w sklepie`)
                  break
              case 'hide':
                  await bulkToggleShopVisibility(ids, false)
                  toast.success(`Ukryto ${ids.length} produktów w sklepie`)
                  break
              case 'enable_sales':
                  await bulkTogglePurchasable(ids, true)
                  toast.success(`Włączono sprzedaż dla ${ids.length} produktów`)
                  break
              case 'disable_sales':
                  await bulkTogglePurchasable(ids, false)
                  toast.success(`Wyłączono sprzedaż dla ${ids.length} produktów`)
                  break
              case 'enable_samples':
                  await bulkToggleSamplesAvailability(ids, true)
                  toast.success(`Udostępniono próbki dla ${ids.length} produktów`)
                  break
              case 'disable_samples':
                  await bulkToggleSamplesAvailability(ids, false)
                  toast.success(`Wyłączono próbki dla ${ids.length} produktów`)
                  break
          }
          table.toggleAllRowsSelected(false)
          router.refresh()
      } catch (error) {
          toast.error("Wystąpił błąd podczas akcji masowej", {description: error instanceof Error ? error.message : "Nieznany błąd"})
      } finally {
          setIsLoading(false)
      }
  }

  return (
    <div className="flex flex-col gap-4">
        {/* Top Row: Actions (if selected) or Filters */}
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Szukaj produktu..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-[250px] lg:w-[350px]"
                />
                
                {/* Faceted Filters */}
                {table.getColumn("category") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("category")}
                        title="Kategoria"
                        options={categories}
                    />
                )}
                 {table.getColumn("collection") && ( // Note: You need to ensure 'collection' column exists in definition even if hidden/accessor
                    <DataTableFacetedFilter
                        column={table.getColumn("collection")} // This might need a custom filter function if collection is nested object in accessor
                        title="Kolekcja"
                        options={collections}
                    />
                )}
                {table.getColumn("pattern") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("pattern")}
                        title="Wzór"
                        options={patterns}
                    />
                )}
                {table.getColumn("mounting") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("mounting")}
                        title="Montaż"
                        options={mountingMethods}
                    />
                )}

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            
            <DataTableViewOptions table={table} />
        </div>
        
        {/* Bulk Actions Bar (Visible only when selection > 0) */}
        {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-slate-900 text-slate-50 rounded-md shadow-lg animate-in slide-in-from-top-2">
                <span className="text-sm font-medium px-2">
                    Wybrano: {selectedRows.length}
                </span>
                <div className="h-4 w-[1px] bg-slate-700 mx-2" />
                
                {/* Visibility Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" disabled={isLoading} className="h-8 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Widoczność
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Zmień widoczność</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleBulkAction('show')}>
                            <Eye className="mr-2 h-4 w-4 text-emerald-600" />
                            Pokaż w sklepie
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('hide')}>
                             <EyeOff className="mr-2 h-4 w-4 text-red-600" />
                            Ukryj w sklepie
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sales Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" disabled={isLoading} className="h-8 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                            <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                            Sprzedaż
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Możliwość zakupu</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleBulkAction('enable_sales')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                            Włącz sprzedaż
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('disable_sales')}>
                             <X className="mr-2 h-4 w-4 text-red-600" />
                            Wyłącz sprzedaż (Tylko katalog)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Samples Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="secondary" size="sm" disabled={isLoading} className="h-8 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                            <Beaker className="mr-2 h-3.5 w-3.5" />
                            Próbki
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Dostępność próbek</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleBulkAction('enable_samples')}>
                             <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                            Próbki dostępne
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('disable_samples')}>
                             <X className="mr-2 h-4 w-4 text-red-600" />
                            Brak próbek
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => table.toggleAllRowsSelected(false)}
                    className="ml-auto h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
    </div>
  )
}
