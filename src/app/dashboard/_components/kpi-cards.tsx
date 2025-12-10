"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    AlertCircle, 
    Briefcase, 
    ShoppingCart, 
    ArrowUpRight,
    CreditCard,
    Info
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface KPICardsProps {
  newLeadsCount: number;
  pendingPaymentsCount: number;
  urgentTasksCount: number;
  newOrdersCount: number;
  urgentOrdersCount?: number;
  stalledOrdersCount?: number;
  orderUrgentDays?: number;
  montageThreatDays?: number;
  settings?: {
      visibleCards?: string[];
  };
}

export function KPICards({
  newLeadsCount,
  pendingPaymentsCount,
  urgentTasksCount,
  newOrdersCount,
  urgentOrdersCount = 0,
  stalledOrdersCount = 0,
  montageThreatDays = 7,
  settings
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['leads', 'payments', 'urgent', 'orders', 'urgentOrders', 'stalledOrders'];

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

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {visibleCards.includes('urgent') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/montaze?filter=urgent" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Wiszące montaże
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Nie odnotowano w nich żadnej zmiany statusu ani aktywności przez określoną liczbę dni (domyślnie {montageThreatDays}).</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{urgentTasksCount}</div>
                <p className="text-xs text-orange-500/80 flex items-center mt-1">
                    bez daty montażu <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('leads') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Nowy Lead Montaż
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Liczba aktywnych tematów na etapie &apos;Lead&apos;, które wymagają przygotowania wyceny lub kontaktu wstępnego z klientem.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{newLeadsCount}</div>
                <p className="text-xs text-blue-500/80 flex items-center mt-1">
                    W realizacji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('orders') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Zamówienia do Weryfikacji
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Nowe zamówienia ze sklepu lub wprowadzone ręcznie, które mają status &apos;Utworzone&apos; i wymagają potwierdzenia dostępności towaru lub zaksięgowania wpłaty.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{newOrdersCount}</div>
                <p className="text-xs text-emerald-500/80 flex items-center mt-1">
                    Do weryfikacji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('payments') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/montaze" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Nierozliczone Montaże (Brak Wpłaty)
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Montaże ze statusem &apos;Zakończone&apos;, dla których suma wpłat jest mniejsza niż wartość zlecenia. Wymagają windykacji lub uzupełnienia płatności w systemie.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <CreditCard className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{pendingPaymentsCount}</div>
                <p className="text-xs text-yellow-500/80 flex items-center mt-1">
                    Oczekujące <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('urgentOrders') && urgentOrdersCount > 0 && (
        <motion.div variants={item} className="h-full">
        <Card className="shadow-none relative overflow-hidden group border-red-500/20 bg-red-500/5 h-full">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-red-600">
                        Zatory w Realizacji Zamówień
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-red-600/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Zamówienia, które utknęły na wczesnym etapie (np. &apos;W realizacji&apos;) i nie były aktualizowane przez ponad 3 dni. Sprawdź, czy towar jest dostępny.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-red-700">{urgentOrdersCount}</div>
                <p className="text-xs text-red-600/80 flex items-center mt-1">
                    Wymagają reakcji <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('stalledOrders') && stalledOrdersCount > 0 && (
        <motion.div variants={item} className="h-full">
        <Card className="shadow-none relative overflow-hidden group border-orange-500/20 bg-orange-500/5 h-full">
            <Link href="/dashboard/orders" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-orange-600">
                        Do Wystawienia Faktury Końcowej
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-orange-600/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Zamówienia, które zostały już wydane z magazynu lub zrealizowane, ale w systemie brakuje oznaczenia o wystawieniu faktury końcowej.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-orange-700">{stalledOrdersCount}</div>
                <p className="text-xs text-orange-600/80 flex items-center mt-1">
                    Wymagają wystawienia <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
