'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Hammer, FileText, ArrowRight } from "lucide-react";
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

export default function CRMDashboardPage() {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-3"
      >
        {/* Customers Card */}
        <motion.div variants={item} className="h-full group">
          <Link href="/dashboard/crm/customers" className="block h-full">
            <Card className="h-full border-border/50 bg-linear-to-br from-card to-muted/20 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24" />
              </div>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Klienci</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Kompletna baza kontrahentów, historia kontaktów i preferencje.
                </p>
                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    Przejdź do bazy <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Montages Card */}
        <motion.div variants={item} className="h-full group">
          <Link href="/dashboard/crm/montaze" className="block h-full">
            <Card className="h-full border-border/50 bg-linear-to-br from-card to-muted/20 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Hammer className="w-24 h-24" />
              </div>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 text-orange-600 dark:text-orange-400">
                    <Hammer className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Realizacje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tablica Kanban, harmonogram prac, przydzielanie ekip i kontrola terminów.
                </p>
                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    Zarządzaj montażami <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Quotes Card */}
        <motion.div variants={item} className="h-full group">
          <Link href="/dashboard/crm/oferty" className="block h-full">
            <Card className="h-full border-border/50 bg-linear-to-br from-card to-muted/20 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-24 h-24" />
              </div>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
                    <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Oferty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generator wycen, szablony umów i śledzenie statusu akceptacji.
                </p>
                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    Twórz oferty <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Quick Stats / Recent Activity Placeholder */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
         {/* Future widgets can go here */}
      </motion.div>
    </div>
  );
}
