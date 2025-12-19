'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import { acceptInstallationDate, rejectInstallationDate } from '../actions';

interface InstallationDateCardProps {
  montageId: string;
  token: string;
  scheduledDate: Date;
  scheduledEndDate?: Date | null;
}

export function InstallationDateCard({ montageId, token, scheduledDate, scheduledEndDate }: InstallationDateCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptInstallationDate(montageId, token);
      toast.success('Termin został zaakceptowany! Dziękujemy.');
    } catch (error) {
      toast.error('Wystąpił błąd.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
        toast.error('Proszę podać powód lub proponowany termin.');
        return;
    }
    setIsRejecting(true);
    try {
      await rejectInstallationDate(montageId, token, rejectReason);
      toast.success('Twoja prośba została wysłana do biura.');
      setRejectDialogOpen(false);
    } catch (error) {
      toast.error('Wystąpił błąd.');
    } finally {
      setIsRejecting(false);
    }
  };

  const formattedDate = format(scheduledDate, 'd MMMM yyyy', { locale: pl });
  const formattedEndDate = scheduledEndDate ? format(scheduledEndDate, 'd MMMM yyyy', { locale: pl }) : null;
  
  const dateDisplay = formattedEndDate && formattedEndDate !== formattedDate
    ? `${formattedDate} - ${formattedEndDate}`
    : formattedDate;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Calendar className="h-5 w-5" />
          Propozycja Terminu Montażu
        </CardTitle>
        <CardDescription>
          Zarezerwowaliśmy dla Ciebie termin. Prosimy o potwierdzenie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4 bg-white dark:bg-zinc-900 rounded-lg border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Termin</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100 capitalize">
                {dateDisplay}
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
            >
                {isAccepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                Akceptuję Termin
            </Button>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 h-12 text-lg border-blue-200 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-800 dark:hover:bg-blue-900/50">
                        Proszę o zmianę
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zmiana terminu</DialogTitle>
                        <DialogDescription>
                            Napisz, jaki termin Ci pasuje lub dlaczego obecny jest nieodpowiedni. Skontaktujemy się z Tobą.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Np. W tym tygodniu jestem na urlopie. Pasuje mi po 20-tym..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Anuluj</Button>
                        <Button onClick={handleReject} disabled={isRejecting}>
                            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Wyślij prośbę'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
