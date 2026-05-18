'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Compass, ShoppingBag, Megaphone, User } from 'lucide-react'
import { CreatorLevel } from '@/lib/types'
import { useLanguage, type StringKey } from '@/lib/i18n'

interface NavProps {
  level?: CreatorLevel | null
}

// Five-item nav shared between desktop top bar and mobile bottom bar.
// Same destinations, different layout. Mein Wachstum / Mein Fortschritt
// / Prämien / Verstöße / Papaya Picks moved into pages or under
// /profile to keep this tight.
const ITEMS: { href: string; key: StringKey; icon: typeof Home; segment: string }[] = [
  { href: '/dashboard',  key: 'nav.home',      icon: Home,        segment: 'dashboard' },
  { href: '/strategy',   key: 'nav.strategy',  icon: Compass,     segment: 'strategy' },
  { href: '/products',   key: 'nav.products',  icon: ShoppingBag, segment: 'products' },
  { href: '/campaigns',  key: 'nav.campaigns', icon: Megaphone,   segment: 'campaigns' },
  { href: '/profile',    key: 'nav.profile',   icon: User,        segment: 'profile' },
]

// Compact level chip — Germany doesn't export a shared color map, so
// styling matches the rest of the app's level chips (gray base).
const LEVEL_PILL = 'bg-gray-100 text-gray-700'

function isActive(pathname: string, segment: string): boolean {
  const first = pathname.split('/')[1] ?? ''
  return first === segment
}

export default function Nav({ level }: NavProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <Image
                src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_green.png"
                alt="Papaya Social Club"
                width={28}
                height={28}
              />
              <span className="font-dm-sans font-semibold text-brand-black text-sm tracking-wide">
                Papaya Social Club
              </span>
              <span className="font-dm-sans text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1B5E3B' }}>🇩🇪 DE</span>
            </Link>

            <div className="flex items-center gap-1">
              {ITEMS.map(({ href, key, segment }) => {
                const active = isActive(pathname, segment)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2 rounded-lg font-dm-sans text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-green text-white'
                        : 'text-gray-600 hover:text-brand-green hover:bg-brand-green/5'
                    }`}
                  >
                    {t(key)}
                  </Link>
                )
              })}
            </div>

            {level && (
              <span className={`inline-flex items-center gap-1.5 font-dm-sans text-xs font-bold px-3 py-1 rounded-full ${LEVEL_PILL}`}>
                {level === 'Elite' ? '👑 ' : ''}{level}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile top header — logo + level chip only */}
      <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_green.png"
              alt="Papaya Social Club"
              width={22}
              height={22}
            />
            <span className="font-dm-sans font-semibold text-brand-black text-xs tracking-wide">
              Papaya Social Club
            </span>
          </Link>
          {level && (
            <span className={`inline-flex items-center gap-1 font-dm-sans text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_PILL}`}>
              {level === 'Elite' ? '👑 ' : ''}{level}
            </span>
          )}
        </div>
      </header>

      {/* Mobile bottom bar — fixed, the 5 primary destinations */}
      <nav
        aria-label="Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map(({ href, key, icon: Icon, segment }) => {
            const active = isActive(pathname, segment)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                    active ? 'text-brand-green' : 'text-gray-500 hover:text-brand-black'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  {t(key)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
