import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getShopConfig } from '@/app/dashboard/settings/shop/actions';

export default async function PublicLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const shopConfig = await getShopConfig();
    const systemLogoUrl = await getAppSetting(appSettingKeys.systemLogoUrl);

    let rawLogoUrl = shopConfig.headerLogo || shopConfig.organizationLogo || systemLogoUrl;

    if (rawLogoUrl && !rawLogoUrl.startsWith('http') && !rawLogoUrl.startsWith('/')) {
        rawLogoUrl = `https://${rawLogoUrl}`;
    }
    const logoSrc = rawLogoUrl || "/window.svg";

    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b py-4">
          <div className="container mx-auto px-4 flex items-center gap-3">
            <div className="relative h-10 w-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-bold text-xl">Prime Podłoga</div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }
