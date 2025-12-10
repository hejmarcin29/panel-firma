"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Mail, Monitor } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function QuickActions() {
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Szybkie Akcje</CardTitle>
        <CardDescription>Najczęstsze operacje</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="grid gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/dashboard/montaze?new=true">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Dodaj Montaż
                </Link>
            </Button>
          </motion.div>
          <motion.div variants={item}>
            <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/dashboard/orders/new">
                    <FileText className="mr-2 h-4 w-4" />
                    Wystaw Zamówienie
                </Link>
            </Button>
          </motion.div>
          <motion.div variants={item}>
            <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/dashboard/mail">
                    <Mail className="mr-2 h-4 w-4" />
                    Sprawdź Pocztę
                </Link>
            </Button>
          </motion.div>
          <motion.div variants={item}>
            <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/tv">
                    <Monitor className="mr-2 h-4 w-4" />
                    Widok TV
                </Link>
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
