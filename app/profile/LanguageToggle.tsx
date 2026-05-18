'use client'

import { Languages } from 'lucide-react'
import { useLanguage, type Language } from '@/lib/i18n'

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

/**
 * Segmented control that flips the app language. Choice persists in
 * localStorage (`psc_language`) and is broadcast through the
 * `psc:language` custom event so any other mounted component using
 * `useLanguage()` updates instantly.
 */
export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage()
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <span className="w-9 h-9 rounded-xl bg-brand-pink/15 text-brand-green flex items-center justify-center shrink-0">
        <Languages size={18} strokeWidth={1.75} />
      </span>
      <span className="font-dm-sans text-sm font-semibold text-brand-black flex-1">{t('profile.language')}</span>
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
        {OPTIONS.map((o) => {
          const active = lang === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setLang(o.value)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-lg text-xs font-dm-sans font-semibold transition ${
                active
                  ? 'bg-brand-green text-white'
                  : 'text-gray-500 hover:text-brand-black'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
