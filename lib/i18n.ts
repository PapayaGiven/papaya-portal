'use client'

import { useEffect, useState } from 'react'

/**
 * Tiny client-only i18n shim. Strings live in this file's `STRINGS` map
 * keyed by a canonical English-ish slug; the Spanish/i18n libraries are
 * overkill for a small two-language app and would bloat the bundle.
 *
 * Default language is German (Germany portal). The user can toggle to
 * English via the LanguageToggle on /profile; the choice persists in
 * localStorage under `psc_language` and is read on every mount.
 */

export type Language = 'de' | 'en'

const STORAGE_KEY = 'psc_language'
export const DEFAULT_LANGUAGE: Language = 'de'

/** Dictionary keys used across the creator app. Add entries here as new
 *  strings need translation. Keep keys human-readable. */
export const STRINGS = {
  // Nav
  'nav.home':       { de: 'Startseite',    en: 'Home' },
  'nav.strategy':   { de: 'Strategie',     en: 'Strategy' },
  'nav.products':   { de: 'Produkte',      en: 'Products' },
  'nav.campaigns':  { de: 'Kampagnen',     en: 'Campaigns' },
  'nav.profile':    { de: 'Mein Profil',   en: 'My Profile' },

  // Profile menu
  'profile.growth':       { de: 'Mein Wachstum',         en: 'My Growth' },
  'profile.progress':     { de: 'Mein Fortschritt',      en: 'My Progress' },
  'profile.rewards':      { de: 'Prämien',               en: 'Rewards' },
  'profile.community':    { de: 'Community',             en: 'Community' },
  'profile.education':    { de: 'Weiterbildung',         en: 'Education' },
  'profile.booking':      { de: 'Anruf vereinbaren',     en: 'Book a call' },
  'profile.signout':      { de: 'Abmelden',              en: 'Sign out' },
  'profile.language':     { de: 'Sprache',               en: 'Language' },
  'profile.dangerZone':   { de: 'Gefahrenzone',          en: 'Danger zone' },
  'profile.deleteAccount':{ de: 'Konto löschen',         en: 'Delete account' },

  // Common
  'common.cancel':        { de: 'Abbrechen',             en: 'Cancel' },
  'common.save':          { de: 'Speichern',             en: 'Save' },
  'common.loading':       { de: 'Lädt…',                 en: 'Loading…' },

  // Hack portal — Papaya Picks teaser
  'hack.picks.title':         { de: 'Papaya Picks — Bevor alle anderen',
                                en: 'Papaya Picks — Before everyone else' },
  'hack.picks.subtitle':      { de: 'Wir identifizieren Produkte, die explodieren — mit noch wenigen Affiliates. Die Ersten gewinnen am meisten.',
                                en: 'We spot products about to explode — with few affiliates so far. First movers win the most.' },
  'hack.picks.lockedLabel':   { de: '🔒 Nur für Papaya Social Club Mitglieder',
                                en: '🔒 Members only — Papaya Social Club' },
  'hack.picks.lockedCopy':    { de: 'Die Creator von Papaya Social Club sehen diese Produkte vor allen anderen. Willst du die Erste sein?',
                                en: "Papaya Social Club creators see these products before everyone else. Want to be first?" },
  'hack.picks.joinCTA':       { de: 'Jetzt Papaya Social Club beitreten →',
                                en: 'Join Papaya Social Club →' },
  'hack.picks.loginCTA':      { de: 'Bereits Mitglied? Jetzt anmelden →',
                                en: 'Already a member? Sign in →' },
  'hack.picks.placeholder1':  { de: '🔥 Hot Pick · Score 89 — Beauty-Produkt · 3.200 Einheiten diese Woche · Nur 6 Affiliates',
                                en: '🔥 Hot Pick · Score 89 — Beauty product · 3,200 units this week · Only 6 affiliates' },
  'hack.picks.placeholder2':  { de: '⭐ Good Pick · Score 71 — Fashion-Produkt · 1.800 Einheiten diese Woche · Nur 11 Affiliates',
                                en: '⭐ Good Pick · Score 71 — Fashion product · 1,800 units this week · Only 11 affiliates' },
  'hack.picks.placeholder3':  { de: '🔥 Hot Pick · Score 84 — Skincare-Produkt · 2.100 Einheiten diese Woche · Nur 4 Affiliates',
                                en: '🔥 Hot Pick · Score 84 — Skincare product · 2,100 units this week · Only 4 affiliates' },

  // Papaya Picks (creator page)
  'picks.title':          { de: 'Papaya Picks',
                            en: 'Papaya Picks' },
  'picks.subtitle':       { de: 'Produkte mit hoher Nachfrage und wenig Konkurrenz — sei die Erste.',
                            en: 'High-demand products with low competition — be the first.' },
  'picks.lockedTitle':    { de: 'Papaya Picks wird in Rising freigeschaltet',
                            en: 'Papaya Picks unlocks in Rising' },
  'picks.lockedBody':     { de: 'Fokussiere dich auf deine 3 Produkte diesen Monat, um das nächste Level zu erreichen.',
                            en: 'Focus on your 3 products this month to reach the next level.' },
  'picks.filterAll':      { de: 'Alle',                  en: 'All' },

  // Violation modal
  'violation.trigger':    { de: 'Hast du einen Verstoß? Hier melden',
                            en: 'Spot a violation? Report it here' },
  'violation.modalTitle': { de: 'Verstoß melden',        en: 'Report a violation' },
  'violation.modalHint':  { de: 'Erzähl uns, was passiert ist. Unser Team prüft das vertraulich.',
                            en: "Tell us what happened. Our team reviews privately." },
} as const

export type StringKey = keyof typeof STRINGS

/**
 * Pure translation function (server-safe). Pass a language explicitly
 * when calling from a Server Component; for client-side usage prefer
 * the `useLanguage()` hook below which auto-syncs with localStorage.
 */
export function translate(key: StringKey, lang: Language = DEFAULT_LANGUAGE): string {
  const entry = STRINGS[key]
  if (!entry) return key
  return entry[lang] ?? entry[DEFAULT_LANGUAGE]
}

/**
 * Client hook — returns the active language plus a setter that
 * persists to localStorage and notifies other components via a
 * custom event so swaps feel instant across the page.
 */
export function useLanguage(): { lang: Language; setLang: (next: Language) => void; t: (key: StringKey) => string } {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null
      if (stored === 'en' || stored === 'de') setLangState(stored)
    } catch {
      /* localStorage blocked — stick with default */
    }
    function onChange(e: Event) {
      const next = (e as CustomEvent<Language>).detail
      if (next === 'en' || next === 'de') setLangState(next)
    }
    window.addEventListener('psc:language', onChange)
    return () => window.removeEventListener('psc:language', onChange)
  }, [])

  function setLang(next: Language) {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignored */
    }
    window.dispatchEvent(new CustomEvent('psc:language', { detail: next }))
  }

  function t(key: StringKey) {
    return translate(key, lang)
  }

  return { lang, setLang, t }
}
