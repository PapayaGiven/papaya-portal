import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'

const JOIN_URL = process.env.NEXT_PUBLIC_JOIN_URL ?? 'https://papaya-given.mykajabi.com/offers/QzqH444d'

function LockOverlay({ label = 'Nur für Mitglieder — Tritt bei, um freizuschalten →' }: { label?: string }) {
  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
      <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-2xl px-6 py-5 text-center max-w-xs mx-4">
        <div className="w-10 h-10 rounded-full bg-brand-pink/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="font-dm-sans text-sm font-semibold text-brand-black mb-3">{label}</p>
        <a
          href={JOIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-dm-sans text-xs font-bold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition"
        >
          Papaya beitreten →
        </a>
      </div>
    </div>
  )
}

export default async function HackPage() {
  const supabase = createAdminClient()

  const [productsRes, campaignsRes, creatorsRes] = await Promise.all([
    supabase.from('products').select('*').order('commission_rate', { ascending: false }).limit(6),
    supabase.from('campaigns').select('*').eq('status', 'active').limit(4),
    supabase.from('creators').select('name, gmv').order('gmv', { ascending: false }).limit(5),
  ])

  const products = productsRes.data ?? []
  const campaigns = campaignsRes.data ?? []
  const topCreators = creatorsRes.data ?? []

  return (
    <div className="min-h-screen bg-brand-light-pink">
      {/* Header */}
      <header className="bg-white border-b border-brand-pink/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_green.png"
              alt="Papaya Social Club"
              width={28}
              height={28}
            />
            <span className="font-dm-sans font-semibold text-brand-black text-sm">Papaya Social Club</span>
            <span className="hidden sm:inline font-dm-sans text-xs text-gray-400 ml-1">— Hack Portal</span>
          </div>
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-dm-sans text-sm font-bold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition"
          >
            Jetzt beitreten →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Image
              src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_pink.png"
              alt="Papaya Social Club"
              width={80}
              height={80}
            />
          </div>
          <h1 className="font-playfair text-5xl text-brand-black mb-3">Papaya Social Club</h1>
          <p className="font-dm-sans text-lg text-gray-500 mb-6">
            Die besten Produkte, virale Videos und Kampagnen — kostenlos.
          </p>
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-dm-sans text-base font-bold bg-brand-green text-white px-8 py-3.5 rounded-2xl hover:bg-brand-green/90 transition shadow-lg"
          >
            Papaya Social Club beitreten →
          </a>
        </div>

        {/* Top Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-3xl text-brand-black">Top-Produkte</h2>
            <span className="font-dm-sans text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">{products.length} Produkte</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                {p.niche && (
                  <span className="font-dm-sans text-xs font-medium bg-brand-light-pink text-brand-green px-2 py-0.5 rounded-full self-start">
                    {p.niche}
                  </span>
                )}
                {p.is_exclusive && (
                  <span className="font-dm-sans text-xs font-bold bg-brand-black text-white px-2 py-0.5 rounded-full self-start tracking-wide">
                    EXKLUSIV
                  </span>
                )}
                <p className="font-dm-sans font-semibold text-brand-black text-sm leading-snug">{p.name}</p>
                <p className="font-dm-sans font-bold text-xl text-brand-pink leading-none">
                  {p.commission_rate}%
                </p>
                <p className="font-dm-sans text-xs text-gray-400">Provision</p>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <p className="text-center text-gray-400 py-8 font-dm-sans">Produkte folgen in Kürze.</p>
          )}
        </section>

        {/* Campaigns */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-3xl text-brand-black">Aktive Kampagnen</h2>
            <span className="font-dm-sans text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">{campaigns.length} aktiv</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-playfair text-xl text-brand-black">{c.brand_name}</h3>
                  <div className="text-right shrink-0">
                    <p className="font-dm-sans font-bold text-xl text-brand-pink">{c.commission_rate}%</p>
                    <p className="font-dm-sans text-xs text-gray-400">Provision</p>
                  </div>
                </div>
                {c.description && (
                  <p className="font-dm-sans text-sm text-gray-500 line-clamp-2">{c.description}</p>
                )}
                <div className="relative mt-auto">
                  <button className="w-full py-2.5 rounded-xl font-dm-sans font-semibold text-sm bg-gray-100 text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed" disabled>
                    <svg className="w-4 h-4 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Nur Mitglieder
                  </button>
                  <div className="absolute -top-1 -right-1">
                    <span className="font-dm-sans text-xs font-bold bg-brand-pink text-white px-2 py-0.5 rounded-full">Mitglieder</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {campaigns.length === 0 && (
            <p className="text-center text-gray-400 py-8 font-dm-sans">Derzeit keine aktiven Kampagnen.</p>
          )}
        </section>

        {/* Strategy Preview */}
        <section className="mb-12">
          <h2 className="font-playfair text-3xl text-brand-black mb-5">Meine Strategie</h2>
          <div className="relative rounded-2xl overflow-hidden">
            <div className="filter blur-sm pointer-events-none select-none" aria-hidden="true">
              <div className="bg-white rounded-2xl border border-brand-pink/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-playfair text-2xl text-brand-black">Collagen Eye Patches</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-dm-sans text-xs bg-brand-light-pink text-brand-green px-2 py-0.5 rounded-full">Beauty</span>
                      <span className="font-dm-sans text-xs font-bold text-brand-pink">32% Provision</span>
                    </div>
                  </div>
                  <span className="font-dm-sans text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-300">Hero</span>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4">
                  <div className="text-center">
                    <p className="font-playfair text-2xl font-bold text-brand-black">2</p>
                    <p className="font-dm-sans text-xs text-gray-400">Videos / Tag</p>
                  </div>
                  <div className="text-center">
                    <p className="font-playfair text-2xl font-bold text-brand-black">3h</p>
                    <p className="font-dm-sans text-xs text-gray-400">Live / Woche</p>
                  </div>
                  <div className="text-center">
                    <p className="font-playfair text-2xl font-bold text-brand-green">$1,500</p>
                    <p className="font-dm-sans text-xs text-gray-400">GMV-Ziel</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-50 pt-4">
                  <p className="font-dm-sans text-xs text-gray-400 uppercase tracking-widest mb-2">Strategie-Notiz</p>
                  <p className="font-dm-sans text-sm text-gray-600">Konzentriere dich auf Vorher/Nachher-Transformationen. Nutze Trend-Sounds. Poste zwischen 18–21 Uhr für maximale Reichweite...</p>
                </div>
              </div>
            </div>
            <LockOverlay label="Deine persönliche Strategie ist exklusiv für Mitglieder." />
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mb-12">
          <h2 className="font-playfair text-3xl text-brand-black mb-2">Creator-Ranking</h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-5">Die besten Creators von Papaya Social Club diesen Monat.</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {topCreators.length === 0 ? (
              <p className="text-center text-gray-400 py-8 font-dm-sans">Noch keine Ranking-Daten vorhanden.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {topCreators.map((creator, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-6 py-4">
                    <span className={`font-playfair text-2xl font-bold w-8 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="font-dm-sans font-semibold text-brand-black">{creator.name || 'Creator'}</p>
                    </div>
                    <p className="font-dm-sans font-bold text-brand-green text-lg">
                      ${Number(creator.gmv).toLocaleString('en-US')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="font-dm-sans text-sm text-gray-500 mb-3">Willst du hier erscheinen?</p>
            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-dm-sans text-sm font-bold bg-brand-green text-white px-6 py-2.5 rounded-xl hover:bg-brand-green/90 transition"
            >
              Jetzt beitreten →
            </a>
          </div>
        </section>

        {/* Dashboard Teaser */}
        <section className="mb-12">
          <h2 className="font-playfair text-3xl text-brand-black mb-5">Dein Dashboard</h2>
          <div className="relative rounded-2xl overflow-hidden">
            <div className="filter blur-sm pointer-events-none select-none" aria-hidden="true">
              <div className="bg-white rounded-2xl border border-brand-pink/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="font-playfair text-3xl text-brand-black">Hallo, Sarah!</h1>
                    <p className="font-dm-sans text-sm text-gray-500 mt-1">März 2026</p>
                  </div>
                  <span className="font-dm-sans font-bold text-sm px-3 py-1 rounded-full text-white bg-brand-pink">Rising</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-brand-light-pink rounded-xl p-4 text-center">
                    <p className="font-playfair text-3xl font-bold text-brand-green">$847</p>
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">Dein GMV</p>
                  </div>
                  <div className="bg-brand-light-pink rounded-xl p-4 text-center">
                    <p className="font-playfair text-3xl font-bold text-brand-black">3</p>
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">Aktive Produkte</p>
                  </div>
                  <div className="bg-brand-light-pink rounded-xl p-4 text-center">
                    <p className="font-playfair text-3xl font-bold text-brand-black">2</p>
                    <p className="font-dm-sans text-xs text-gray-500 mt-1">Offene Kampagnen</p>
                  </div>
                </div>
              </div>
            </div>
            <LockOverlay label="Dein persönliches Dashboard — exklusiv für Mitglieder." />
          </div>
        </section>

        {/* CTA Banner */}
        <div className="bg-brand-green rounded-3xl p-8 text-center">
          <h2 className="font-playfair text-4xl text-white mb-3">Bereit zu wachsen?</h2>
          <p className="font-dm-sans text-brand-light-pink/80 text-lg mb-6">
            Tritt Papaya Social Club bei und erhalte Zugang zu allem.
          </p>
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-dm-sans text-base font-bold bg-white text-brand-green px-8 py-3.5 rounded-2xl hover:bg-brand-light-pink transition shadow-lg"
          >
            Papaya Social Club beitreten →
          </a>
        </div>
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-black border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <p className="font-dm-sans text-sm text-white/70 truncate">
            Du siehst das Hack Portal — kostenloser Zugang ☀️
          </p>
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-dm-sans text-sm font-bold bg-brand-green text-white px-5 py-2 rounded-xl hover:bg-brand-green/90 transition shrink-0"
          >
            Vollzugang erhalten →
          </a>
        </div>
      </div>
    </div>
  )
}
