import { getPublicMontage, getAvailableSamples } from "./actions";
import { SampleSelector } from "./_components/sample-selector";
import { getAppSetting, appSettingKeys } from "@/lib/settings";

interface PublicMontagePageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function PublicMontagePage({ params }: PublicMontagePageProps) {
    const { token } = await params;
    
    const montage = await getPublicMontage(token);
    
    if (!montage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-xl text-muted-foreground">Nie znaleziono zlecenia lub link wygasł.</p>
            </div>
        );
    }
    
    /* 
       Optional: Check if status is correct? 
       If client already ordered, maybe show "Already ordered"?
       For now flexible.
    */

    const samples = await getAvailableSamples();
    const geowidgetToken = await getAppSetting(appSettingKeys.inpostGeowidgetToken) || "";

    if (samples.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <h1 className="text-2xl font-bold">Brak dostępnych próbek</h1>
                <p className="text-muted-foreground">Obecnie nie mamy zdefiniowanych produktów testowych w systemie.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
           <SampleSelector token={token} samples={samples} geowidgetToken={geowidgetToken} />
        </div>
    );
}
