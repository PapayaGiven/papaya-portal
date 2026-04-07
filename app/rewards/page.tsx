import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Nav from '@/components/Nav'
import { Creator, CreatorLevel } from '@/lib/types'

interface Reward {
  emoji: string
  title: string
  description: string
}

const REWARDS: Record<CreatorLevel, { color: string; gmvRange: string; emoji: string; rewards: Reward[] }> = {
  Initiation: {
    color: '#9CA3AF',
    gmvRange: '$0 – $299',
    emoji: '🌱',
    rewards: [
      { emoji: '📦', title: 'Willkommenspaket', description: 'Dein Papaya Starter-Kit mit allem was du brauchst.' },
      { emoji: '💬', title: 'Community Zugang', description: 'Zugang zur exklusiven Creator Community.' },
      { emoji: '📊', title: 'Creator Dashboard', description: 'Dein persönliches Dashboard um deinen Fortschritt zu verfolgen.' },
      { emoji: '📩', title: 'Wöchentlicher Newsletter', description: 'Tipps, Trends und neue Produkte direkt in dein Postfach.' },
    ],
  },
  Rising: {
    color: '#F4A7C3',
    gmvRange: '$300 – $999',
    emoji: '🌸',
    rewards: [
      { emoji: '🎁', title: 'Papaya Creator Kit', description: 'Exklusives Kit: Sticker, Notizbuch, Tote Bag.' },
      { emoji: '💰', title: 'Monatlicher Bonus von $25', description: '$25 extra in deinen monatlichen Zahlungen.' },
      { emoji: '📢', title: 'Erste Benachrichtigung bei Deals', description: 'Erfahre als Erste von neuen Kampagnen.' },
      { emoji: '🏅', title: '$300 GMV Badge', description: 'Offizielles Rising Badge für dein Profil.' },
    ],
  },
  Pro: {
    color: '#1B5E3B',
    gmvRange: '$1.000 – $9.999',
    emoji: '💚',
    rewards: [
      { emoji: '💸', title: 'Quartalsbonus von $100', description: '$100 Bonus alle drei Monate.' },
      { emoji: '📸', title: 'Foto- und Video-Shooting', description: 'Professionelles Content-Shooting mit dem Papaya Team.' },
      { emoji: '🌐', title: 'Im Agentur-Portfolio vorgestellt', description: 'Du erscheinst auf der Papaya Website als Creator.' },
      { emoji: '📞', title: '1:1 Strategie-Calls', description: 'Monatliche Strategie-Session mit deinem dedizierten Manager.' },
    ],
  },
  Elite: {
    color: '#F59E0B',
    gmvRange: '$10.000+',
    emoji: '👑',
    rewards: [
      { emoji: '💎', title: 'Quartalsbonus von $500', description: '$500 extra alle drei Monate als Top Creator.' },
      { emoji: '🤝', title: 'Agentur Partnership', description: 'Offizieller Papaya Partner-Vertrag mit exklusiven Konditionen.' },
      { emoji: '✈️', title: 'Event- und Reiseeinladungen', description: 'Einladungen zu Marken-Events, Messen und Creator Retreats.' },
      { emoji: '🔧', title: 'Co-Branded Deals', description: 'Kampagnen speziell für dich als Creator entwickelt.' },
    ],
  },
}

const LEVELS: CreatorLevel[] = ['Initiation', 'Rising', 'Pro', 'Elite']

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creatorData } = await supabase
    .from('creators')
    .select('level, gmv')
    .eq('email', user.email!)
    .single()

  const creator = creatorData as Pick<Creator, 'level' | 'gmv'> | null
  const currentLevelIndex = creator ? LEVELS.indexOf(creator.level) : 0
  const level = creator?.level ?? null

  return (
    <div className="min-h-screen bg-brand-light-pink">
      <Nav level={level} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Image
            src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/logo_pink.png"
            alt="Papaya Social Club"
            width={48}
            height={48}
          />
          <div>
            <h1 className="font-playfair text-4xl text-brand-black mb-1">Deine Belohnungen</h1>
            <p className="font-dm-sans text-gray-500 text-sm">
              Was du jetzt bekommst — und was dich erwartet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LEVELS.map((lvl, idx) => {
            const config = REWARDS[lvl]
            const isCurrent = creator?.level === lvl
            const isPast = idx < currentLevelIndex
            const isFuture = idx > currentLevelIndex

            return (
              <div
                key={lvl}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  isCurrent ? 'border-brand-pink shadow-md' : isPast ? 'border-gray-100' : 'border-gray-100 opacity-45'
                }`}
              >
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{
                    backgroundColor: isFuture ? '#F9FAFB' : `${config.color}15`,
                    borderBottom: `1px solid ${isFuture ? '#F3F4F6' : `${config.color}30`}`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{config.emoji}</span>
                    <div>
                      <h2 className="font-playfair text-xl text-brand-black leading-none">{lvl}</h2>
                      <p className="font-dm-sans text-xs text-gray-400 mt-0.5">{config.gmvRange}</p>
                    </div>
                  </div>
                  <div>
                    {isCurrent && (
                      <span className="font-dm-sans text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: config.color }}>
                        Aktuell
                      </span>
                    )}
                    {isPast && (
                      <span className="font-dm-sans text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Freigeschaltet
                      </span>
                    )}
                    {isFuture && (
                      <span className="font-dm-sans text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        🔒 Gesperrt
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {config.rewards.map((reward, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl ${isFuture ? 'bg-gray-50/50' : 'bg-gray-50'}`}
                    >
                      <span className={`text-xl shrink-0 ${isFuture ? 'grayscale opacity-40' : ''}`}>{reward.emoji}</span>
                      <div>
                        <p className={`font-dm-sans text-sm font-semibold ${isFuture ? 'text-gray-400' : 'text-brand-black'}`}>
                          {reward.title}
                        </p>
                        <p className={`font-dm-sans text-xs mt-0.5 ${isFuture ? 'text-gray-300' : 'text-gray-500'}`}>
                          {reward.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
