/**
 * Centrální (mock) adresář uživatelů CMS.
 *
 * `photo` = profilová fotka uživatele. Dnes ukazuje na bundled placeholder
 * portrét (`/avatars/*.jpg`); až přibude upload fotek do uživatelského profilu,
 * stačí sem doplnit URL nahrané fotky — komponenta `UserAvatar` ji zobrazí
 * automaticky. Když uživatel fotku nemá, `UserAvatar` spadne na barevný
 * monogram (iniciály na gradientu odvozeném z `color`).
 */

export interface CmsUser {
  id: string
  name: string
  /** URL profilové fotky (dnes placeholder portrét, později nahraná fotka). */
  photo?: string
  /** Základní barva pro fallback monogram (když fotka chybí). */
  color: string
}

export const CMS_USERS: CmsUser[] = [
  { id: 'jan-voznak', name: 'Jan Voznak', photo: '/avatars/jan-voznak.jpg', color: '#3e5c99' },
  { id: 'jana-svobodova', name: 'Jana Svobodová', photo: '/avatars/jana-svobodova.jpg', color: '#c1547f' },
  { id: 'martin-kucera', name: 'Martin Kučera', photo: '/avatars/martin-kucera.jpg', color: '#2f8a7e' },
  { id: 'petr-dvorak', name: 'Petr Dvořák', photo: '/avatars/petr-dvorak.jpg', color: '#c58b33' },
]

/** Iniciály ze jména (max 2 znaky) — fallback, když uživatel nemá fotku. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s·]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Paleta pro deterministické obarvení neznámých (mimo-adresář) uživatelů. */
const PALETTE = ['#3e5c99', '#c1547f', '#2f8a7e', '#c58b33', '#7a5aa6', '#4c7a34', '#b5573b', '#2f6f9e']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Ztmavení hex barvy o poměr `amt` (0–1) pro spodek gradientu. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amt)))
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amt)))
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amt)))
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

export interface ResolvedUser {
  name: string
  initials: string
  photo?: string
  color: string
  /** CSS gradient pro pozadí fallback monogramu. */
  gradient: string
}

/** Najde uživatele v adresáři podle jména; neznámé odvodí (iniciály + barva). */
export function resolveUser(name: string): ResolvedUser {
  const found = CMS_USERS.find((u) => u.name === name)
  const color = found?.color ?? PALETTE[hash(name) % PALETTE.length]
  return {
    name,
    initials: initialsOf(name),
    photo: found?.photo,
    color,
    gradient: `linear-gradient(135deg, ${color} 0%, ${shade(color, 0.22)} 100%)`,
  }
}
