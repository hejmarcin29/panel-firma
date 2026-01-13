export default function StorefrontHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        PrimePodłoga - Sklep
      </h1>
      <p className="mt-4 text-lg text-zinc-600">
        Witaj w wersji testowej nowego sklepu!
      </p>
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <p className="font-mono text-sm text-zinc-500">
          Status: Faza 1 - Fundamenty
        </p>
      </div>
    </div>
  );
}
