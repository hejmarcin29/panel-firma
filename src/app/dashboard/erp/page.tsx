import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, Truck, Wallet, BarChart3, FileText, Users, Settings2 } from "lucide-react";
import Link from "next/link";

export default function ERPPage() {
  const modules = [
    {
      title: "Magazyn",
      description: "Stany magazynowe, przyjęcia (PZ), wydania (WZ), inwentaryzacja.",
      icon: Package,
      href: "/dashboard/erp/inventory",
      status: "Planowany",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Zaopatrzenie",
      description: "Zamówienia do dostawców, braki materiałowe, baza dostawców.",
      icon: Truck,
      href: "/dashboard/erp/procurement",
      status: "Planowany",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Rozliczenia Montażystów",
      description: "Ewidencja prac, stawki, generowanie rozliczeń.",
      icon: Wallet,
      href: "/dashboard/erp/settlements",
      status: "Planowany",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Analiza Marży",
      description: "Rentowność zleceń, koszty materiałów vs cena sprzedaży.",
      icon: BarChart3,
      href: "/dashboard/erp/analytics",
      status: "Planowany",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Dokumenty",
      description: "Archiwum faktur, protokoły odbioru, dokumentacja techniczna.",
      icon: FileText,
      href: "/dashboard/erp/documents",
      status: "Planowany",
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
    },
    {
      title: "Konfiguracja ERP",
      description: "Ustawienia stawek, definicje magazynów, kategorie kosztów.",
      icon: Settings2,
      href: "/dashboard/erp/settings",
      status: "Planowany",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System ERP</h1>
        <p className="text-muted-foreground text-lg">
          Zintegrowane zarządzanie zasobami: magazyn, zakupy, finanse i logistyka.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link href={module.href} key={module.title} className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${module.bgColor} ${module.color} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <module.icon className="w-8 h-8" />
                  </div>
                  <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-900">
                    {module.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Dlaczego ERP w Twojej branży?
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm text-muted-foreground">
          <ul className="space-y-3 list-disc pl-4">
            <li>
              <strong className="text-foreground">Kontrola materiałów:</strong> Unikniesz sytuacji, gdzie ekipa jedzie na montaż bez kleju lub listew.
            </li>
            <li>
              <strong className="text-foreground">Automatyzacja zamówień:</strong> System sam podpowie, co zamówić u dostawcy na podstawie przyjętych zleceń.
            </li>
          </ul>
          <ul className="space-y-3 list-disc pl-4">
            <li>
              <strong className="text-foreground">Prawdziwa marża:</strong> Poznasz dokładny zysk z każdego zlecenia po odliczeniu kosztów materiałów i robocizny.
            </li>
            <li>
              <strong className="text-foreground">Porządek w papierach:</strong> Wszystkie WZ, PZ i protokoły w jednym miejscu, powiązane z klientem.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
