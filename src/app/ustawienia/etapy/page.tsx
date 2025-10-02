import { pl } from "@/i18n/pl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectSettings } from "@/app/actions/project-settings";
import { StagesSettingsForm } from "./StagesSettingsForm.client";

export default async function ProjectStagesPage() {
  const settings = await getProjectSettings();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70">
        <Link className="underline" href="/ustawienia">
          {pl.nav.settings}
        </Link>{" "}
        › <span>{pl.settings.projectStagesSection}</span>
      </div>
      <h1 className="text-2xl font-semibold">{pl.settings.projectStagesSection}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{pl.settings.projectStagesSection}</CardTitle>
        </CardHeader>
        <CardContent>
          <StagesSettingsForm
            initialDelivery={settings.pipelineStages.delivery}
            initialInstallation={settings.pipelineStages.installation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
