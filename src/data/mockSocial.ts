/**
 * Sociální profily (prototyp) — propojení s Facebookem NEDĚLÁME reálně.
 * Profil je jen „propojený" na oko; DOVík z akce sestaví koncept příspěvku a
 * banner, ale žádné FB API, OAuth ani publikování se nekoná (viz STANDARDY §11a).
 */
export interface SocialProfile {
  network: 'facebook'
  name: string
  handle: string
  url: string
  connected: boolean
}

/** Propojený FB profil DOV (fake — správa by patřila do Integrace). */
export const DOV_FB_PROFILE: SocialProfile = {
  network: 'facebook',
  name: 'Dolní Vítkovice',
  handle: '@dolnivitkovice',
  url: 'facebook.com/dolnivitkovice',
  connected: true,
}

export interface FbPostInput {
  title: string
  dateLabel?: string
  placeLabel?: string
  summary?: string
  typeLabel?: string
  price?: string
  tags?: string[]
  /** Úvodní emoji (kvůli „přegenerování" u DOVíka). */
  lead?: string
}

/** Z dat akce deterministicky sestaví text FB příspěvku (prototyp — bez AI). */
export function composeFbPost(e: FbPostInput): string {
  const lines: string[] = []
  lines.push(`${e.lead ?? '🎉'} ${e.title || 'Nová akce v Dolních Vítkovicích'}`)

  const meta: string[] = []
  if (e.dateLabel) meta.push(`📅 ${e.dateLabel}`)
  if (e.placeLabel) meta.push(`📍 ${e.placeLabel}`)
  if (meta.length) lines.push(meta.join('   '))

  if (e.summary) {
    lines.push('')
    lines.push(e.summary)
  }

  lines.push('')
  lines.push(e.price ? `🎟️ ${e.price} — vstupenky a víc na našem webu.` : 'Víc informací najdete na našem webu.')
  lines.push('Těšíme se na vás v Dolních Vítkovicích!')

  const words = ['DolníVítkovice', 'Ostrava']
  if (e.typeLabel) words.push(e.typeLabel.replace(/\s+/g, ''))
  for (const t of e.tags ?? []) words.push(t.replace(/\s+/g, ''))
  lines.push('')
  lines.push([...new Set(words)].map((w) => `#${w}`).join(' '))

  return lines.join('\n')
}
