'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { updateCompanySettings } from '../actions';

type Props = {
    initialName: string;
    initialAddress: string;
    initialNip: string;
    initialBankName: string;
    initialBankAccount: string;
};

export function CompanySettingsForm({
    initialName,
    initialAddress,
    initialNip,
    initialBankName,
    initialBankAccount,
}: Props) {
    const [formData, setFormData] = useState({
        name: initialName,
        address: initialAddress,
        nip: initialNip,
        bankName: initialBankName,
        bankAccount: initialBankAccount,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateCompanySettings(formData);
            toast.success('Zapisano dane firmy');
        } catch (error) {
            toast.error('Nie udało się zapisać danych firmy');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dane firmy</CardTitle>
                <CardDescription>
                    Te dane będą widoczne na wycenach i innych dokumentach generowanych przez system.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Nazwa firmy</Label>
                    <Input
                        id="company-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Moja Firma Sp. z o.o."
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="company-address">Adres</Label>
                    <Input
                        id="company-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="ul. Przykładowa 1, 00-000 Warszawa"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company-nip">NIP</Label>
                    <Input
                        id="company-nip"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        placeholder="1234567890"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank-name">Nazwa banku</Label>
                        <Input
                            id="bank-name"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="mBank"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bank-account">Numer konta</Label>
                        <Input
                            id="bank-account"
                            value={formData.bankAccount}
                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                            placeholder="00 0000 0000 0000 0000 0000 0000"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
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
