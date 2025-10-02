import { Suspense } from "react";
import NewDeliveryPage from "./NewDeliveryPage.client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Ładowanie…</div>}>
      <NewDeliveryPage />
    </Suspense>
  );
}
