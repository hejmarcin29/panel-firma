"use client";
import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from "@tanstack/react-table";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  className?: string;
};

export function DataTable<TData>({ columns, data, className }: DataTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className={className}>
      <table className="w-full text-sm">
        <thead className="bg-[var(--pp-table-header-bg)]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="text-left">
              {hg.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 font-medium">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-[var(--pp-table-row-hover)]" style={{ borderColor: 'var(--pp-border)' }}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
