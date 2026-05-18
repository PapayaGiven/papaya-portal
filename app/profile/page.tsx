import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import ProfileMenu from './ProfileMenu'
import LanguageToggle from './LanguageToggle'
import SignOutButton from './SignOutButton'
import { Creator, SiteSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Mein Profil hub — collapses everything that used to live in the
 * burger menu into one tap-friendly list. Language toggle lives here.
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creatorData } = await supabase
    .from('creators')
    .select('*')
    .eq('email', user.email!)
    .single()
  const creator = (creatorData ?? null) as Creator | null
  if (!creator) redirect('/login')

  // Booking link: per-creator override wins; per-level fallback comes
  // from settings (initiation/rising/pro/elite — Germany levels).
  const { data: settingsData } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  const settings = (settingsData ?? null) as SiteSettings | null
  const levelKey = `booking_link_${creator.level.toLowerCase()}` as keyof SiteSettings
  const settingsBooking = (settings?.[levelKey] as string | null | undefined) ?? null
  const bookingLink = creator.booking_link || settingsBooking || null

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || 'https://wa.me/'
  const kajabiUrl = process.env.NEXT_PUBLIC_KAJABI_URL || '#'

  return (
    <div className="min-h-screen bg-brand-light-pink">
      <Nav level={creator.level} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Identity card */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-full bg-brand-pink/20 text-brand-green font-dm-sans font-bold text-lg flex items-center justify-center shrink-0">
              {creator.name?.[0]?.toUpperCase() ?? creator.email[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-playfair text-2xl text-brand-black truncate">{creator.name || creator.email}</h1>
              <p className="font-dm-sans text-xs text-gray-400 truncate">{creator.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-dm-sans text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              {creator.level === 'Elite' ? '👑 ' : ''}{creator.level}
            </span>
          </div>
        </section>

        {/* Menu list — translates live via the language toggle below */}
        <ProfileMenu whatsappUrl={whatsappUrl} kajabiUrl={kajabiUrl} bookingUrl={bookingLink} />

        {/* Language toggle in its own card so it reads as a setting */}
        <section className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
          <LanguageToggle />
        </section>

        <SignOutButton />
      </main>
    </div>
  )
}
