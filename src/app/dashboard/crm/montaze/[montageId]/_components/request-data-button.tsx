"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sendDataRequest } from "../../actions";
import type { Montage } from "../../types";

interface RequestDataButtonProps {
  montage: Montage;
  requireInstallerForMeasurement?: boolean;
}

export function RequestDataButton({ montage, requireInstallerForMeasurement }: RequestDataButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRequestData = () => {
    startTransition(async () => {
      try {
        await sendDataRequest(montage.id);
        toast.success("Wysłano prośbę o uzupełnienie danych (SMS/Email)");
      } catch (error) {
        console.error(error);
        toast.error("Wystąpił błąd podczas wysyłania prośby");
      }
    });
  };

  const isSampleBlocking = montage.sampleStatus === 'to_send' || montage.sampleStatus === 'sent';
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
    <Button 
      variant="outline" 
      onClick={handleRequestData} 
      disabled={isPending}
      className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Poproś o dane
    </Button>
  );
}
