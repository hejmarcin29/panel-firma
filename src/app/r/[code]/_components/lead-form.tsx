'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitLead } from '../actions';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface LeadFormProps {
    referralCode: string;
    referrerName: string;
}

export function LeadForm({ referralCode, referrerName }: LeadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError(null);

        const result = await submitLead(formData);

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            setIsSuccess(true);
            setIsSubmitting(false);
        }
    }

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mx-auto"
            >
                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-800">Dziękujemy!</h2>
                        <p className="text-green-700">
                            Twoje zgłoszenie zostało przyjęte. Skontaktujemy się z Tobą najszybciej jak to możliwe, aby przygotować ofertę.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
        >
            <Card className="shadow-xl border-0 ring-1 ring-gray-200">
                <CardHeader className="space-y-1 text-center pb-8">
                    <CardTitle className="text-2xl font-bold">Darmowa Wycena</CardTitle>
                    <CardDescription className="text-base">
                        Twój znajomy <span className="font-semibold text-primary">{referrerName}</span> poleca Ci nasze usługi.
                        Zostaw kontakt, a przygotujemy dla Ciebie ofertę specjalną.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <input type="hidden" name="referralCode" value={referralCode} />
                        
                        <div className="space-y-2">
                            <Label htmlFor="name">Imię i Nazwisko</Label>
                            <Input 
                                id="name" 
                                name="name" 
                                placeholder="np. Jan Kowalski" 
                                required 
                                className="bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Numer telefonu</Label>
                            <Input 
                                id="phone" 
                                name="phone" 
                                type="tel" 
                                placeholder="np. 500 600 700" 
                                required 
                                className="bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">Miasto (opcjonalnie)</Label>
                            <Input 
                                id="city" 
                                name="city" 
                                placeholder="np. Warszawa" 
                                className="bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Wiadomość (opcjonalnie)</Label>
                            <Textarea 
                                id="message" 
                                name="message" 
                                placeholder="np. Szukam podłogi dębowej do salonu 30m2..." 
                                className="bg-gray-50 min-h-[100px]"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full text-lg h-12" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Wysyłanie...
                                </>
                            ) : (
                                <>
                                    Poproś o kontakt
                                    <Send className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pb-6">
                    <p className="text-xs text-gray-400 text-center">
                        Administratorem Twoich danych osobowych jest Prime Podłoga.
                    </p>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
