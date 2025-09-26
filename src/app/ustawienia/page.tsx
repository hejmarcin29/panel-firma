import { pl } from '@/i18n/pl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70"><Link className="underline" href="/">{pl.nav.dashboard}</Link> &rsaquo; <span>{pl.nav.settings}</span></div>
      <h1 className="text-2xl font-semibold">{pl.settings.title}</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{pl.settings.systemSection}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70 mb-3">{pl.settings.systemDescription}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pl.dashboard.systemInfoPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{pl.settings.usersSection}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70 mb-3">{pl.settings.usersDescription}</p>
            <Link href="/ustawienia/uzytkownicy" className="underline text-sm">{pl.settings.usersLink}</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zasady współpracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70 mb-3">Publikuj i zarządzaj wersjami zasad (admin).</p>
            <Link href="/ustawienia/zasady-wspolpracy" className="underline text-sm">Przejdź do Zasad współpracy</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Integracje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70 mb-3">Konfiguruj integracje systemowe (np. Kalendarz Google).</p>
            <Link href="/ustawienia/integracje" className="underline text-sm">Przejdź do Integracji</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
