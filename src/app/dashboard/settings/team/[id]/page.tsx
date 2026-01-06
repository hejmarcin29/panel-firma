
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUser, getMinimalProducts, getOfferConfigurationData } from '../actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AccountForm } from './_components/account-form';
import { ProductAssignment } from './_components/product-assignment';
import { CategoryAssignment } from './_components/category-assignment';
import { ProfileForm } from './_components/profile-form';

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let offerData: any[] = [];
    
    try {
        user = await getUser(id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyUser = user as any;
        if (anyUser.roles.includes('architect') || anyUser.roles.includes('partner')) {
            // products = await getMinimalProducts();
            offerData = await getOfferConfigurationData();
        }
    } catch (e) {
        notFound();
    }

    const initials = user.name
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? '??';

    const isArchitect = user.roles.includes('architect');
    const isInstaller = user.roles.includes('installer');
    const isPartner = user.roles.includes('partner');

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings/team">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium border border-primary/20">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">{user.name || user.email}</h1>
                            <div className="flex gap-2 text-sm text-muted-foreground items-center">
                                <span>{user.email}</span>
                                <Badge variant={user.isActive ? 'default' : 'destructive'} className="h-5 text-[10px]">
                                    {user.isActive ? 'Aktywny' : 'Zablokowany'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Additional header actions can go here */}
                </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none gap-2">
                    <TabsTrigger 
                        value="overview" 
                        className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                    >
                        Przegląd
                    </TabsTrigger>
                    {(isInstaller || isArchitect || isPartner) && (
                        <TabsTrigger 
                            value="profile" 
                            className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                        >
                            Profil Zawodowy
                        </TabsTrigger>
                    )}
                    {(isArchitect || isPartner) && (
                        <TabsTrigger 
                            value="offer" 
                            className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                        >
                            Oferta Produktowa
                        </TabsTrigger>
                    )}
                     {(isInstaller || isArchitect) && (
                        <TabsTrigger 
                            value="history" 
                            className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                        >
                            Historia
                        </TabsTrigger>
                    )}
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="overview">
                        <div className="grid gap-6 md:grid-cols-2">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Dane konta</CardTitle>
                                    <CardDescription>Podstawowe informacje i logowanie</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AccountForm user={user} />
                                </CardContent>
                             </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="profile">
                         <Card>
                                <CardHeader>
                                    <CardTitle>Profil zawodowy</CardTitle>
                                    <CardDescription>Dane firmowe, stawki i ustawienia roli</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfileForm user={user} />
                                </CardContent>
                         </Card>
                    </TabsContent>

                    <TabsContent value="offer">
                         <CategoryAssignment user={user} data={offerData} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
