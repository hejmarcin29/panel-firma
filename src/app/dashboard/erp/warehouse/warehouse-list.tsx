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
import { Barcode, Layers } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  stockStatus: string | null;
  stockQuantity: number | null;
}

interface WarehouseListProps {
  data: Product[];
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

export function WarehouseList({ data }: WarehouseListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Brak produktów.
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Stany magazynowe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ilość</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={product.stockStatus === 'instock' ? 'default' : 'destructive'}>
                      {product.stockStatus === 'instock' ? 'Dostępny' : 'Brak'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {product.stockQuantity || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {data.map((product) => (
          <motion.div key={product.id} variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span className="truncate pr-2">{product.name}</span>
                  <Badge variant={product.stockStatus === 'instock' ? 'default' : 'destructive'}>
                    {product.stockStatus === 'instock' ? 'Dostępny' : 'Brak'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{product.sku || 'Brak SKU'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">{product.stockQuantity || 0} szt.</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
