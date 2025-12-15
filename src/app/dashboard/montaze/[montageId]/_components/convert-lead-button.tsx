"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { updateMontageStatus } from "../../actions";

interface ConvertLeadButtonProps {
  montageId: string;
}

export function ConvertLeadButton({ montageId }: ConvertLeadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConvert = () => {
    startTransition(async () => {
      try {
        await updateMontageStatus({ 
            montageId, 
            status: "before_measurement" 
        });
        toast.success("Lead zaakceptowany! Przeniesiono do pomiarów.");
        router.refresh();
      } catch (error) {
        toast.error("Wystąpił błąd podczas akceptacji leada");
        console.error(error);
      }
    });
  };

  return (
    <Button 
        onClick={handleConvert} 
        disabled={isPending}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
        size="lg"
    >
      {isPending ? (
        "Przetwarzanie..."
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Akceptuj i zleć pomiar
        </>
      )}
    </Button>
  );
}
