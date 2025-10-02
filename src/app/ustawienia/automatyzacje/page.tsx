"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { getProjectSettings, updateProjectSettings } from "@/app/actions/project-settings";

type Automations = {
  autoCreateGoogleEventOnSchedule: boolean;
  autoUpdateGoogleEventOnChange: boolean;
  autoDeleteGoogleEventOnUnassign: boolean;
  notifyInstallerOnAssignment: boolean;
  notifyClientOnSchedule: boolean;
  warnIfStageInvalid: boolean;
};

export default function AutomationsSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Automations | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getProjectSettings();
        // Zakładamy, że settings mają pole 'automations' zgodne z typem Automations
        setValues((s as { automations: Automations }).automations);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!values) return;
    setSaving(true);
    const r = await updateProjectSettings({ automations: values } as {
      automations: Automations;
    });
    setSaving(false);
    if (r.ok) toast({ title: "Zapisano", variant: "success" });
    else toast({ title: "Błąd", description: r.error, variant: "destructive" });
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="text-sm opacity-70">
        <Link className="hover:underline focus:underline focus:outline-none" href="/ustawienia">
          Ustawienia
        </Link>{" "}
        › <span>Automatyzacje</span>
      </div>
      <h1 className="text-2xl font-semibold">Automatyzacje</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Proponowane reguły</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || !values ? (
            <div className="text-sm opacity-70">Ładowanie…</div>
          ) : (
            <div className="space-y-3">
              {(
                [
                  {
                    key: "autoCreateGoogleEventOnSchedule",
                    label: "Twórz wydarzenie Google po ustawieniu daty montażu",
                    hint: "Wymaga integracji z Kalendarzem Google",
                  },
                  {
                    key: "autoUpdateGoogleEventOnChange",
                    label: "Aktualizuj wydarzenie po zmianie daty/montażysty",
                    hint: "Synchronizacja zmian do kalendarza",
                  },
                  {
                    key: "autoDeleteGoogleEventOnUnassign",
                    label: "Usuwaj wydarzenie po usunięciu terminu lub montażysty",
                    hint: "Porządek w kalendarzu montażysty",
                  },
                  {
                    key: "notifyInstallerOnAssignment",
                    label: "Powiadom montażystę po przypisaniu",
                    hint: "Email/Push – do decyzji w kolejnej iteracji",
                  },
                  {
                    key: "notifyClientOnSchedule",
                    label: "Powiadom klienta po ustaleniu terminu",
                    hint: "Wymaga szablonu komunikatu do klienta",
                  },
                  {
                    key: "warnIfStageInvalid",
                    label: "Ostrzegaj, gdy etap nie pasuje do checklisty",
                    hint: "Lekka walidacja biznesowa w UI",
                  },
                ] as const satisfies Array<{
                  key: keyof Automations;
                  label: string;
                  hint: string;
                }>
              ).map((row) => (
                <label key={row.key} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="relative top-1"
                    checked={values[row.key]}
                    onChange={(e) =>
                      setValues((prev) =>
                        prev
                          ? ({ ...prev, [row.key]: e.target.checked } as Automations)
                          : prev,
                      )
                    }
                  />
                  <span>
                    <span className="font-medium">{row.label}</span>
                    <div className="opacity-70">{row.hint}</div>
                  </span>
                </label>
              ))}

              <div>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Zapisz
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
