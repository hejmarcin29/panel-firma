import { fetchMailAccounts } from '../queries';
import { MobileComposeWrapper } from './_components/mobile-compose-wrapper';
import { BackButton } from '../../_components/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ComposePage() {
  const accounts = await fetchMailAccounts();

  return (
    <div className="flex flex-col h-full space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
            <BackButton />
            <h2 className="text-3xl font-bold tracking-tight">Nowa wiadomość</h2>
        </div>
      </div>
      
      <Card className="flex-1 border-0 shadow-none md:border md:shadow-sm">
        <CardHeader className="px-0 md:px-6">
            <CardTitle>Wypełnij formularz</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
            <MobileComposeWrapper accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
