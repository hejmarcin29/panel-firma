'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, CreditCard, Truck } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  status: string;
  orderDate: Date | null;
  totalNet: number;
  currency: string;
  supplier: {
    name: string;
  } | null;
}

interface PurchasesListProps {
  data: PurchaseOrder[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function PurchasesList({ data }: PurchasesListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Brak zamówień.
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Lista zamówień</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Dostawca</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data zamówienia</TableHead>
                <TableHead>Wartość Netto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.supplier?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'received' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{(order.totalNet / 100).toFixed(2)} {order.currency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {data.map((order) => (
          <motion.div key={order.id} variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>#{order.id.slice(0, 8)}</span>
                  <Badge variant={order.status === 'received' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.supplier?.name || 'Nieznany dostawca'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold">{(order.totalNet / 100).toFixed(2)} {order.currency}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
