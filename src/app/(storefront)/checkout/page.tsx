import { CheckoutForm } from "./_components/checkout-form";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";
import { getAppSetting, appSettingKeys } from "@/lib/settings";

export default async function CheckoutPage() {
  const shopConfig = await getShopConfig();

  // Fetch InPost Config for Geowidget
  const [geowidgetToken, geowidgetConfig] = await Promise.all([
      getAppSetting(appSettingKeys.inpostGeowidgetToken),
      getAppSetting(appSettingKeys.inpostGeowidgetConfig)
  ]);

  return (
    <div className="container min-h-screen py-10 space-y-8">
       <div className="space-y-2">
           <h1 className="text-3xl font-bold font-playfair">Finalizacja Zamówienia</h1>
           <p className="text-muted-foreground">
               Uzupełnij dane dostawy i wybierz metodę płatności.
           </p>
       </div>
       
       <CheckoutForm 
          shippingCost={shopConfig.sampleShippingCost}
          palletShippingCost={shopConfig.palletShippingCost}
          inpostGeowidgetToken={geowidgetToken || undefined}
          inpostGeowidgetConfig={geowidgetConfig || undefined}
       />
    </div>
  );
}
