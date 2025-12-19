'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { Loader2, Check, ChevronRight, ChevronLeft, Camera, PenTool } from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import SignatureCanvas to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false,
  loading: () => <div className="w-full h-[150px] bg-gray-100 animate-pulse rounded-md" />
}) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { uploadSignature, submitMontageProtocol } from '../../../protocol-actions';

interface SignaturePadRef {
  isEmpty: () => boolean;
  toDataURL: (type: string) => string;
  clear: () => void;
}

interface ProtocolWizardProps {
  montageId: string;
  clientName: string;
  installerName: string;
  defaultLocation: string;
  contractNumber?: string;
  contractDate?: Date | null;
  onComplete: () => void;
}

export function ProtocolWizard({
  montageId,
  clientName,
  installerName,
  defaultLocation,
  contractNumber = '',
  contractDate = null,
  onComplete
}: ProtocolWizardProps) {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [location, setLocation] = useState(defaultLocation);
  const [cNumber, setCNumber] = useState(contractNumber);
  const [cDate, setCDate] = useState<string>(contractDate ? format(contractDate, 'yyyy-MM-dd') : '');
  const [isHousingVat, setIsHousingVat] = useState(true);
  const [notes, setNotes] = useState('');

  // Signatures
  const clientSigRef = useRef<SignaturePadRef>(null);
  const installerSigRef = useRef<SignaturePadRef>(null);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!clientSigRef.current || !installerSigRef.current) return;
    if (clientSigRef.current.isEmpty() || installerSigRef.current.isEmpty()) {
        toast.error('Brakuje podpisów!');
        return;
    }

    setIsSubmitting(true);
    try {
        // 1. Upload Signatures
        const clientSigData = clientSigRef.current.toDataURL('image/png');
        const installerSigData = installerSigRef.current.toDataURL('image/png');

        const [clientUrl, installerUrl] = await Promise.all([
            uploadSignature(montageId, clientSigData, 'client'),
            uploadSignature(montageId, installerSigData, 'installer')
        ]);

        // 2. Submit Protocol
        const result = await submitMontageProtocol({
            montageId,
            contractNumber: cNumber,
            contractDate: cDate ? new Date(cDate) : null,
            isHousingVat,
            location,
            notes,
            clientSignatureUrl: clientUrl,
            installerSignatureUrl: installerUrl,
            clientName,
            installerName
        });

        if (result.success) {
            toast.success('Protokół został podpisany i wysłany!');
            setIsOpen(false);
            onComplete();
        } else {
            toast.error('Wystąpił błąd podczas zapisywania protokołu.');
        }

    } catch (error) {
        console.error(error);
        toast.error('Błąd krytyczny.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const clearSignature = (ref: React.MutableRefObject<SignaturePadRef | null>) => {
    ref.current?.clear();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
          <PenTool className="mr-2 h-4 w-4" />
          Protokół Odbioru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[90vh] md:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Protokół Odbioru - Krok {step}/4</DialogTitle>
        </DialogHeader>

        <div className="py-4">
            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">1. Weryfikacja Danych</h3>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Miejscowość</Label>
                            <Input value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nr Umowy</Label>
                                <Input value={cNumber} onChange={e => setCNumber(e.target.value)} placeholder="np. 123/2025" />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Umowy</Label>
                                <Input type="date" value={cDate} onChange={e => setCDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="p-4 bg-muted rounded-md text-sm">
                            <p><strong>Klient:</strong> {clientName}</p>
                            <p><strong>Wykonawca:</strong> {installerName}</p>
                            <p><strong>Data odbioru:</strong> {format(new Date(), 'dd.MM.yyyy')}</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">2. Oświadczenie VAT</h3>
                    <p className="text-muted-foreground text-sm">
                        Wybierz stawkę VAT dla tej usługi.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${isHousingVat ? 'border-green-600 bg-green-50' : 'border-muted hover:border-gray-400'}`}
                            onClick={() => setIsHousingVat(true)}
                        >
                            <Check className={`h-8 w-8 ${isHousingVat ? 'text-green-600' : 'text-gray-300'}`} />
                            <span className="font-bold text-center">Budownictwo Mieszkaniowe (8%)</span>
                            <span className="text-xs text-center text-muted-foreground">Dom do 300m² / Mieszkanie do 150m²</span>
                        </div>

                        <div 
                            className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${!isHousingVat ? 'border-blue-600 bg-blue-50' : 'border-muted hover:border-gray-400'}`}
                            onClick={() => setIsHousingVat(false)}
                        >
                            <Check className={`h-8 w-8 ${!isHousingVat ? 'text-blue-600' : 'text-gray-300'}`} />
                            <span className="font-bold text-center">Lokal Użytkowy / Inne (23%)</span>
                            <span className="text-xs text-center text-muted-foreground">Biura, sklepy, przekroczony metraż</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Uwagi do protokołu (opcjonalne)</Label>
                        <Textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Np. Klient zgłosił rysę na ścianie (niezwiązaną z montażem)..."
                        />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 text-center">
                    <h3 className="font-semibold text-lg">3. Dokumentacja Zdjęciowa</h3>
                    <div className="p-8 border-2 border-dashed rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-4">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                        <p>Upewnij się, że dodałeś zdjęcia z realizacji w zakładce &quot;Galeria&quot;.</p>
                        <p className="text-sm text-muted-foreground">System automatycznie dołączy je do historii zlecenia.</p>
                    </div>
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        ⚠️ Pamiętaj o zdjęciu wilgotnościomierza i efektu końcowego!
                    </p>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">4. Podpisy</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">Podpis Klienta ({clientName})</Label>
                            <div className="border rounded-md bg-white touch-none">
                                <SignatureCanvas 
                                    ref={clientSigRef}
                                    penColor="black"
                                    canvasProps={{className: 'w-full h-[150px]'}}
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => clearSignature(clientSigRef)} className="mt-1 text-xs text-muted-foreground">
                                Wyczyść
                            </Button>
                        </div>

                        <div>
                            <Label className="mb-2 block">Podpis Wykonawcy ({installerName})</Label>
                            <div className="border rounded-md bg-white touch-none">
                                <SignatureCanvas 
                                    ref={installerSigRef}
                                    penColor="black"
                                    canvasProps={{className: 'w-full h-[150px]'}}
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => clearSignature(installerSigRef)} className="mt-1 text-xs text-muted-foreground">
                                Wyczyść
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
            {step > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Wstecz
                </Button>
            ) : (
                <div /> // Spacer
            )}

            {step < 4 ? (
                <Button onClick={handleNext}>
                    Dalej <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Przetwarzanie...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" /> Zatwierdź Protokół
                        </>
                    )}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
