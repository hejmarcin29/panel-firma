import { getAppSetting, appSettingKeys } from '@/lib/settings';

export default async function PublicLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    let systemLogoUrl = await getAppSetting(appSettingKeys.systemLogoUrl);
    if (systemLogoUrl && !systemLogoUrl.startsWith('http') && !systemLogoUrl.startsWith('/')) {
        systemLogoUrl = `https://${systemLogoUrl}`;
    }
    const logoSrc = systemLogoUrl || "/window.svg";

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
