'use client';

import * as React from 'react';
import { Send, RefreshCw, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { sendMail } from '../actions';
import type { MailAccountSummary } from '../types';
import { Card } from '@/components/ui/card';

export type ComposeDefaults = {
  accountId?: string;
  to?: string;
  subject?: string;
  body?: string;
};

interface ComposeFormProps {
  accounts: MailAccountSummary[];
  defaults?: ComposeDefaults;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ComposeForm({ accounts, defaults, onSuccess, onCancel, className }: ComposeFormProps) {
  const [state, formAction, isPending] = React.useActionState(sendMail, { status: 'idle' });
  const formRef = React.useRef<HTMLFormElement>(null);
  const [showCc, setShowCc] = React.useState(false);
  const [showBcc, setShowBcc] = React.useState(false);

  // Handle success
  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success("Wiadomość została wysłana");
      formRef.current?.reset();
      onSuccess?.();
    } else if (state.status === 'error') {
      toast.error(state.message || "Błąd wysyłania wiadomości");
    }
  }, [state, onSuccess]);

  return (
    <Card className={cn("border-0 shadow-none", className)}>
      <form ref={formRef} action={formAction} className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="accountId" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Od</Label>
            <div className="relative">
              <select
                id="accountId"
                name="accountId"
                defaultValue={defaults?.accountId || accounts[0]?.id}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
                )}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.displayName} &lt;{acc.email}&gt;
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="to" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Do</Label>
                <div className="flex gap-2 text-xs text-muted-foreground">
                    {!showCc && <button type="button" onClick={() => setShowCc(true)} className="hover:text-foreground">DW</button>}
                    {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="hover:text-foreground">UDW</button>}
                </div>
            </div>
            <Input 
                id="to" 
                name="to" 
                placeholder="Odbiorca" 
                defaultValue={defaults?.to} 
                required 
                className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent"
            />
            {state.errors?.to && <p className="text-xs text-destructive">{state.errors.to}</p>}
          </div>

          {showCc && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="cc" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DW</Label>
                    <button type="button" onClick={() => setShowCc(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3"/></button>
                </div>
                <Input 
                    id="cc" 
                    name="cc" 
                    placeholder="Kopia" 
                    className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent"
                />
            </div>
          )}

          {showBcc && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="bcc" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">UDW</Label>
                    <button type="button" onClick={() => setShowBcc(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3"/></button>
                </div>
                <Input 
                    id="bcc" 
                    name="bcc" 
                    placeholder="Ukryta kopia" 
                    className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent"
                />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temat</Label>
            <Input 
                id="subject" 
                name="subject" 
                placeholder="Temat wiadomości" 
                defaultValue={defaults?.subject} 
                className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary shadow-none bg-transparent font-medium text-lg"
            />
          </div>

          <div className="grid gap-2">
            <Textarea 
              id="body" 
              name="body" 
              placeholder="Napisz coś..." 
              className="min-h-[300px] border-0 focus-visible:ring-0 resize-none p-0 text-base leading-relaxed shadow-none bg-transparent" 
              defaultValue={defaults?.body}
              required 
            />
            {state.errors?.body && <p className="text-xs text-destructive">{state.errors.body}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachments" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground w-fit p-2 rounded-md hover:bg-muted transition-colors">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">Dodaj załączniki</span>
            </Label>
            <Input id="attachments" name="attachments" type="file" multiple className="hidden" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>Anuluj</Button>
          )}
          <Button type="submit" disabled={isPending} className="ml-auto rounded-full px-8">
            {isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Wyślij
          </Button>
        </div>
      </form>
    </Card>
  );
}
