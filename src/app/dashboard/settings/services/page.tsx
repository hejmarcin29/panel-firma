import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getServices, getRateMatrix } from './actions';
import { ServiceCatalog } from './_components/service-catalog';
import { RateMatrix } from './_components/rate-matrix';

export default async function ServicesSettingsPage() {
    const [services, matrixData] = await Promise.all([
        getServices(),
        getRateMatrix()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Usługi i Stawki</h2>
                <p className="text-muted-foreground">
                    Zarządzaj katalogiem usług oraz indywidualnymi stawkami montażystów.
                </p>
            </div>

            <Tabs defaultValue="catalog" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="catalog">Katalog Usług</TabsTrigger>
                    <TabsTrigger value="matrix">Macierz Stawek (Pracownicy)</TabsTrigger>
                </TabsList>
                <TabsContent value="catalog" className="space-y-4">
                    <ServiceCatalog services={services} />
                </TabsContent>
                <TabsContent value="matrix" className="space-y-4">
                    <RateMatrix services={matrixData.services} installers={matrixData.installers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
