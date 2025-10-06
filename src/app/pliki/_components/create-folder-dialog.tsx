"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FolderPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createClientFolderAction } from "../actions";
import { INITIAL_CREATE_FOLDER_STATE, type CreateFolderState } from "../form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="rounded-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          Tworzenie…
        </>
      ) : (
        <>
          <FolderPlus className="mr-2 size-4" aria-hidden />
          Utwórz folder
        </>
      )}
    </Button>
  );
}

export function CreateFolderDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<CreateFolderState, FormData>(
    createClientFolderAction,
    INITIAL_CREATE_FOLDER_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="rounded-full border-primary/50 text-primary">
          <FolderPlus className="mr-2 size-4" aria-hidden />
          Nowy folder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl border border-border/60">
        <DialogHeader>
          <DialogTitle>Dodaj folder klienta</DialogTitle>
          <DialogDescription>
            Wprowadź identyfikator (np. numer klienta) i opcjonalną nazwę wyświetlaną. Folder zostanie utworzony w R2 i
            będzie widoczny na liście, nawet jeśli jeszcze nie ma w nim plików.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Identyfikator folderu</Label>
            <Input
              id="clientId"
              name="clientId"
              placeholder="np. CL-1024"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientLabel">Nazwa wyświetlana (opcjonalnie)</Label>
            <Input
              id="clientLabel"
              name="clientLabel"
              placeholder="np. Studio Projektów Warszawa"
              autoComplete="off"
            />
          </div>
          {state.status === "error" ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message ?? "Nie udało się utworzyć folderu."}
            </p>
          ) : null}
          <DialogFooter className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Foldery przyjmują strukturę <span className="font-mono">{`clientId_nazwa-klienta`}</span>.
            </p>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
