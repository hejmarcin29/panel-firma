'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { updateMaterialLog } from '../../technical-actions';
import type { MaterialLogData, MaterialItem } from '../../technical-data';

interface MaterialManagerProps {
  montageId: string;
  initialData: MaterialLogData | null;
  role: 'admin' | 'installer' | 'measurer';
}

export function MaterialManager({ montageId, initialData, role }: MaterialManagerProps) {
  const [isPending, startTransition] = useTransition();
  
  const defaultValues: MaterialLogData = initialData || {
    items: [],
    subfloorAccepted: false,
    subfloorAcceptedAt: null,
    subfloorAcceptedBy: null,
    notes: '',
  };

  const [data, setData] = useState<MaterialLogData>(defaultValues);

  const handleSave = () => {
    startTransition(async () => {
      await updateMaterialLog(montageId, data);
    });
  };

  const addItem = () => {
    const newItem: MaterialItem = {
        id: crypto.randomUUID(),
        name: '',
        unit: 'szt',
        issued: 0,
        consumed: 0,
        returned: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof MaterialItem, value: any) => {
    setData(prev => ({
        ...prev,
        items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleAcceptSubfloor = (checked: boolean) => {
    setData(prev => ({
        ...prev,
        subfloorAccepted: checked,
        subfloorAcceptedAt: checked ? new Date().toISOString() : null,
        // In real app, we would set user ID on server side
    }));
  };

  const isAdmin = role === 'admin';
  const isInstaller = role === 'installer';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materiały i Zużycie</CardTitle>
        <CardDescription>
            {isAdmin ? 'Wydaj materiały montażyście.' : 'Zgłoś zużycie materiałów.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Sekcja Akceptacji Podłoża (Dla Montażysty) */}
        <div className={`p-4 rounded-lg border ${data.subfloorAccepted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-4">
                {data.subfloorAccepted ? <CheckCircle2 className="text-green-600 mt-1" /> : <AlertTriangle className="text-amber-600 mt-1" />}
                <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Akceptacja Podłoża</Label>
                        <Switch 
                            checked={data.subfloorAccepted} 
                            onCheckedChange={handleAcceptSubfloor}
                            disabled={!isInstaller && !isAdmin}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Potwierdzam, że podłoże zostało sprawdzone (wilgotność, równość) i nadaje się do montażu zgodnie ze sztuką.
                    </p>
                    {data.subfloorAcceptedAt && (
                        <p className="text-xs text-muted-foreground">
                            Zaakceptowano: {new Date(data.subfloorAcceptedAt).toLocaleString('pl-PL')}
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Tabela Materiałów */}
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nazwa Produktu</TableHead>
                        <TableHead>Jedn.</TableHead>
                        <TableHead>Wydano</TableHead>
                        <TableHead>Zużyto</TableHead>
                        <TableHead>Zwrot</TableHead>
                        {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                {isAdmin ? (
                                    <Input 
                                        value={item.name} 
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)} 
                                        placeholder="np. Klej Bona Quantum"
                                    />
                                ) : (
                                    <span className="font-medium">{item.name}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {isAdmin ? (
                                    <Select value={item.unit} onValueChange={(v) => updateItem(item.id, 'unit', v)}>
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="szt">szt</SelectItem>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="l">l</SelectItem>
                                            <SelectItem value="op">op</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="outline">{item.unit}</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {isAdmin ? (
                                    <Input 
                                        type="number" 
                                        value={item.issued} 
                                        onChange={(e) => updateItem(item.id, 'issued', parseFloat(e.target.value))} 
                                    />
                                ) : (
                                    <span className="font-bold">{item.issued}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={item.consumed} 
                                    onChange={(e) => updateItem(item.id, 'consumed', parseFloat(e.target.value))}
                                    disabled={!isInstaller && !isAdmin}
                                    className={item.consumed > item.issued ? 'border-red-500' : ''}
                                />
                            </TableCell>
                            <TableCell>
                                <span className={`font-medium ${item.issued - item.consumed < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {(item.issued - item.consumed).toFixed(1)}
                                </span>
                            </TableCell>
                            {isAdmin && (
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {data.items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                Brak materiałów. {isAdmin && 'Dodaj pozycje, które wydajesz montażyście.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {isAdmin && (
            <Button variant="outline" onClick={addItem} className="w-full border-dashed">
                <Plus className="mr-2 h-4 w-4" /> Dodaj materiał
            </Button>
        )}

        <div className="space-y-2">
            <Label>Notatki z zużycia</Label>
            <Textarea 
                value={data.notes} 
                onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Uwagi o zużyciu, dodatkowych pracach itp."
            />
        </div>

        <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz Zmiany
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
