'use client';

import { useState } from 'react';
import { Copy, Check, Banknote, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface PaymentCardProps {
  quoteNumber: string;
  totalAmount: number; // in PLN
  isPaid: boolean;
  bankAccount?: string;
}

export function PaymentCard({ 
    quoteNumber, 
    totalAmount, 
    isPaid,
    bankAccount = "12 3456 7890 0000 0000 1234 5678" 
}: PaymentCardProps) {
  const [copied, setCopied] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccount.replace(/\s/g, ''));
    setCopied(true);
    toast.success('Numer konta skopiowany do schowka');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPaid) {
      return (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Płatność uregulowana</h3>
                    <p className="text-green-700 dark:text-green-300">Dziękujemy za dokonanie wpłaty.</p>
                </div>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Banknote className="h-5 w-5" />
          Dane do przelewu
        </CardTitle>
        <CardDescription>
          Poniżej znajdują się dane do wykonania przelewu tradycyjnego.
          <br />
          <span className="font-medium text-amber-800 dark:text-amber-300">
            W tytule przelewu prosimy wpisać numer faktury.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Kwota do zapłaty</p>
            <p className="text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100">
                {formatMoney(totalAmount)}
            </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Odbiorca:</span>
                <span className="font-medium">Prime Podłoga</span>
            </div>
            <Separator />
            <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tytuł przelewu:</span>
                    <span className="font-medium">Zaliczka - {quoteNumber}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                    (lub numer faktury, jeśli została wystawiona)
                </p>
            </div>
            <Separator />
            <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Numer konta:</span>
                <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted p-2 rounded text-sm font-mono break-all">
                        {bankAccount}
                    </code>
                    <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
