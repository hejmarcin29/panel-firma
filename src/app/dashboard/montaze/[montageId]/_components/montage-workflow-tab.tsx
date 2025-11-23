"use client";

import { CheckCircle2, Circle, Upload, FileText } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleMontageChecklistItem, uploadChecklistAttachment } from "../../actions";
import type { Montage, MontageChecklistItem } from "../../types";

export function MontageWorkflowTab({ montage }: { montage: Montage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggle = (itemId: string, completed: boolean) => {
    startTransition(async () => {
      await toggleMontageChecklistItem({ montageId: montage.id, itemId, completed });
      router.refresh();
    });
  };

  const handleFileUpload = async (itemId: string, file: File) => {
      // Simple upload handler, in real app should have progress
      const formData = new FormData();
      formData.append('file', file);
      formData.append('montageId', montage.id);
      formData.append('itemId', itemId);
      
      startTransition(async () => {
          await uploadChecklistAttachment(formData);
          router.refresh();
      });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border md:left-8" />
        <div className="space-y-8">
          {montage.checklistItems.map((item, index) => (
            <div key={item.id} className="relative flex gap-4 md:gap-8">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border md:h-16 md:w-16">
                <button
                    onClick={() => handleToggle(item.id, !item.completed)}
                    disabled={pending}
                    className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full transition-colors md:h-10 md:w-10",
                        item.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    {item.completed ? <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6" /> : <Circle className="h-4 w-4 md:h-6 md:w-6" />}
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2 pt-1 md:pt-4">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("font-semibold md:text-lg", item.completed && "text-muted-foreground line-through")}>
                        {item.label}
                    </h3>
                    {item.updatedAt && item.completed && (
                        <span className="text-xs text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
                
                {item.allowAttachment && (
                    <div className="mt-2">
                        {item.attachment ? (
                            <Card className="inline-flex items-center gap-2 p-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <a href={item.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                                    {item.attachment.title || "Załącznik"}
                                </a>
                            </Card>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id={`file-${item.id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(item.id, file);
                                    }}
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <label htmlFor={`file-${item.id}`} className="cursor-pointer">
                                        <Upload className="mr-2 h-3 w-3" />
                                        Dodaj dokument
                                    </label>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
