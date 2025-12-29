'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateMontageData } from '../actions';
import { Loader2, Edit2 } from 'lucide-react';

interface MontageData {
    id: string;
    address?: string | null;
    installationCity?: string | null;
    installationPostalCode?: string | null;
    floorArea?: number | null;
    estimatedFloorArea?: number | null;
    additionalInfo?: string | null;
}

interface DataRequestCardProps {
    montage: MontageData;
    token: string;
}

export function DataRequestCard({ montage, token }: DataRequestCardProps) {
    // Auto-open if critical data is missing
    const isMissingData = !montage.address || !montage.installationCity || !montage.installationPostalCode;
    
    const [isEditing, setIsEditing] = useState(isMissingData);
    const [isSaving, setIsSaving] = useState(false);
    
    // Initial values
    const [formData, setFormData] = useState({
        address: montage.address || '',
        city: montage.installationCity || '',
        postalCode: montage.installationPostalCode || '',
        floorArea: montage.estimatedFloorArea?.toString() || montage.floorArea?.toString() || '',
        notes: montage.additionalInfo || ''
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMontageData(montage.id, formData, token);
            toast.success('Dane zostały zaktualizowane!');
            setIsEditing(false);
        } catch {
            toast.error('Wystąpił błąd podczas zapisu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Dane do pomiaru</span>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edytuj
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Prosimy o uzupełnienie lub weryfikację danych adresowych.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Adres:</span>
                        <span className="font-medium">{montage.address || '-'}</span>
                        
                        <span className="text-muted-foreground">Miasto:</span>
                        <span className="font-medium">{montage.installationCity || '-'}</span>
                        
                        <span className="text-muted-foreground">Kod pocztowy:</span>
                        <span className="font-medium">{montage.installationPostalCode || '-'}</span>
                        
                        <span className="text-muted-foreground">Powierzchnia (m²):</span>
                        <span className="font-medium">{montage.estimatedFloorArea || montage.floorArea || '-'}</span>
                    </div>
                    {montage.additionalInfo && (
                        <div className="mt-2 pt-2 border-t text-sm">
                            <span className="text-muted-foreground block mb-1">Uwagi:</span>
                            <p>{montage.additionalInfo}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary shadow-md border-2">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-primary">Uzupełnij dane do pomiaru</CardTitle>
                <CardDescription>
                    Wprowadź adres, pod którym ma odbyć się pomiar i montaż.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                    <Label>Ulica i numer</Label>
                    <Input 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="np. Kwiatowa 15/3"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Miasto</Label>
                        <Input 
                            value={formData.city} 
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            placeholder="np. Warszawa"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Kod pocztowy</Label>
                        <Input 
                            value={formData.postalCode} 
                            onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                            placeholder="00-000"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Szacowana powierzchnia (m²)</Label>
                    <Input 
                        type="number"
                        value={formData.floorArea} 
                        onChange={(e) => setFormData({...formData, floorArea: e.target.value})}
                        placeholder="np. 50"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Dodatkowe uwagi (kod do domofonu, piętro)</Label>
                    <Textarea 
                        value={formData.notes} 
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="np. 3 piętro, winda, kod 1234"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Anuluj
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Zapisz dane
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
