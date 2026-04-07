import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Nav from '@/components/Nav'
import RewardCTA from '@/components/RewardCTA'
import { Creator, CreatorLevel, LEVEL_CONFIG, RewardRow } from '@/lib/types'

const LEVEL_PERKS: Record<CreatorLevel, { title: string; gmvRange: string; perks: string[]; color: string; emoji: string }> = {
  Initiation: {
    title: 'Initiation',
    gmvRange: '$0 – $299',
    emoji: '🌱',
    color: '#9CA3AF',
    perks: [
      'Zugang zur Creator Community',
      'Basis Produktkatalog',
      'Tipps und wöchentliche Ratschläge',
      'Creator Newsletter',
      'Dashboard Zugang',
    ],
  },
  Rising: {
    title: 'Rising',
    gmvRange: '$300 – $999',
    emoji: '🌸',
    color: '#F4A7C3',
    perks: [
      'Alles von Initiation',
      'Exklusive Produkte freigeschaltet',
      'Prioritäts-Support',
      'Marken-Benachrichtigungen',
      'Badge für $300 GMV',
      'Monatliches Creator Briefing',
    ],
  },
  Pro: {
    title: 'Pro',
    gmvRange: '$1.000 – $9.999',
    emoji: '💚',
    color: '#1B5E3B',
    perks: [
      'Alles von Rising',
      'Premium Kampagnen (exklusiv Pro+)',
      'Dedizierter Account Manager',
      'Monatliche 1:1 Strategie-Calls',
      'Badge für $1.000 GMV',
      'Quartalsbonus',
    ],
  },
  Elite: {
    title: 'Elite',
    gmvRange: '$10.000+',
    emoji: '👑',
    color: '#F59E0B',
    perks: [
      'Alles von Pro',
      'Alle Kampagnen und höchste Provisionen',
      'Co-Branded Deals und Agentur-Partnership',
      'Badge für $10.000 GMV',
      'Einladungen zu Events und Reisen',
      'Quartalsbonus von $500',
    ],
  },
}

const LEVELS: CreatorLevel[] = ['Initiation', 'Rising', 'Pro', 'Elite']

function getLevelIndex(level: CreatorLevel): number {
  return LEVELS.indexOf(level)
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creatorData } = await supabase
    .from('creators')
    .select('*')
    .eq('email', user.email!)
    .single()

  const creator = creatorData as Creator | null
  const level = creator?.level ?? null
  const currentLevelIndex = creator ? getLevelIndex(creator.level) : 0

  // Fetch rewards
  const admin = createAdminClient()
  const { data: rewardsData } = await admin
    .from('rewards')
    .select('*')
    .order('sort_order')
  const rewards = (rewardsData ?? []) as RewardRow[]

  // Fetch creator rewards
  const creatorRewardStatuses: Record<string, string> = {}
  if (creator) {
    const { data: crData } = await supabase
      .from('creator_rewards')
      .select('reward_id, status')
      .eq('creator_id', creator.id)
    if (crData) {
      crData.forEach((cr: { reward_id: string; status: string }) => {
        creatorRewardStatuses[cr.reward_id] = cr.status
      })
    }
  }

  return (
    <div className="min-h-screen bg-brand-light-pink">
      <Nav level={level} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Image
            src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/logo_pink.png"
            alt="Papaya Social Club"
            width={48}
            height={48}
          />
          <div>
            <h1 className="font-playfair text-4xl text-brand-black mb-1">Dein Fortschritt</h1>
            <p className="font-dm-sans text-gray-500 text-sm">
              Vier Level, eine Mission. Sieh wo du stehst und was als nächstes kommt.
            </p>
          </div>
        </div>

        {creator && (
          <div className="mb-8 inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm">
            <span className="text-xl">{LEVEL_PERKS[creator.level].emoji}</span>
            <span className="font-dm-sans text-sm font-semibold text-brand-black">Du bist auf Level</span>
            <span
              className="font-dm-sans text-sm font-bold px-3 py-0.5 rounded-full text-white"
              style={{ backgroundColor: LEVEL_PERKS[creator.level].color }}
            >
              {creator.level}
            </span>
            <span className="font-dm-sans text-sm text-gray-400">
              · GMV: ${creator.gmv.toLocaleString('en-US')}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {LEVELS.map((lvl, idx) => {
            const config = LEVEL_PERKS[lvl]
            const isCurrent = creator?.level === lvl
            const isPast = idx < currentLevelIndex
            const isFuture = idx > currentLevelIndex
            const levelRewards = rewards.filter((r) => r.level_name === lvl)

            return (
              <div
                key={lvl}
                className={`relative bg-white rounded-2xl border transition-all overflow-hidden ${
                  isCurrent ? 'border-brand-pink shadow-md' : isPast ? 'border-gray-100' : 'border-gray-100 opacity-50'
                }`}
              >
                {isCurrent && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: config.color }} />
                )}
                {isPast && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gray-200" />}

                <div className="p-6 pl-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-playfair text-2xl text-brand-black leading-none">{config.title}</h2>
                          {isCurrent && (
                            <span className="font-dm-sans text-xs font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: config.color }}>
                              Aktuell
                            </span>
                          )}
                          {isPast && (
                            <span className="font-dm-sans text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Erreicht
                            </span>
                          )}
                          {isFuture && (
                            <span className="font-dm-sans text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              🔒 Gesperrt
                            </span>
                          )}
                        </div>
                        <p className="font-dm-sans text-sm text-gray-400 mt-0.5">{config.gmvRange}</p>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {config.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-0.5 shrink-0 text-sm ${isFuture ? 'text-gray-300' : 'text-emerald-500'}`}>
                          {isFuture ? '○' : '✓'}
                        </span>
                        <span className={`font-dm-sans text-sm ${isFuture ? 'text-gray-400' : 'text-gray-700'}`}>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Level Rewards */}
                  {levelRewards.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <h4 className="font-dm-sans text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Belohnungen</h4>
                      <div className="space-y-2">
                        {levelRewards.map((r) => {
                          const status = creatorRewardStatuses[r.id]
                          return (
                            <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl ${isFuture ? 'bg-gray-50/50' : 'bg-gray-50'}`}>
                              <span className={`text-xl shrink-0 ${isFuture ? 'grayscale opacity-40' : ''}`}>{r.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`font-dm-sans text-sm font-semibold ${isFuture ? 'text-gray-400' : 'text-brand-black'}`}>
                                  {r.title}
                                </p>
                                <p className={`font-dm-sans text-xs mt-0.5 ${isFuture ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {r.description}
                                </p>
                              </div>
                              {!isFuture && r.cta_type && (
                                <RewardCTA reward={r} status={status ?? null} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {isCurrent && creator && LEVEL_CONFIG[lvl].target && (
                    <div className="mt-5 pt-4 border-t border-gray-50">
                      <div className="flex justify-between mb-1.5">
                        <span className="font-dm-sans text-xs text-gray-400">${creator.gmv.toLocaleString('en-US')} GMV</span>
                        <span className="font-dm-sans text-xs text-gray-400">Ziel: ${(LEVEL_CONFIG[lvl].target ?? 0).toLocaleString('en-US')}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((creator.gmv / (LEVEL_CONFIG[lvl].target ?? 1)) * 100, 100)}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
