import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Truck, 
  Banknote, 
  Package,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  switch (status) {
    case 'order.received':
      return (
        <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 gap-1.5", className)}>
          <AlertCircle className="h-3.5 w-3.5" />
          Nowe
        </Badge>
      );
    case 'order.pending_proforma':
      return (
        <Badge variant="outline" className={cn("bg-orange-50 text-orange-700 border-orange-200 gap-1.5", className)}>
          <Clock className="h-3.5 w-3.5" />
          Oczekuje na proformę
        </Badge>
      );
    case 'order.proforma_issued':
      return (
        <Badge variant="outline" className={cn("bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5", className)}>
          <FileText className="h-3.5 w-3.5" />
          Proforma wysłana
        </Badge>
      );
    case 'order.awaiting_payment':
      return (
        <Badge variant="outline" className={cn("bg-blue-50 text-blue-700 border-blue-200 gap-1.5", className)}>
          <Banknote className="h-3.5 w-3.5" />
          Oczekuje na płatność
        </Badge>
      );
    case 'order.paid':
      return (
        <Badge variant="outline" className={cn("bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5", className)}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Opłacone
        </Badge>
      );
    case 'order.advance_invoice':
      return (
        <Badge variant="outline" className={cn("bg-purple-50 text-purple-700 border-purple-200 gap-1.5", className)}>
          <FileText className="h-3.5 w-3.5" />
          Faktura zaliczkowa
        </Badge>
      );
    case 'order.forwarded_to_supplier':
      return (
        <Badge variant="outline" className={cn("bg-indigo-50 text-indigo-700 border-indigo-200 gap-1.5", className)}>
          <Truck className="h-3.5 w-3.5" />
          Wysłane do dostawcy
        </Badge>
      );
    case 'order.fulfillment_confirmed':
      return (
        <Badge variant="outline" className={cn("bg-teal-50 text-teal-700 border-teal-200 gap-1.5", className)}>
          <Package className="h-3.5 w-3.5" />
          Zrealizowane
        </Badge>
      );
    case 'order.final_invoice':
      return (
        <Badge variant="outline" className={cn("bg-pink-50 text-pink-700 border-pink-200 gap-1.5", className)}>
          <FileText className="h-3.5 w-3.5" />
          Faktura końcowa
        </Badge>
      );
    case 'order.closed':
      return (
        <Badge variant="secondary" className={cn("bg-gray-100 text-gray-600 gap-1.5", className)}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Zakończone
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className={cn("bg-gray-50 text-gray-500 border-gray-200 gap-1.5", className)}>
          <XCircle className="h-3.5 w-3.5" />
          Anulowane
        </Badge>
      );
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}
