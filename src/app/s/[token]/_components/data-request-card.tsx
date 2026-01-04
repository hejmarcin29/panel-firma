'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { updateMontageData } from '../actions';
import { Loader2, Edit2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MontageData {
    id: string;
    address?: string | null;
    installationCity?: string | null;
    installationPostalCode?: string | null;
    floorArea?: number | null;
    estimatedFloorArea?: number | null;
    additionalInfo?: string | null;
    // Billing
    isCompany?: boolean | null;
    companyName?: string | null;
    nip?: string | null;
    billingAddress?: string | null;
    billingCity?: string | null;
    billingPostalCode?: string | null;
    isHousingVat?: boolean | null;
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
        notes: montage.additionalInfo || '',
        
        isCompany: montage.isCompany || false,
        companyName: montage.companyName || '',
        nip: montage.nip || '',
        billingAddress: montage.billingAddress || '',
        billingCity: montage.billingCity || '',
        billingPostalCode: montage.billingPostalCode || '',
        isHousingVat: montage.isHousingVat || false,
    });

    const [hasDifferentBilling, setHasDifferentBilling] = useState(
        montage.isCompany || 
        (!!montage.billingAddress && montage.billingAddress !== montage.address)
    );

    const handleSave = async () => {
        setIsSaving(true);
        // If not different billing, clear billing fields to match installation (or keep empty/null in DB logic)
        // But for UI consistency, if user unchecks "Different Billing", we should probably clear them or set them to null in the backend.
        // The backend updateMontageData takes partial data. 
        // Let's ensure we send what we see.
        
        const dataToSend = {
            ...formData,
            // If hasDifferentBilling is false, we might want to clear billing fields or set them to match installation?
            // Usually backend handles "if not isCompany and not billingAddress provided, use installation address".
            // But here we have explicit fields.
            // Let's just send formData. If user unchecked hasDifferentBilling, we should have cleared formData in the UI handler.
        };

        try {
            await updateMontageData(montage.id, dataToSend, token);
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
                        <span>Twoje Dane</span>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edytuj
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Adres montażu oraz dane do faktury.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-semibold mb-2">Adres Montażu</h4>
                            <div className="grid grid-cols-[100px_1fr] gap-1">
                                <span className="text-muted-foreground">Adres:</span>
                                <span className="font-medium">{montage.address || '-'}</span>
                                
                                <span className="text-muted-foreground">Miasto:</span>
                                <span className="font-medium">{montage.installationCity || '-'}</span>
                                
                                <span className="text-muted-foreground">Kod:</span>
                                <span className="font-medium">{montage.installationPostalCode || '-'}</span>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2">Dane do Faktury</h4>
                            {formData.isCompany ? (
                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                    <span className="text-muted-foreground">Firma:</span>
                                    <span className="font-medium">{montage.companyName || '-'}</span>
                                    <span className="text-muted-foreground">NIP:</span>
                                    <span className="font-medium">{montage.nip || '-'}</span>
                                    <span className="text-muted-foreground">Adres:</span>
                                    <span className="font-medium">{montage.billingAddress || '-'}</span>
                                    <span className="text-muted-foreground">Miasto:</span>
                                    <span className="font-medium">{montage.billingCity || '-'}</span>
                                    <span className="text-muted-foreground">Kod:</span>
                                    <span className="font-medium">{montage.billingPostalCode || '-'}</span>
                                </div>
                            ) : (formData.billingAddress && formData.billingAddress !== formData.address) ? (
                                <div className="grid grid-cols-[100px_1fr] gap-1">
                                    <span className="text-muted-foreground">Typ:</span>
                                    <span className="font-medium">Osoba Prywatna (inny adres)</span>
                                    <span className="text-muted-foreground">Adres:</span>
                                    <span className="font-medium">{montage.billingAddress || '-'}</span>
                                    <span className="text-muted-foreground">Miasto:</span>
                                    <span className="font-medium">{montage.billingCity || '-'}</span>
                                    <span className="text-muted-foreground">Kod:</span>
                                    <span className="font-medium">{montage.billingPostalCode || '-'}</span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Osoba prywatna (dane jak do montażu)</p>
                            )}
                            {formData.isHousingVat && (
                                <div className="mt-2 text-green-600 text-xs font-medium">
                                    ✓ Oświadczenie VAT 8% (Budownictwo Mieszkaniowe)
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary shadow-md border-2">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-primary">Edycja Danych</CardTitle>
                <CardDescription>
                    Wprowadź poprawne dane do realizacji zlecenia i faktury.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Installation Address */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Adres Montażu</h3>
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
                </div>

                {/* Billing Data */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Dane do Faktury</h3>
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="hasDifferentBilling" 
                            checked={hasDifferentBilling}
                            onCheckedChange={(checked) => {
                                const isChecked = checked as boolean;
                                setHasDifferentBilling(isChecked);
                                if (!isChecked) {
                                    setFormData({
                                        ...formData,
                                        isCompany: false,
                                        companyName: '',
                                        nip: '',
                                        billingAddress: '',
                                        billingCity: '',
                                        billingPostalCode: ''
                                    });
                                }
                            }}
                        />
                        <Label htmlFor="hasDifferentBilling">Inne dane do faktury / Firma</Label>
                    </div>

                    {hasDifferentBilling && (
                        <div className="space-y-4 pl-4 border-l-2 border-muted animate-in fade-in slide-in-from-top-2">
                            <RadioGroup 
                                value={formData.isCompany ? 'company' : 'private'} 
                                onValueChange={(val) => setFormData({...formData, isCompany: val === 'company'})}
                                className="flex gap-4 mb-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id="r1" />
                                    <Label htmlFor="r1">Osoba Prywatna</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="company" id="r2" />
                                    <Label htmlFor="r2">Firma</Label>
                                </div>
                            </RadioGroup>

                            {formData.isCompany && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Nazwa Firmy</Label>
                                        <Input 
                                            value={formData.companyName} 
                                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>NIP</Label>
                                        <Input 
                                            value={formData.nip} 
                                            onChange={(e) => setFormData({...formData, nip: e.target.value})}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Adres {formData.isCompany ? 'siedziby' : 'zamieszkania'}</Label>
                                <Input 
                                    value={formData.billingAddress} 
                                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Miasto</Label>
                                    <Input 
                                        value={formData.billingCity} 
                                        onChange={(e) => setFormData({...formData, billingCity: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kod pocztowy</Label>
                                    <Input 
                                        value={formData.billingPostalCode} 
                                        onChange={(e) => setFormData({...formData, billingPostalCode: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2 pt-4 border-t">
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
