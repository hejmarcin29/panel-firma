"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ClipboardList, LayoutList, Ruler, History, Image as ImageIcon, HardHat, FileText, Info, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import useEmblaCarousel from 'embla-carousel-react';

interface MontageDetailsLayoutProps {
  header: React.ReactNode;
  clientCard: React.ReactNode;
  materialCard: React.ReactNode;
  tabs: {
    notes: React.ReactNode;
    history: React.ReactNode;
    workflow: React.ReactNode;
    measurement: React.ReactNode;
    tasks: React.ReactNode;
    gallery: React.ReactNode;
    technical: React.ReactNode;
    quotes: React.ReactNode;
  };
  defaultTab?: string;
}

export function MontageDetailsLayout({
  header,
  clientCard,
  materialCard,
  tabs,
  defaultTab = "notes",
}: MontageDetailsLayoutProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get("tab") || (isMobile ? "overview" : defaultTab);
  
  const [activeMobileTab, setActiveMobileTab] = useState("info");
  const tabsRef = useRef<HTMLDivElement>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const mobileTabs = useMemo(() => [
    { id: 'info', label: 'Info', icon: <Info className="w-4 h-4" />, content: <div className="space-y-4 p-4 pb-24">{clientCard}{materialCard}</div> },
    { id: 'notes', label: 'Notatki', icon: <MessageSquare className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.notes}</div> },
    { id: 'tasks', label: 'Zadania', icon: <ClipboardList className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.tasks}</div> },
    { id: 'gallery', label: 'Galeria', icon: <ImageIcon className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.gallery}</div> },
    { id: 'workflow', label: 'Przebieg', icon: <LayoutList className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.workflow}</div> },
    { id: 'measurement', label: 'Pomiary', icon: <Ruler className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.measurement}</div> },
    { id: 'technical', label: 'Techniczne', icon: <HardHat className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.technical}</div> },
    { id: 'quotes', label: 'Wyceny', icon: <FileText className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.quotes}</div> },
    { id: 'history', label: 'Historia', icon: <History className="w-4 h-4" />, content: <div className="p-4 pb-24">{tabs.history}</div> },
  ], [clientCard, materialCard, tabs]);

  const scrollToTab = useCallback((tabId: string) => {
    const index = mobileTabs.findIndex(t => t.id === tabId);
    if (index !== -1 && emblaApi) {
        emblaApi.scrollTo(index);
    }
  }, [emblaApi, mobileTabs]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    const newActiveTab = mobileTabs[index]?.id;
    
    if (newActiveTab) {
        setActiveMobileTab(newActiveTab);
        // Scroll tab into view
        const tabsContainer = tabsRef.current;
        const activeTabElement = tabsContainer?.querySelector(`[data-tab="${newActiveTab}"]`);
        if (activeTabElement) {
            activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [emblaApi, mobileTabs]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    // eslint-disable-next-line
    onSelect();
  }, [emblaApi, onSelect]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden pt-[env(safe-area-inset-top)]">
        <div className="shrink-0 z-10 bg-background border-b shadow-sm">
            {header}
            <div ref={tabsRef} className="flex overflow-x-auto scrollbar-hide px-2 pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                {mobileTabs.map(tab => (
                    <button
                        key={tab.id}
                        data-tab={tab.id}
                        onClick={() => scrollToTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                            activeMobileTab === tab.id 
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden" ref={emblaRef}>
            <div className="flex h-full touch-pan-y">
                {mobileTabs.map(tab => (
                    <div key={tab.id} className="flex-[0_0_100%] min-w-0 h-full overflow-y-auto bg-muted/5">
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <>
      {header}
      <main className="container mx-auto grid gap-6 p-4 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] lg:p-8 items-start">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-6">
              {clientCard}
              {materialCard}
          </div>

          <div className="space-y-6">
              <Tabs value={currentTab === 'overview' ? defaultTab : currentTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-8">
                      <TabsTrigger value="notes" className="flex-1">Notatki</TabsTrigger>
                      <TabsTrigger value="workflow" className="flex-1">Przebieg</TabsTrigger>
                      <TabsTrigger value="measurement" className="flex-1">Pomiar</TabsTrigger>
                      <TabsTrigger value="technical" className="flex-1">Techniczne</TabsTrigger>
                      <TabsTrigger value="quotes" className="flex-1">Wyceny</TabsTrigger>
                      <TabsTrigger value="tasks" className="flex-1">Zadania</TabsTrigger>
                      <TabsTrigger value="gallery" className="flex-1">Załączniki</TabsTrigger>
                      <TabsTrigger value="history" className="flex-1">Historia</TabsTrigger>
                  </TabsList>
                  <TabsContent value="notes" className="mt-6">
                      {tabs.notes}
                  </TabsContent>
                  <TabsContent value="workflow" className="mt-6">
                      {tabs.workflow}
                  </TabsContent>
                  <TabsContent value="measurement" className="mt-6">
                      {tabs.measurement}
                  </TabsContent>
                  <TabsContent value="technical" className="mt-6">
                      {tabs.technical}
                  </TabsContent>
                  <TabsContent value="quotes" className="mt-6">
                      {tabs.quotes}
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-6">
                      {tabs.tasks}
                  </TabsContent>
                  <TabsContent value="gallery" className="mt-6">
                      {tabs.gallery}
                  </TabsContent>
                  <TabsContent value="history" className="mt-6">
                      {tabs.history}
                  </TabsContent>
              </Tabs>
          </div>
      </main>
    </>
  );
}

