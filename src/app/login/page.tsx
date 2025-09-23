"use client"
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Logowanie</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          setError(null)
          const res = await signIn('credentials', {
            email,
            password,
            redirect: true,
            callbackUrl: '/',
          })
          // next-auth zajmie się przekierowaniem; w przypadku błędu res?.error może być ustawione
          if (res && (res as any).error) {
            setError('Błędny email lub hasło')
            setLoading(false)
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Hasło</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}
