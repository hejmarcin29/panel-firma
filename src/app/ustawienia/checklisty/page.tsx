import { pl } from "@/i18n/pl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectSettings } from "@/app/actions/project-settings";
import { ChecklistSettingsForm } from "./ChecklistSettingsForm.client";

export default async function ProjectChecklistsPage() {
  const settings = await getProjectSettings();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70">
        <Link className="underline" href="/ustawienia">
          {pl.nav.settings}
        </Link>{" "}
        › <span>{pl.settings.projectChecklistSection}</span>
      </div>
      <h1 className="text-2xl font-semibold">{pl.settings.projectChecklistSection}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{pl.settings.projectChecklistSection}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChecklistSettingsForm
              initialDelivery={settings.checklistLabels.delivery}
              initialInstallation={settings.checklistLabels.installation}
            />
          </CardContent>
        </Card>
      
    </div>
  );
}
