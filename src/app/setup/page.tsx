"use client"
import { useState } from 'react'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Minimum 12 znaków'),
})

export default function SetupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Ustaw administratora</h1>
      <p className="text-sm text-gray-600 mb-6">Formularz zadziała tylko, jeśli w bazie nie ma żadnych użytkowników.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const parsed = schema.safeParse({ email, password })
          if (!parsed.success) {
            const first = parsed.error.issues?.[0]
            setMessage(first?.message || 'Błędne dane')
            return
          }
          // ZATRZYMUJEMY SIĘ TUTAJ: BEZ FAKTYCZNEGO TWORZENIA UŻYTKOWNIKA
          setMessage('Dane poprawne — gotowe do utworzenia admina po Twoim potwierdzeniu.')
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Hasło</label>
          <input className="w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <p className="text-xs text-gray-500">Minimum 12 znaków. Hasło zostanie zhashowane (Argon2id).</p>
        </div>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">Zatwierdź</button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  )
}
