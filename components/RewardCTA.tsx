'use client'

import { RewardRow } from '@/lib/types'

interface RewardCTAProps {
  reward: RewardRow
  status: string | null
}

export default function RewardCTA({ reward, status }: RewardCTAProps) {
  if (status === 'received') {
    return (
      <span className="font-dm-sans text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shrink-0">
        Bereits eingelöst
      </span>
    )
  }

  if (status === 'claimed') {
    return (
      <span className="font-dm-sans text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full shrink-0">
        Beansprucht
      </span>
    )
  }

  if (reward.cta_type === 'link' && reward.cta_url) {
    return (
      <a
        href={reward.cta_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-dm-sans text-xs font-semibold text-brand-green bg-brand-green/10 hover:bg-brand-green/20 px-3 py-1 rounded-full transition shrink-0"
      >
        Einlösen →
      </a>
    )
  }

  if (reward.cta_type === 'whatsapp' && reward.cta_url) {
    return (
      <a
        href={`https://wa.me/${reward.cta_url.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-dm-sans text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full transition shrink-0"
      >
        Per WhatsApp einlösen
      </a>
    )
  }

  if (reward.cta_type === 'claim') {
    return (
      <span className="font-dm-sans text-xs font-semibold text-brand-pink bg-brand-pink/10 px-3 py-1 rounded-full shrink-0">
        Einlösen
      </span>
    )
  }

  return null
}
