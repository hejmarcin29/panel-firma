"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Copy, MessageSquare, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendDataRequest } from "../../actions";
import type { Montage } from "../../types";

interface RequestDataButtonProps {
  montage: Montage;
  requireInstallerForMeasurement?: boolean;
  ignoreSampleStatus?: boolean;
}

export function RequestDataButton({ montage, requireInstallerForMeasurement, ignoreSampleStatus }: RequestDataButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<{ link: string; message: string; sentChannels: string[] } | null>(null);

  const handleRequestData = () => {
    startTransition(async () => {
      try {
        const response = await sendDataRequest(montage.id);
        
        if (response && response.link) {
            setResult({
                link: response.link,
                message: response.message,
                sentChannels: response.sentChannels || []
            });
            setIsOpen(true);
            
            if (response.sentChannels && response.sentChannels.length > 0) {
                toast.success(`Wysłano automatycznie przez: ${response.sentChannels.join(', ')}`);
            }
        } else {
            // Fallback for older server action version or void return
             toast.success("Wysłano prośbę o uzupełnienie danych");
        }
      } catch (error) {
        console.error(error);
        toast.error("Wystąpił błąd podczas wysyłania prośby");
      }
    });
  };

  const copyToClipboard = () => {
    if (result?.link) {
        navigator.clipboard.writeText(result.link);
        toast.success("Skopiowano link do schowka");
    }
  };

  const shareNative = async () => {
    if (result && navigator.share) {
        try {
            await navigator.share({
                title: 'Prime Podłoga - Panel Klienta',
                text: result.message,
                url: result.link
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        copyToClipboard();
        toast.info("Użyj skopiowanego linku w swojej aplikacji");
    }
  };

  const openSms = () => {
      if (result && montage.contactPhone) {
          const body = encodeURIComponent(result.message);
          window.location.href = `sms:${montage.contactPhone}?body=${body}`;
      } else {
          toast.error("Brak numeru telefonu klienta");
      }
  };

  const isSampleBlocking = !ignoreSampleStatus && (montage.sampleStatus === 'to_send' || montage.sampleStatus === 'sent');
  const isInstallerBlocking = requireInstallerForMeasurement && !montage.installerId;

  if (isSampleBlocking) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block w-full sm:w-auto">
              <Button 
                variant="outline"
                className="w-full sm:w-auto border-blue-200 bg-blue-50 text-blue-400 cursor-not-allowed"
                disabled
              >
                <Send className="mr-2 h-4 w-4" />
                Poproś o dane
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Musisz zweryfikować próbki (status &quot;Dostarczono&quot; lub &quot;Brak&quot;) aby przejść dalej.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isInstallerBlocking) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block w-full sm:w-auto">
              <Button 
                variant="outline"
                className="w-full sm:w-auto border-blue-200 bg-blue-50 text-blue-400 cursor-not-allowed"
                disabled
              >
                <Send className="mr-2 h-4 w-4" />
                Poproś o dane
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Wymagane przypisanie montażysty przed zleceniem pomiaru.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
        <Button 
        variant="outline" 
        onClick={handleRequestData} 
        disabled={isPending}
        className="w-full sm:w-auto border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
        {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Send className="mr-2 h-4 w-4" />
        )}
        Poproś o dane
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Wyślij dostęp do Portalu</DialogTitle>
                    <DialogDescription>
                        Udostępnij ten link klientowi, aby uzupełnił dane niezbędne do pomiaru / montażu.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={result?.link}
                            readOnly
                        />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
                        <span className="sr-only">Kopiuj</span>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>

                {result?.sentChannels?.includes('Email') && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                        <Check className="h-4 w-4" />
                        <span>Wysłano automatycznie na e-mail klienta.</span>
                    </div>
                )}
                
                <DialogFooter className="flex-col sm:justify-start gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            className="w-full gap-2"
                            onClick={openSms}
                        >
                            <MessageSquare className="h-4 w-4" />
                            Wyślij SMS
                        </Button>
                        <Button 
                            type="button" 
                            className="w-full gap-2"
                            onClick={shareNative}
                        >
                            <Share2 className="h-4 w-4" />
                            Udostępnij
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
