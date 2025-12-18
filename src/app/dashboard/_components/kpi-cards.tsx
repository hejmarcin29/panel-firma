"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
    AlertCircle, 
    Briefcase, 
    ShoppingCart, 
    ArrowUpRight,
    CreditCard,
    Info,
    FileText
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
  pendingContractsCount?: number;
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
  pendingContractsCount = 0,
  urgentTasksCount,
  newOrdersCount,
  urgentOrdersCount = 0,
  stalledOrdersCount = 0,
  montageThreatDays = 7,
  settings
}: KPICardsProps) {
  const visibleCards = settings?.visibleCards || ['leads', 'payments', 'contracts', 'urgent', 'orders', 'urgentOrders', 'stalledOrders'];

  const [lastSeenLeads, setLastSeenLeads] = useState<number>(0);
  const [lastSeenOrders, setLastSeenOrders] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedLeads = localStorage.getItem('kpi_last_seen_leads');
    const storedOrders = localStorage.getItem('kpi_last_seen_orders');
    
    // eslint-disable-next-line 
    if (storedLeads) setLastSeenLeads(parseInt(storedLeads));
    if (storedOrders) setLastSeenOrders(parseInt(storedOrders));
    setIsLoaded(true);
  }, []);

  const handleLeadsClick = () => {
    localStorage.setItem('kpi_last_seen_leads', newLeadsCount.toString());
    setLastSeenLeads(newLeadsCount);
  };

  const handleOrdersClick = () => {
    localStorage.setItem('kpi_last_seen_orders', newOrdersCount.toString());
    setLastSeenOrders(newOrdersCount);
  };

  const hasNewLeads = isLoaded && newLeadsCount > lastSeenLeads;
  const hasNewOrders = isLoaded && newOrdersCount > lastSeenOrders;

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
            <Link href="/dashboard/crm/montaze?filter=urgent" className="absolute inset-0 z-10" />
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
        <Card className={cn(
            "bg-card border-border shadow-none relative overflow-hidden group h-full transition-all duration-300",
            hasNewLeads && "border-blue-500 ring-1 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        )}>
            <Link 
                href="/dashboard/crm/montaze?view=lead" 
                className="absolute inset-0 z-10" 
                onClick={handleLeadsClick}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        Nowy Lead Montaż
                        {hasNewLeads && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 animate-pulse">
                                NOWE
                            </span>
                        )}
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
        <Card className={cn(
            "bg-card border-border shadow-none relative overflow-hidden group h-full transition-all duration-300",
            hasNewOrders && "border-emerald-500 ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        )}>
            <Link 
                href="/dashboard/orders?filter=verification" 
                className="absolute inset-0 z-10" 
                onClick={handleOrdersClick}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        Zamówienia do Weryfikacji
                        {hasNewOrders && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 animate-pulse">
                                NOWE
                            </span>
                        )}
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

      {visibleCards.includes('contracts') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/crm/montaze?filter=contracts" className="absolute inset-0 z-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Do Podpisania (Umowy)
                    </CardTitle>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" className="cursor-help z-20 relative" onClick={(e) => e.preventDefault()}>
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Montaże, dla których wysłano ofertę, ale umowa nie została jeszcze podpisana przez klienta.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-foreground">{pendingContractsCount}</div>
                <p className="text-xs text-purple-500/80 flex items-center mt-1">
                    Oczekujące <ArrowUpRight className="h-3 w-3 ml-1" />
                </p>
            </CardContent>
        </Card>
        </motion.div>
      )}

      {visibleCards.includes('payments') && (
        <motion.div variants={item} className="h-full">
        <Card className="bg-card border-border shadow-none relative overflow-hidden group h-full">
            <Link href="/dashboard/crm/montaze?filter=payments" className="absolute inset-0 z-10" />
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
            <Link href="/dashboard/orders?filter=urgent" className="absolute inset-0 z-10" />
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
            <Link href="/dashboard/orders?filter=invoice" className="absolute inset-0 z-10" />
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
