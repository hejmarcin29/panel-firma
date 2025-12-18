'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Package, ShoppingCart, Truck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ERPDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ERP & Magazyn</h1>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/erp/kartoteki">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kartoteki</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Indeksy</div>
                <p className="text-xs text-muted-foreground">
                  Baza towarów, usług i materiałów (Lokalna)
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/erp/purchases">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zakupy (PO)</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Zamówienia</div>
                <p className="text-xs text-muted-foreground">
                  Twórz i zarządzaj zamówieniami do dostawców
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/erp/warehouse">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Magazyn</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Stany</div>
                <p className="text-xs text-muted-foreground">
                  Przeglądaj stany magazynowe i historię ruchów
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/erp/suppliers">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dostawcy</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Baza</div>
                <p className="text-xs text-muted-foreground">
                  Zarządzaj bazą dostawców i kontaktami
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/erp/invoices">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faktury</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Dokumenty</div>
                <p className="text-xs text-muted-foreground">
                  Wystawiaj i przeglądaj faktury sprzedażowe
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
