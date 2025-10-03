export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Panel – minimal start</h1>
      <p style={{ marginTop: 8 }}>Projekt został zresetowany do wersji podstawowej.</p>
      <ul style={{ marginTop: 12, lineHeight: 1.7 }}>
        <li>Next.js 15 (App Router, TS)</li>
        <li>Tailwind v4 – można dodać później</li>
        <li>Brak bazy i backendu – start od czystego UI</li>
      </ul>
      <p style={{ marginTop: 12 }}>Możesz teraz stopniowo dodawać funkcje zgodnie z instrukcją w README.</p>
    </main>
  );
}
