import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Nav from '@/components/Nav'
import PicksGrid from './PicksGrid'
import { Creator, PapayaPick, CreatorLevel } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LEVEL_RANK: Record<CreatorLevel, number> = {
  Initiation: 0,
  Rising: 1,
  Pro: 2,
  Elite: 3,
}

export default async function PapayaPicksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creatorData } = await supabase
    .from('creators')
    .select('*')
    .eq('email', user.email!)
    .single()
  const creator = creatorData as Creator | null
  if (!creator) redirect('/login')

  const creatorRank = LEVEL_RANK[creator.level]
  const admin = createAdminClient()

  const { data: picksData } = await admin
    .from('papaya_picks')
    .select('*')
    .eq('is_active', true)
    .order('papaya_pick_score', { ascending: false })

  const allPicks = (picksData ?? []) as PapayaPick[]
  const visiblePicks = allPicks.filter((p) => creatorRank >= LEVEL_RANK[p.min_level])

  const isLocked = creator.level === 'Initiation'

  return (
    <div className="min-h-screen bg-brand-light-pink">
      <Nav level={creator.level} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-dm-sans text-xs font-bold tracking-widest text-amber-600 uppercase">🌟 Papaya Picks</span>
            <span className="font-dm-sans text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Bevor alle anderen</span>
          </div>
          <h1 className="font-playfair text-4xl text-brand-black mb-2">Pick der Woche</h1>
          <p className="font-dm-sans text-gray-500 text-base max-w-2xl">
            Produkte mit hoher Nachfrage und wenig Konkurrenz. Wir wählen sie wöchentlich aus, bevor sie überall sind — die Ersten gewinnen am meisten.
          </p>
        </header>

        {isLocked ? (
          <LockedState />
        ) : visiblePicks.length === 0 ? (
          <EmptyState />
        ) : (
          <PicksGrid picks={visiblePicks} />
        )}
      </main>
    </div>
  )
}

function LockedState() {
  return (
    <div className="relative">
      {/* Blurred fake teaser cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 filter blur-md pointer-events-none select-none" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-amber-200/60 overflow-hidden">
            <div className="aspect-[5/4] bg-gradient-to-br from-amber-200 via-brand-pink to-brand-green" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-50 rounded" />
                <div className="h-12 bg-gray-50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="bg-white border-2 border-amber-300/60 rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-playfair text-2xl text-brand-black mb-2">Papaya Picks ab Rising</h2>
          <p className="font-dm-sans text-sm text-gray-600 mb-5">
            Erreiche das Rising-Level (300 € GMV), um wöchentlich die hochpotenten Picks zu sehen, bevor der Rest der Community sie entdeckt.
          </p>
          <Link
            href="/strategy"
            className="inline-block font-dm-sans text-sm font-bold bg-brand-green text-white px-6 py-3 rounded-2xl hover:bg-brand-green/90 transition"
          >
            Strategie ansehen →
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white border border-amber-200/40 rounded-3xl p-12 text-center">
      <p className="text-5xl mb-4">🌟</p>
      <h2 className="font-playfair text-2xl text-brand-black mb-2">Neue Picks landen bald</h2>
      <p className="font-dm-sans text-sm text-gray-500 max-w-md mx-auto">
        Unsere Trend-Analysten kuratieren gerade die nächste Welle. Schau am Wochenanfang wieder vorbei.
      </p>
    </div>
  )
}
