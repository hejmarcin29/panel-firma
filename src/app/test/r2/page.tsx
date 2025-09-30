import R2UploadTest from "@/components/r2-upload-test.client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">R2 — test uploadu</h1>
      <p className="text-sm text-gray-600 mb-4">
        Musisz być zalogowany. Po ustawieniu zmiennych środowiskowych dla R2
        wybierz plik i kliknij „Wyślij”.
      </p>
      <R2UploadTest />
    </div>
  );
}
