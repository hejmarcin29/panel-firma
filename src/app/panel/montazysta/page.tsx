import Link from 'next/link'

export default function PanelMontazysty() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Panel Montażysty</h1>
        <p className="text-sm opacity-70 mt-1">Ten widok jest w przygotowaniu. Wkrótce pojawią się tutaj zadania i zlecenia przypisane do Twojej roli.</p>
      </div>
      <div className="text-sm">
        <Link className="underline" href="/">Przejdź do panelu głównego (admin)</Link>
      </div>
    </div>
  )
}
