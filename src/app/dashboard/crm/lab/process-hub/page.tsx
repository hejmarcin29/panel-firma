"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartStepperVariant } from "./_components/variant-1-stepper";
import { VerticalFeedVariant } from "./_components/variant-2-feed";
import { FocusHubVariant } from "./_components/variant-3-focus";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProcessHubLabPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Laboratorium UX: Process Hub</h1>
            <p className="text-muted-foreground">
              Porównanie 3 koncepcji wizualizacji procesu montażu.
            </p>
          </div>
        </div>

        {/* Variants Tabs */}
        <Tabs defaultValue="variant-2" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="variant-1">Stepper</TabsTrigger>
              <TabsTrigger value="variant-2">Vertical Feed</TabsTrigger>
              <TabsTrigger value="variant-3">Focus Hub</TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 md:p-12 min-h-[600px] flex items-start justify-center">
            <TabsContent value="variant-1" className="w-full mt-0">
              <SmartStepperVariant />
            </TabsContent>
            
            <TabsContent value="variant-2" className="w-full mt-0">
              <VerticalFeedVariant />
            </TabsContent>
            
            <TabsContent value="variant-3" className="w-full mt-0">
              <FocusHubVariant />
            </TabsContent>
          </div>
        </Tabs>

        {/* Feedback Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">Jak testować?</h3>
          <p className="text-sm text-blue-800 mb-4">
            Otwórz ten widok na telefonie (użyj DevTools w przeglądarce lub wejdź z telefonu).
            Zwróć uwagę na czytelność "gdzie jestem" i łatwość dostępu do historii.
          </p>
          <div className="text-xs text-blue-600">
            Rekomendacja AI: <strong>Wariant 2 (Vertical Feed)</strong> dla najlepszego balansu.
          </div>
        </div>
      </div>
    </div>
  );
}
