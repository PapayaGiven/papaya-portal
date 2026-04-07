import { CreatorLevel } from './types'

export function canSeeCampaigns(level: CreatorLevel): boolean {
  return level !== 'Initiation'
}

export function canSeeLeaderboard(level: CreatorLevel): boolean {
  return level !== 'Initiation'
}

export function canSeeHashtags(level: CreatorLevel): boolean {
  return level === 'Pro' || level === 'Elite'
}

export function canSeeExampleVideos(level: CreatorLevel): boolean {
  return level === 'Pro' || level === 'Elite'
}

export function hasAccountManager(level: CreatorLevel): boolean {
  return level === 'Pro' || level === 'Elite'
}

export function hasEliteFeatures(level: CreatorLevel): boolean {
  return level === 'Elite'
}

export function getNavLinks(level: CreatorLevel | null): { href: string; label: string }[] {
  const base = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/strategy', label: 'Meine Strategie' },
    { href: '/products', label: 'Produkte' },
    { href: '/progress', label: 'Mein Fortschritt' },
    { href: '/rewards', label: 'Belohnungen' },
    { href: '/violations', label: 'Verstoß melden' },
  ]

  if (!level || level === 'Initiation') return base

  return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/strategy', label: 'Meine Strategie' },
    { href: '/products', label: 'Produkte' },
    { href: '/campaigns', label: 'Kampagnen' },
    { href: '/progress', label: 'Mein Fortschritt' },
    { href: '/rewards', label: 'Belohnungen' },
    { href: '/violations', label: 'Verstoß melden' },
  ]
}

export const LEVEL_ORDER: CreatorLevel[] = ['Initiation', 'Rising', 'Pro', 'Elite']

export function getLevelIndex(level: CreatorLevel): number {
  return LEVEL_ORDER.indexOf(level)
}

export function isHigherLevel(a: CreatorLevel, b: CreatorLevel): boolean {
  return getLevelIndex(a) > getLevelIndex(b)
}
