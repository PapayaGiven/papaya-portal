'use client'

import { useMemo, useState } from 'react'
import type { Product } from '@/lib/types'

/**
 * Hack Portal product browser — public-facing product list with
 * client-side search + niche filter. Brand exposure tactic: show the
 * universe of products without unlocking the strategy behind them, so
 * the funnel CTA still matters.
 */
export default function HackProductBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [niche, setNiche] = useState<string | null>(null)

  const niches = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) if (p.niche) set.add(p.niche)
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (niche && p.niche !== niche) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.niche?.toLowerCase().includes(q) ?? false) ||
        (p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      )
    })
  }, [products, query, niche])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Produkte oder Nische suchen…"
          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-dm-sans text-sm placeholder-gray-400 focus:border-brand-green focus:outline-none transition"
        />
        <span className="font-dm-sans text-xs text-gray-400 self-center bg-white border border-gray-100 px-3 py-2 rounded-full text-center">
          {filtered.length} / {products.length}
        </span>
      </div>

      {niches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setNiche(null)}
            className={`font-dm-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              niche === null
                ? 'bg-brand-green text-white border-brand-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green/40'
            }`}
          >
            Alle
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              {p.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-dm-sans text-xs">Kein Bild</div>
              )}
              {p.is_exclusive && (
                <span className="absolute top-2 left-2 font-dm-sans text-[10px] font-bold bg-brand-black text-white px-2 py-0.5 rounded-full tracking-wide">
                  EXKLUSIV
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1.5 flex-1">
              {p.niche && (
                <span className="font-dm-sans text-xs font-medium bg-brand-light-pink text-brand-green px-2 py-0.5 rounded-full self-start">
                  {p.niche}
                </span>
              )}
              <p className="font-dm-sans font-semibold text-brand-black text-sm leading-snug line-clamp-2">{p.name}</p>
              <div className="mt-auto flex items-baseline justify-between">
                <p className="font-dm-sans font-bold text-lg text-brand-pink leading-none">{p.commission_rate ?? '–'}%</p>
                <p className="font-dm-sans text-[10px] text-gray-400">Provision</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 font-dm-sans">Keine Produkte gefunden.</p>
      )}
    </div>
  )
}
