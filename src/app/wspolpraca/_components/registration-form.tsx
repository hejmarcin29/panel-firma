'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerArchitect } from '../actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function RegistrationForm() {
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            const result = await registerArchitect(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                setIsSuccess(true);
                toast.success('Zgłoszenie wysłane pomyślnie!');
            }
        } catch {
            toast.error('Wystąpił błąd. Spróbuj ponownie.');
        } finally {
            setIsPending(false);
        }
    }

    if (isSuccess) {
        return (
            <section id="register-form" className="py-24 bg-zinc-50">
                <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-12 shadow-xl text-center"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Dziękujemy za zgłoszenie!</h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Twoje konto zostało utworzone i oczekuje na weryfikację. <br/>
                            Skontaktujemy się z Tobą w ciągu 24 godzin, aby aktywować dostęp do Panelu Partnera.
                        </p>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Wróć do strony głównej
                        </Button>
                    </motion.div>
                </div>
            </section>
        );
    }

  return (
    <section id="register-form" className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <div className="lg:w-1/2">
                <h2 className="text-4xl font-bold mb-6">Dołącz do elity.</h2>
                <p className="text-xl text-gray-600 mb-8">
                    Wypełnij formularz, aby otrzymać dostęp do Panelu Partnera. 
                    To nic nie kosztuje, a zmienia wszystko.
                </p>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    </div>
                    <div>
                        <p className="font-bold">Marcin</p>
                        <p className="text-sm text-gray-500">Opiekun Partnerów</p>
                    </div>
                </div>
                <blockquote className="text-lg italic text-gray-600 border-l-4 border-blue-500 pl-4">
                    &quot;Zależy nam na długofalowych relacjach. Dlatego stworzyliśmy system, który szanuje Twój czas i pieniądze.&quot;
                </blockquote>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="lg:w-1/2 w-full"
            >
                <form action={handleSubmit} className="bg-white rounded-3xl p-8 md:p-10 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Imię i Nazwisko</Label>
                            <Input id="name" name="name" placeholder="Jan Kowalski" required className="bg-gray-50 border-gray-200 h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input id="phone" name="phone" placeholder="+48 000 000 000" required className="bg-gray-50 border-gray-200 h-12" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Adres Email</Label>
                        <Input id="email" name="email" type="email" placeholder="jan@architektura.pl" required className="bg-gray-50 border-gray-200 h-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nazwa Pracowni</Label>
                            <Input id="companyName" name="companyName" placeholder="Studio Design" className="bg-gray-50 border-gray-200 h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP</Label>
                            <Input id="nip" name="nip" placeholder="0000000000" required className="bg-gray-50 border-gray-200 h-12" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" size="lg" className="w-full h-14 text-lg bg-black hover:bg-gray-800 rounded-xl" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Wysyłanie...
                                </>
                            ) : (
                                'Zostań Partnerem'
                            )}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Klikając przycisk, akceptujesz regulamin programu partnerskiego.
                        </p>
                    </div>
                </form>
            </motion.div>

        </div>
      </div>
    </section>
  );
}
