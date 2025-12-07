"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, ClipboardList, LayoutList, Ruler, History, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

interface MontageDetailsLayoutProps {
  header: React.ReactNode;
  clientCard: React.ReactNode;
  materialCard: React.ReactNode;
  tabs: {
    log: React.ReactNode;
    workflow: React.ReactNode;
    measurement: React.ReactNode;
    tasks: React.ReactNode;
    gallery: React.ReactNode;
  };
  defaultTab?: string;
}

export function MontageDetailsLayout({
  header,
  clientCard,
  materialCard,
  tabs,
  defaultTab = "log",
}: MontageDetailsLayoutProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get("tab") || (isMobile ? "overview" : defaultTab);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const goBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isMobile) {
    if (currentTab === "overview") {
      return (
        <>
          {header}
          <div className="flex flex-col gap-6 p-4">
            <div className="grid gap-4">
              {clientCard}
              {materialCard}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <h3 className="font-medium text-muted-foreground mb-2">Menu Montażu</h3>
              <MenuButton 
                  icon={<History className="w-5 h-5" />} 
                  label="Dziennik Zdarzeń" 
                  onClick={() => handleTabChange("log")} 
              />
              <MenuButton 
                  icon={<LayoutList className="w-5 h-5" />} 
                  label="Przebieg (Workflow)" 
                  onClick={() => handleTabChange("workflow")} 
              />
              <MenuButton 
                  icon={<Ruler className="w-5 h-5" />} 
                  label="Pomiary" 
                  onClick={() => handleTabChange("measurement")} 
              />
              <MenuButton 
                  icon={<ClipboardList className="w-5 h-5" />} 
                  label="Zadania" 
                  onClick={() => handleTabChange("tasks")} 
              />
              <MenuButton 
                  icon={<ImageIcon className="w-5 h-5" />} 
                  label="Załączniki / Galeria" 
                  onClick={() => handleTabChange("gallery")} 
              />
            </div>
          </div>
        </>
      );
    }

    // Mobile Detail View
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 h-14 backdrop-blur">
          <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">
            {currentTab === 'log' && 'Dziennik'}
            {currentTab === 'workflow' && 'Przebieg'}
            {currentTab === 'measurement' && 'Pomiary'}
            {currentTab === 'tasks' && 'Zadania'}
            {currentTab === 'gallery' && 'Załączniki'}
          </span>
        </div>
        <div className="p-4">
            {/* Render specific tab content */}
            {currentTab === 'log' && tabs.log}
            {currentTab === 'workflow' && tabs.workflow}
            {currentTab === 'measurement' && tabs.measurement}
            {currentTab === 'tasks' && tabs.tasks}
            {currentTab === 'gallery' && tabs.gallery}
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
                  <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5">
                      <TabsTrigger value="log" className="flex-1">Dziennik</TabsTrigger>
                      <TabsTrigger value="workflow" className="flex-1">Przebieg</TabsTrigger>
                      <TabsTrigger value="measurement" className="flex-1">Pomiar</TabsTrigger>
                      <TabsTrigger value="tasks" className="flex-1">Zadania</TabsTrigger>
                      <TabsTrigger value="gallery" className="flex-1">Załączniki</TabsTrigger>
                  </TabsList>
                  <TabsContent value="log" className="mt-6">
                      {tabs.log}
                  </TabsContent>
                  <TabsContent value="workflow" className="mt-6">
                      {tabs.workflow}
                  </TabsContent>
                  <TabsContent value="measurement" className="mt-6">
                      {tabs.measurement}
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-6">
                      {tabs.tasks}
                  </TabsContent>
                  <TabsContent value="gallery" className="mt-6">
                      {tabs.gallery}
                  </TabsContent>
              </Tabs>
          </div>
      </main>
    </>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-4 p-4 w-full bg-card border rounded-xl shadow-sm hover:bg-accent transition-colors text-left"
        >
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                {icon}
            </div>
            <span className="font-medium">{label}</span>
        </button>
    )
}
