import { pl } from "@/i18n/pl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SystemStatusPage() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70">
        <Link className="hover:underline focus:underline focus:outline-none" href="/ustawienia">
          {pl.nav.settings}
        </Link>{" "}
        › <span>{pl.settings.systemSection}</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{pl.dashboard.systemInfoTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-70 mb-3">{pl.dashboard.systemInfoDescription}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {pl.dashboard.systemInfoPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
