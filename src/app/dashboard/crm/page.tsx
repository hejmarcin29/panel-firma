'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Hammer, FileText, Briefcase } from "lucide-react";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/crm/customers">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Klienci</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Baza Klientów</div>
                <p className="text-xs text-muted-foreground">
                  Zarządzaj relacjami z klientami i historią kontaktów
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/crm/montaze">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Montaże</CardTitle>
                <Hammer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Realizacje</div>
                <p className="text-xs text-muted-foreground">
                  Śledź postępy prac montażowych i harmonogram
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Link href="/dashboard/crm/oferty">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Oferty</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Wyceny</div>
                <p className="text-xs text-muted-foreground">
                  Twórz i zarządzaj ofertami dla klientów
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
