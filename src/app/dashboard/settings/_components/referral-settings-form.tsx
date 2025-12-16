'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { updateReferralSettings } from '../referral-actions';

type Props = {
    initialEnabled: boolean;
};

export function ReferralSettingsForm({ initialEnabled }: Props) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateReferralSettings(isEnabled);
            toast.success('Zapisano ustawienia programu poleceń');
        } catch (error) {
            toast.error('Nie udało się zapisać ustawień');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Program Poleceń
                </CardTitle>
                <CardDescription>
                    Zarządzaj dostępnością programu partnerskiego i portalu klienta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="referral-enabled" className="text-base">
                            Włącz Program Poleceń
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Jeśli wyłączysz tę opcję, klienci nie będą mogli korzystać z portalu ani generować linków.
                        </p>
                    </div>
                    <Switch
                        id="referral-enabled"
                        checked={isEnabled}
                        onCheckedChange={setIsEnabled}
                    />
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!isSaving && <Save className="mr-2 h-4 w-4" />}
                        Zapisz zmiany
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
