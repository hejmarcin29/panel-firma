'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon, Building2, PenTool } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PartnerLinksDialog() {
  const [copied, setCopied] = useState<string | null>(null);

  const links = {
    architect: 'https://b2b.primepodloga.pl/wspolpraca',
    partner: 'https://b2b.primepodloga.pl/partner'
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Linki Partnerskie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Linki do rejestracji</DialogTitle>
          <DialogDescription>
            Udostępnij te linki potencjalnym partnerom, aby mogli zarejestrować się w systemie.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="architect" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="architect" className="gap-2">
                <PenTool className="h-4 w-4" />
                Dla Architektów
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2">
                <Building2 className="h-4 w-4" />
                Dla Firm
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="architect" className="space-y-4 mt-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">Strefa Architekta</h4>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                    Landing page dedykowany projektantom wnętrz i architektom.
                </p>
            </div>
            <div className="space-y-2">
              <Label>Link bezpośredni</Label>
              <div className="flex gap-2">
                <Input readOnly value={links.architect} className="bg-muted" />
                <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard('architect', links.architect)}
                >
                  {copied === 'architect' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="partner" className="space-y-4 mt-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-medium text-emerald-900 dark:text-emerald-300 mb-1">Strefa Partnera B2B</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Landing page dla deweloperów, agencji nieruchomości i firm wykończeniowych.
                </p>
            </div>
            <div className="space-y-2">
              <Label>Link bezpośredni</Label>
              <div className="flex gap-2">
                <Input readOnly value={links.partner} className="bg-muted" />
                <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard('partner', links.partner)}
                >
                  {copied === 'partner' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
