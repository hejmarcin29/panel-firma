export default function Home() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-medium mb-2">Szybkie akcje</h2>
          <ul className="text-sm space-y-1">
            <li>• Dodaj zlecenie</li>
            <li>• Dodaj klienta</li>
            <li>• Przypisz montażystę</li>
          </ul>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium mb-2">Ostatnie</h2>
          <p className="text-sm text-gray-600">Tu pojawią się ostatnie zlecenia/zmiany.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium mb-2">Stan systemu</h2>
          <p className="text-sm text-gray-600">Wersja: 0.1.0 • Baza: SQLite</p>
        </div>
      </div>
    </div>
  );
}
