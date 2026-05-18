'use client'

import { useMemo, useState } from 'react'
import type { PapayaPick } from '@/lib/types'

/**
 * Creator-facing Papaya Picks grid with niche pill filter. Sort defaults
 * to score-desc (server already orders this way) and we keep that order
 * after filtering instead of resorting per niche — admins curate scores
 * to be globally meaningful, so a niche slice should still respect them.
 */
export default function PicksGrid({ picks }: { picks: PapayaPick[] }) {
  const [niche, setNiche] = useState<string | null>(null)

  const niches = useMemo(() => {
    const set = new Set<string>()
    for (const p of picks) if (p.niche) set.add(p.niche)
    return Array.from(set).sort()
  }, [picks])

  const filtered = niche ? picks.filter((p) => p.niche === niche) : picks

  return (
    <div>
      {niches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setNiche(null)}
            className={`font-dm-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              niche === null
                ? 'bg-brand-green text-white border-brand-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green/40'
            }`}
          >
            Alle Nischen
          </button>
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => setNiche(n === niche ? null : n)}
              className={`font-dm-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                niche === n
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12 font-dm-sans">Keine Picks in dieser Nische.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, idx) => (
            <PickCard key={p.id} pick={p} rank={idx + 1 + (niche === null ? 0 : 0)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PickCard({ pick, rank }: { pick: PapayaPick; rank: number }) {
  const score = Math.round(pick.papaya_pick_score ?? 0)
  const isHot = pick.growth_percentage >= 50 || pick.units_sold_this_week >= 500
  return (
    <article className="bg-white rounded-2xl border border-amber-200/60 overflow-hidden flex flex-col shadow-sm">
      <div className="aspect-[5/4] bg-gradient-to-br from-amber-50 to-brand-light-pink relative">
        {pick.product_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={pick.product_image_url} alt={pick.product_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-dm-sans text-sm">Kein Bild</div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="font-dm-sans text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">#{rank}</span>
          {isHot && (
            <span className="font-dm-sans text-xs font-bold bg-brand-pink text-white px-2.5 py-1 rounded-full">🔥 Heiß</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="font-dm-sans text-xs font-bold bg-white/95 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            Score {score}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {pick.niche && (
              <span className="font-dm-sans text-xs font-medium bg-brand-light-pink text-brand-green px-2 py-0.5 rounded-full">
                {pick.niche}
              </span>
            )}
            {pick.brand_name && <span className="font-dm-sans text-xs text-gray-500">{pick.brand_name}</span>}
          </div>
          <h3 className="font-playfair text-xl text-brand-black leading-snug">{pick.product_name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center border-t border-gray-50 pt-3">
          <div>
            <p className="font-playfair text-xl font-bold text-brand-green">{pick.units_sold_this_week.toLocaleString('de-DE')}</p>
            <p className="font-dm-sans text-[10px] text-gray-400 uppercase tracking-wider">Verkäufe / Woche</p>
          </div>
          <div>
            <p className="font-playfair text-xl font-bold text-brand-pink">+{pick.growth_percentage}%</p>
            <p className="font-dm-sans text-[10px] text-gray-400 uppercase tracking-wider">Wachstum</p>
          </div>
          <div>
            <p className="font-playfair text-xl font-bold text-brand-black">{pick.affiliates_count}</p>
            <p className="font-dm-sans text-[10px] text-gray-400 uppercase tracking-wider">Affiliates</p>
          </div>
          <div>
            <p className="font-playfair text-xl font-bold text-brand-black">{pick.videos_count}</p>
            <p className="font-dm-sans text-[10px] text-gray-400 uppercase tracking-wider">Videos</p>
          </div>
        </div>

        {pick.why_its_a_pick && (
          <div className="bg-amber-50 border border-amber-200/40 rounded-xl p-3">
            <p className="font-dm-sans text-[10px] text-amber-700 uppercase tracking-widest font-bold mb-1">Warum ein Pick?</p>
            <p className="font-dm-sans text-xs text-amber-900 leading-relaxed">{pick.why_its_a_pick}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {pick.commission_rate != null && (
            <span className="font-dm-sans text-xs font-bold text-brand-pink">{pick.commission_rate}% Provision</span>
          )}
          {pick.product_link && (
            <a
              href={pick.product_link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-dm-sans text-xs font-bold bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green/90 transition"
            >
              Produkt öffnen →
            </a>
          )}
          {pick.sample_link && (
            <a
              href={pick.sample_link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-dm-sans text-xs font-semibold text-brand-green underline self-center"
            >
              Sample
            </a>
          )}
          {pick.example_video_url && (
            <a
              href={pick.example_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-dm-sans text-xs font-semibold text-brand-green underline self-center"
            >
              Beispielvideo
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
