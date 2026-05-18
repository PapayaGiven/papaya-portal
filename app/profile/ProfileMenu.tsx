'use client'

import Link from 'next/link'
import { ChevronRight, TrendingUp, Trophy, Gift, MessagesSquare, GraduationCap, CalendarClock } from 'lucide-react'
import { useLanguage, type StringKey } from '@/lib/i18n'

/**
 * Client wrapper so menu labels swap when LanguageToggle flips the
 * locale. Server page passes external URLs through props so they can
 * come from env vars without leaking into the client bundle keys.
 */
export default function ProfileMenu({
  whatsappUrl,
  kajabiUrl,
  bookingUrl,
}: {
  whatsappUrl: string
  kajabiUrl: string
  bookingUrl: string | null
}) {
  // useLanguage() not called here — each MenuItem subscribes
  // independently. We still want the import for child reuse.
  void useLanguage
  return (
    <section className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
      <MenuItem href="/mi-crecimiento" icon={TrendingUp} labelKey="profile.growth" />
      <MenuItem href="/progress" icon={Trophy} labelKey="profile.progress" />
      <MenuItem href="/rewards" icon={Gift} labelKey="profile.rewards" />
      <MenuItem href={whatsappUrl} icon={MessagesSquare} labelKey="profile.community" external />
      <MenuItem href={kajabiUrl} icon={GraduationCap} labelKey="profile.education" external />
      {bookingUrl && (
        <MenuItem href={bookingUrl} icon={CalendarClock} labelKey="profile.booking" external />
      )}
    </section>
  )
}

function MenuItem({
  href,
  icon: Icon,
  labelKey,
  external,
}: {
  href: string
  icon: typeof TrendingUp
  labelKey: StringKey
  external?: boolean
}) {
  const { t } = useLanguage()
  const common = 'w-full flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition text-left'
  const body = (
    <>
      <span className="w-9 h-9 rounded-xl bg-brand-pink/15 text-brand-green flex items-center justify-center shrink-0">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-dm-sans text-sm font-semibold text-brand-black">{t(labelKey)}</span>
      </span>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </>
  )
  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={common}>{body}</a>
  }
  return <Link href={href} className={common}>{body}</Link>
}
