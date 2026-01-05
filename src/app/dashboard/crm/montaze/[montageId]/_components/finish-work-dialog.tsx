"use client";

import { useState, useRef, useTransition } from "react";
import { Camera, CheckCircle2, AlertTriangle, Loader2, PenTool, Eraser } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addMontageAttachment, updateMontageStatus } from "../../actions";
import { MontageSubCategories } from "@/lib/r2/constants";

interface FinishWorkDialogProps {
  montageId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FinishWorkDialog({ montageId, trigger, open, onOpenChange }: FinishWorkDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = () => {
    if (!file) {
        toast.error("Brak zdjęcia końcowego!");
        return;
    }
    if (sigCanvas.current?.isEmpty()) {
        toast.error("Brak podpisu klienta!");
        return;
    }

    startTransition(async () => {
      try {
        // 1. Upload Photo "AFTER"
        const photoFormData = new FormData();
        photoFormData.append("montageId", montageId);
        photoFormData.append("file", file);
        photoFormData.append("title", "Stan po montażu");
        photoFormData.append("category", MontageSubCategories.REALIZATION);
        
        await addMontageAttachment(photoFormData);

        // 2. Upload Signature
        // Convert canvas to blob
        const signatureDataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (signatureDataUrl) {
            const res = await fetch(signatureDataUrl);
            const blob = await res.blob();
            const sigFile = new File([blob], "podpis_klienta.png", { type: "image/png" });

            const sigFormData = new FormData();
            sigFormData.append("montageId", montageId);
            sigFormData.append("file", sigFile);
            sigFormData.append("title", "Podpis Klienta (Protokół)");
            sigFormData.append("category", MontageSubCategories.PROTOCOLS);
            
            await addMontageAttachment(sigFormData);
        }

        // 3. Update Status
        await updateMontageStatus({ montageId, status: 'protocol_signed' });

        toast.success("Montaż zakończony! Protokół podpisany.");
        router.refresh();
        if (onOpenChange) onOpenChange(false);
      } catch (error) {
        console.error(error);
        toast.error("Wystąpił błąd podczas zapisywania protokołu.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zakończenie Montażu</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Krok 1/2: Wykonaj zdjęcie efektu końcowego (wymagane)." 
              : "Krok 2/2: Podpis Klienta."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="relative w-full h-full p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-md" 
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Kliknij, aby zrobić zdjęcie</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
               <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <p className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Informacja dla Klienta:
                    </p>
                    <p className="mt-1">
                        Zatwierdzenie protokołu spowoduje natychmiastowe wysłanie kopii dokumentu na Twój adres email.
                    </p>
               </div>

               <div className="border-2 border-gray-300 rounded-lg bg-white relative h-64 w-full touch-none">
                    <SignatureCanvas 
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{
                            className: "w-full h-full rounded-lg"
                        }}
                        backgroundColor="rgba(255,255,255,1)"
                    />
                    <div className="absolute top-2 right-2">
                        <Button variant="outline" size="sm" onClick={clearSignature}>
                            <Eraser className="w-4 h-4 mr-2" />
                            Wyczyść
                        </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 pointer-events-none opacity-30">
                        <PenTool className="w-6 h-6" />
                    </div>
               </div>
               <p className="text-xs text-center text-muted-foreground">
                   Podpisz palcem w ramce powyżej
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)} 
              disabled={!file} 
              className="w-full"
            >
              Dalej (Do Podpisu)
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Wróć
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zatwierdź Protokół
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
