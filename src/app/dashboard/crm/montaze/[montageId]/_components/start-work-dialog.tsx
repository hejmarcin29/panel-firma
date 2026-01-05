"use client";

import { useState, useRef, useTransition } from "react";
import { Camera, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface StartWorkDialogProps {
  montageId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StartWorkDialog({ montageId, trigger, open, onOpenChange }: StartWorkDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) return;

    startTransition(async () => {
      try {
        // 1. Upload Photo
        const formData = new FormData();
        formData.append("montageId", montageId);
        formData.append("file", file);
        formData.append("title", "Stan przed montażem");
        formData.append("category", MontageSubCategories.MEASUREMENT_BEFORE);
        
        await addMontageAttachment(formData);

        // 2. Update Status
        await updateMontageStatus({ montageId, status: 'installation_in_progress' });

        toast.success("Praca rozpoczęta! Powodzenia.");
        router.refresh();
        if (onOpenChange) onOpenChange(false);
      } catch (error) {
        console.error(error);
        toast.error("Wystąpił błąd podczas rozpoczynania pracy.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rozpoczęcie Montażu</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Przed rozpoczęciem pracy wykonaj zdjęcie zastanego stanu pomieszczenia." 
              : "Potwierdź rozpoczęcie prac."}
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
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gotowy do startu?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Zdjęcie zostało dodane. Kliknij poniżej, aby zmienić status na "W toku" i rozpocząć licznik czasu.
                </p>
              </div>
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
              Dalej
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Wróć
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rozpocznij Pracę
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
