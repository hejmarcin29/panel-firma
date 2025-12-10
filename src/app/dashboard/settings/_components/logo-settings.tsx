"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadLogo, removeLogo } from "../actions";

interface LogoSettingsProps {
    currentLogoUrl: string | null;
}

export function LogoSettings({ currentLogoUrl }: LogoSettingsProps) {
    const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Wybierz plik obrazka (PNG, JPG, SVG)");
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error("Plik jest za duży (max 2MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const newUrl = await uploadLogo(formData);
            setLogoUrl(newUrl);
            toast.success("Logo zostało zaktualizowane");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Błąd podczas wgrywania logo");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = async () => {
        setIsUploading(true);
        try {
            await removeLogo();
            setLogoUrl(null);
            toast.success("Logo zostało usunięte");
        } catch (error) {
            console.error("Remove error:", error);
            toast.error("Błąd podczas usuwania logo");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Logo Systemu</CardTitle>
                <CardDescription>
                    Wgraj logo firmy, które będzie wyświetlane w nagłówku panelu oraz na ekranie logowania.
                    Zalecany format: PNG z przezroczystością.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                    <div className="relative h-24 w-24 border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                        {logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                                src={logoUrl} 
                                alt="Logo firmy" 
                                className="w-full h-full object-contain p-2" 
                            />
                        ) : (
                            <span className="text-xs text-muted-foreground text-center px-2">Brak logo</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Wgraj nowe
                            </Button>
                            {logoUrl && (
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    disabled={isUploading}
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Max 2MB. Formaty: PNG, JPG, SVG.
                        </p>
                    </div>
                </div>
                <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/png,image/jpeg,image/svg+xml" 
                    className="hidden"
                    onChange={handleFileChange}
                />
            </CardContent>
        </Card>
    );
}
