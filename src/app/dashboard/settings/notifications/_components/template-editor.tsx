'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { updateTemplate, sendTest } from '../actions';

interface TemplateEditorProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any; // Using any for simplicity in rapid dev, or define Type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventDef: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TemplateEditor({ template, eventDef, open, onOpenChange }: TemplateEditorProps) {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Test section
    const [testRecipient, setTestRecipient] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (template) {
            setSubject(template.subject || '');
            setContent(template.content || '');
            // Suggest recipient based on user role? Default empty.
        }
    }, [template]);

    const handleSave = async () => {
        if (!template) return;
        setIsSaving(true);
        try {
            await updateTemplate(template.id, { subject, content });
            toast.success('Szablon zapisany');
            onOpenChange(false);
        } catch {
            toast.error('Błąd zapisu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!template || !testRecipient) return;
        setIsTesting(true);
        try {
            const res = await sendTest(template.id, testRecipient);
            if (res?.success) {
                toast.success('Test wysłany!');
            } else {
                toast.error('Błąd wysyłki testu: ' + res?.error);
            }
        } catch {
            toast.error('Błąd');
        } finally {
            setIsTesting(false);
        }
    };

    const insertVariable = (variable: string) => {
        // TODO: Smart cursor insertion? For now just append.
        setContent(prev => prev + ` {{${variable}}} `);
    };

    if (!template) return null;

    const isEmail = template.channel === 'email';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {isEmail ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        Edycja Szablonu: {eventDef?.label}
                    </SheetTitle>
                    <SheetDescription>
                        Dostosuj treść powiadomienia wysyłanego automatycznie.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Variable Chips */}
                    <div className="space-y-2">
                        <Label>Dostępne zmienne (kliknij aby wstawić):</Label>
                        <div className="flex flex-wrap gap-2">
                            {eventDef?.variables?.map((v: string) => (
                                <Badge 
                                    key={v} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-secondary transition-colors"
                                    onClick={() => insertVariable(v)}
                                >
                                    {v}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isEmail && (
                            <div className="space-y-2">
                                <Label>Temat Email</Label>
                                <Input value={subject} onChange={e => setSubject(e.target.value)} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>{isEmail ? 'Treść HTML' : 'Treść SMS'}</Label>
                            <Textarea 
                                value={content} 
                                onChange={e => setContent(e.target.value)} 
                                rows={10} 
                                className="font-mono text-xs" 
                            />
                            {isEmail && <p className="text-xs text-muted-foreground">Możesz używać znaczników HTML (b, u, br, p...)</p>}
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Wyślij podgląd testowy</Label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder={isEmail ? "Twój email..." : "Twój nr telefonu..."} 
                                value={testRecipient}
                                onChange={e => setTestRecipient(e.target.value)}
                                className="h-9"
                            />
                            <Button size="sm" onClick={handleTest} disabled={isTesting || !testRecipient}>
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Wyślij
                            </Button>
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Zapisz Zmiany
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
