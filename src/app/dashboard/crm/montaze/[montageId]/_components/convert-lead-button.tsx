"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMontageStatus } from "../../actions";

interface ConvertLeadButtonProps {
  montageId: string;
}

export function ConvertLeadButton({ montageId }: ConvertLeadButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
        return await updateMontageStatus({ 
            montageId, 
            status: "before_measurement" 
        });
    },
    onSuccess: () => {
        toast.success("Lead zaakceptowany! Przeniesiono do pomiarów.");
        // Invalidate the query to force a refetch of the fresh data (with new status)
        queryClient.invalidateQueries({ queryKey: ['montage', montageId] });
        router.refresh();
    },
    onError: (error) => {
        toast.error("Wystąpił błąd podczas akceptacji leada");
        console.error(error);
    }
  });

  return (
    <Button 
        onClick={() => mutate()} 
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
