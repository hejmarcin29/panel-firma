"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, MessageSquare } from "lucide-react";

interface ContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDrawer({ open, onOpenChange }: ContactDrawerProps) {
  const contactOptions = [
    {
      label: "Zadzwoń teraz",
      desc: "+48 791 303 192",
      icon: Phone,
      action: () => window.open("tel:+48791303192"),
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
        label: "WhatsApp",
        desc: "Szybka odpowiedź",
        icon: MessageCircle,
        action: () => window.open("https://wa.me/48791303192"),
        color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      label: "Wyślij SMS",
      desc: "Oddzwonimy w wolnej chwili",
      icon: MessageSquare,
      action: () => window.open("sms:+48791303192?body=Dzień dobry, mam pytanie o podłogę..."),
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      label: "Napisz E-mail",
      desc: "kontakt@primepodloga.pl",
      icon: Mail,
      action: () => window.open("mailto:kontakt@primepodloga.pl"),
      color: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] p-6 pb-safe">
        <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-2xl font-bold">Skontaktuj się z nami</SheetTitle>
            <SheetDescription>
                Wybierz preferowaną formę kontaktu. Jesteśmy dostępni pn-pt 8:00 - 16:00.
            </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4">
            {contactOptions.map((opt, idx) => (
                <Button
                    key={idx}
                    variant="ghost"
                    className={`h-auto w-full justify-start p-4 rounded-2xl border border-transparent transition-all ${opt.color}`}
                    onClick={opt.action}
                >
                    <div className="bg-white/60 p-3 rounded-xl mr-4 backdrop-blur-sm">
                        <opt.icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-lg leading-tight">{opt.label}</div>
                        <div className="text-xs opacity-80 font-medium">{opt.desc}</div>
                    </div>
                </Button>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
