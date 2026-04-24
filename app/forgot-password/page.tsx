'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/confirm`
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (resetErr) {
      setError(resetErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-light-pink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-brand-pink/20 p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/logo_pink.png"
                alt="Papaya Social Club"
                width={80}
                height={80}
              />
            </div>
            <h1 className="font-playfair text-3xl text-brand-green leading-tight">
              {success ? 'Check deine E-Mails' : 'Passwort vergessen?'}
            </h1>
            <p className="font-dm-sans text-gray-500 mt-2 text-sm">
              {success
                ? 'Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts geschickt.'
                : 'Gib deine E-Mail ein, um dein Passwort zurückzusetzen.'}
            </p>
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-dm-sans font-medium text-gray-700 mb-1.5">E-Mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="deine@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-pink/40 focus:border-brand-pink font-dm-sans text-sm bg-gray-50 text-gray-900 placeholder-gray-400 transition"
                />
              </div>

              {error && (
                <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-xl px-4 py-3">
                  <p className="text-sm font-dm-sans text-rose-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-dm-sans font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] mt-2"
                style={{ backgroundColor: '#1B5E3B' }}
              >
                {loading ? 'Wird gesendet...' : 'E-Mail senden →'}
              </button>
            </form>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-dm-sans text-emerald-700">
                Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts geschickt.
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="block w-full text-center mt-6 py-2 font-dm-sans text-sm text-gray-500 hover:text-brand-green transition"
          >
            ← Zurück zur Anmeldung
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 font-dm-sans mt-6">
          © 2024 Papaya Social Club · Alle Rechte vorbehalten
        </p>
      </div>
    </div>
  )
}
