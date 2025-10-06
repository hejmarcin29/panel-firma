import type { InstallationStatus } from "@db/schema";

export const installationStatusLabels: Record<InstallationStatus, string> = {
  PLANNED: "Planowany",
  SCHEDULED: "Zaplanowany",
  IN_PROGRESS: "W realizacji",
  COMPLETED: "Zakończony",
  ON_HOLD: "Wstrzymany",
  CANCELLED: "Anulowany",
} as const;

export const installationStatusOptions = Object.entries(installationStatusLabels).map(([value, label]) => ({
  value: value as InstallationStatus,
  label,
}));
