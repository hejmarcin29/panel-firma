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
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Building2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  nip: string | null;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  address: string | null;
}

interface SuppliersListProps {
  data: Supplier[];
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

export function SuppliersList({ data }: SuppliersListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Brak dostawców. Dodaj pierwszego!
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Lista dostawców</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Osoba kontaktowa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.nip || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.contactPerson || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {data.map((supplier) => (
          <motion.div key={supplier.id} variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  {supplier.name}
                  {supplier.nip && (
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                      NIP: {supplier.nip}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${supplier.email}`} className="hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${supplier.phone}`} className="hover:underline">
                      {supplier.phone}
                    </a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
