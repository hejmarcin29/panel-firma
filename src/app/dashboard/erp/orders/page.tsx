import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, FileText, Truck, CheckCircle2, Mail } from "lucide-react";

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium">Zamówienia Zakupu (PO)</h2>
                <p className="text-sm text-muted-foreground">
                    Zarządzanie zamówieniami do dostawców.
                </p>
            </div>

            <Card className="border-dashed border-2">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Moduł w przygotowaniu 🚀</CardTitle>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Już wkrótce będziesz mógł w tym miejscu kompleksowo zarządzać procesem zakupowym.
                    </p>
                </CardHeader>
                <CardContent className="max-w-3xl mx-auto pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Co tu znajdziesz?
                            </h3>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 mt-0.5 text-primary" />
                                    <span>
                                        <strong className="text-foreground">Automatyczne PO:</strong> Generowanie zamówień na podstawie zdefiniowanych cenników zakupu.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 mt-0.5 text-primary" />
                                    <span>
                                        <strong className="text-foreground">Wysyłka PDF:</strong> Generowanie i wysyłka zamówień bezpośrednio do dostawców.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Truck className="h-4 w-4 mt-0.5 text-primary" />
                                    <span>
                                        <strong className="text-foreground">Śledzenie dostaw:</strong> Pełna kontrola nad statusem zamówienia (Wysłane → Potwierdzone → W drodze).
                                    </span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status prac</span>
                                <Badge variant="secondary">W trakcie</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Baza produktów i cen</span>
                                    <span className="text-green-600 font-medium">Gotowe ✅</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Baza dostawców</span>
                                    <span className="text-green-600 font-medium">Gotowe ✅</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Logika zamówień (PO)</span>
                                    <span className="text-primary font-medium">W toku 🔨</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div className="bg-primary h-1.5 rounded-full w-[20%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
