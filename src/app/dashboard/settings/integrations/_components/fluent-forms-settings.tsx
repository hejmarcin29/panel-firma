"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Check, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { regenerateFluentFormsSecret } from "../fluent-actions";

interface FluentFormsSettingsProps {
    initialSecret: string | null;
    baseUrl: string;
}

export function FluentFormsSettings({ initialSecret, baseUrl }: FluentFormsSettingsProps) {
    const [secret, setSecret] = useState<string | null>(initialSecret);
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);

    const webhookUrl = `${baseUrl}/api/integrations/fluent-forms`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Skopiowano do schowka");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = () => {
        if (!confirm("Czy na pewno chcesz wygenerować nowy klucz? Stary przestanie działać natychmiast.")) {
            return;
        }

        startTransition(async () => {
            try {
                const newSecret = await regenerateFluentFormsSecret();
                setSecret(newSecret);
                toast.success("Nowy klucz został wygenerowany");
            } catch (error) {
                toast.error("Wystąpił błąd podczas generowania klucza");
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Konfiguracja Fluent Forms</CardTitle>
                    <CardDescription>
                        Połącz formularze WordPress z panelem, aby automatycznie tworzyć leady.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!secret ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Brak konfiguracji</AlertTitle>
                            <AlertDescription>
                                Nie wygenerowano jeszcze klucza API. Kliknij przycisk poniżej, aby rozpocząć.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <div className="flex gap-2">
                                    <Input value={webhookUrl} readOnly className="font-mono bg-muted" />
                                    <Button variant="outline" size="icon" onClick={() => handleCopy(webhookUrl)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Wklej ten adres w polu <strong>Request URL</strong> w ustawieniach Webhooka Fluent Forms.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Secret Key (Nagłówek)</Label>
                                <div className="flex gap-2">
                                    <Input type="password" value={secret} readOnly className="font-mono bg-muted" />
                                    <Button variant="outline" size="icon" onClick={() => handleCopy(secret)}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Dodaj nagłówek: <code>x-api-secret</code> z tą wartością.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button 
                            variant={secret ? "outline" : "default"} 
                            onClick={handleRegenerate} 
                            disabled={isPending}
                        >
                            {isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            {secret ? "Wygeneruj nowy klucz" : "Wygeneruj pierwszy klucz"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mapowanie Pól (Ściągawka)</CardTitle>
                    <CardDescription>
                        Skonfiguruj sekcję <strong>Request Body</strong> w Fluent Forms używając poniższych kluczy JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6 bg-blue-50 text-blue-900 border-blue-200">
                        <Info className="h-4 w-4 text-blue-900" />
                        <AlertTitle>Ważne</AlertTitle>
                        <AlertDescription>
                            W ustawieniach Webhooka wybierz <strong>Request Format: JSON</strong>.
                        </AlertDescription>
                    </Alert>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Klucz JSON (Key)</TableHead>
                                <TableHead>Opis pola w Panelu</TableHead>
                                <TableHead>Wymagane?</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-mono font-medium">client_name</TableCell>
                                <TableCell>Imię i nazwisko klienta</TableCell>
                                <TableCell><Badge variant="default">Tak</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono font-medium">contact_email</TableCell>
                                <TableCell>Adres email (służy do identyfikacji klienta)</TableCell>
                                <TableCell><Badge variant="default">Tak</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono font-medium">contact_phone</TableCell>
                                <TableCell>Numer telefonu</TableCell>
                                <TableCell><Badge variant="secondary">Opcjonalne</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono font-medium">message</TableCell>
                                <TableCell>Treść wiadomości / Opis zlecenia</TableCell>
                                <TableCell><Badge variant="secondary">Opcjonalne</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono font-medium">city</TableCell>
                                <TableCell>Miasto montażu</TableCell>
                                <TableCell><Badge variant="secondary">Opcjonalne</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono font-medium">postal_code</TableCell>
                                <TableCell>Kod pocztowy</TableCell>
                                <TableCell><Badge variant="secondary">Opcjonalne</Badge></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
