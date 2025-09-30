import { Suspense } from "react";
import NewInstallationPage from "./NewInstallationPage.client";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm opacity-70">Ładowanie…</div>}
    >
      <NewInstallationPage />
    </Suspense>
  );
}
