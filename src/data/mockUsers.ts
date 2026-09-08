/**
 * Modul Uživatelé — účty do administrace.
 *
 * Tenhle soubor je zároveň **adresář pro avatary**: `resolveUser(name)` hledá
 * podle jména a používají ho autoři aktualit, editoři záznamů i topbar. Účty se
 * proto nedělají jako druhá entita vedle adresáře — jinak by v CMS byly dva
 * seznamy lidí, které se rozejdou. Jeden seznam, jeden vlastník (STANDARDY §14a).
 *
 * `photo` = profilová fotka uživatele. Dnes ukazuje na bundled placeholder
 * portrét (`/avatars/*.jpg`); až přibude upload fotek do uživatelského profilu,
 * stačí sem doplnit URL nahrané fotky — komponenta `UserAvatar` ji zobrazí
 * automaticky. Když uživatel fotku nemá, `UserAvatar` spadne na barevný
 * monogram (iniciály na gradientu odvozeném z `color`).
 */

/** Uložený stav účtu. `expired` mezi nimi není — dopočítává se, viz `userState()`. */
export type UserStatus = 'active' | 'blocked'

/** „Správa všeho" (superadmin) — nahrazuje jednotlivá modulová oprávnění. */
export const PERM_ALL = 'all'

/** Oprávnění po modulech. Seznam kopíruje skupiny v `AppSidebar.vue` — až vznikne
    zapínání modulů per klient, bude se odsud odvozovat. */
export const MODULE_PERMISSIONS: { key: string; label: string; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'Přehled' },
  { key: 'events', label: 'Kalendář akcí', group: 'Program' },
  { key: 'area', label: 'Areál', group: 'Program' },
  { key: 'tours', label: 'Prohlídky', group: 'Program' },
  { key: 'tickets', label: 'Vstupenky', group: 'Program' },
  { key: 'news', label: 'Aktuality', group: 'Obsah' },
  { key: 'pages', label: 'Stránky', group: 'Obsah' },
  { key: 'galleries', label: 'Galerie', group: 'Obsah' },
  { key: 'faq', label: 'FAQ', group: 'Obsah' },
  { key: 'popups', label: 'Pop-up', group: 'Obsah' },
  { key: 'infobar', label: 'Informační lišta', group: 'Obsah' },
  { key: 'navigation', label: 'Navigace', group: 'Struktura webu' },
  { key: 'contacts', label: 'Kontakty', group: 'Struktura webu' },
  { key: 'footer', label: 'Patička', group: 'Struktura webu' },
  { key: 'products', label: 'Produkty', group: 'E-shop' },
  { key: 'vouchers', label: 'Vouchery', group: 'E-shop' },
  { key: 'product-categories', label: 'Kategorie zboží', group: 'E-shop' },
  { key: 'education', label: 'Vzdělávací programy', group: 'Ostatní moduly' },
  { key: 'grants', label: 'Dotační projekty', group: 'Ostatní moduly' },
  { key: 'careers', label: 'Kariéra', group: 'Ostatní moduly' },
  { key: 'integrations', label: 'Integrace', group: 'Nastavení' },
  { key: 'taxonomy', label: 'Štítky a kategorie', group: 'Nastavení' },
  { key: 'users', label: 'Uživatelé', group: 'Nastavení' },
]

export interface CmsUser {
  id: string
  /** Přihlašovací jméno — unikátní, nemění se. */
  login: string
  /** Zobrazované jméno. Zároveň klíč, pod kterým se člověk páruje jako autor. */
  name: string
  email: string
  phone: string
  /** URL profilové fotky (dnes placeholder portrét, později nahraná fotka). */
  photo?: string
  /** Základní barva pro fallback monogram (když fotka chybí). */
  color: string
  status: UserStatus
  /** `[PERM_ALL]` = správa všeho, jinak klíče z `MODULE_PERMISSIONS`. */
  permissions: string[]
  /** Poslední přihlášení (ISO datum). null = ještě se nepřihlásil. */
  lastLogin: string | null
  /** Platnost účtu (ISO datum). null = bez omezení. */
  expiresAt: string | null
  /** Konec platnosti hesla (ISO datum). null = neřeší se. */
  passwordExpiresAt: string | null
}

/** Kdo je přihlášený. V prototypu zadrátované — přihlášení neexistuje (STANDARDY §11). */
export const CURRENT_USER_ID = 'jan-voznak'

export const CMS_USERS: CmsUser[] = [
  {
    id: 'jan-voznak',
    login: 'jvoznak',
    name: 'Jan Voznak',
    email: 'jan.voznak@dolnivitkovice.cz',
    phone: '+420 601 111 222',
    photo: '/avatars/jan-voznak.jpg',
    color: '#3e5c99',
    status: 'active',
    permissions: [PERM_ALL],
    lastLogin: '2026-07-28',
    expiresAt: null,
    passwordExpiresAt: null,
  },
  {
    id: 'jana-svobodova',
    login: 'jsvobodova',
    name: 'Jana Svobodová',
    email: 'jana.svobodova@dolnivitkovice.cz',
    phone: '+420 601 234 567',
    photo: '/avatars/jana-svobodova.jpg',
    color: '#c1547f',
    status: 'active',
    permissions: ['tours', 'tickets', 'events', 'news'],
    lastLogin: '2026-07-27',
    expiresAt: null,
    passwordExpiresAt: '2026-08-20',
  },
  {
    id: 'martin-kucera',
    login: 'mkucera',
    name: 'Martin Kučera',
    email: 'martin.kucera@dolnivitkovice.cz',
    phone: '+420 602 345 678',
    photo: '/avatars/martin-kucera.jpg',
    color: '#2f8a7e',
    status: 'active',
    permissions: ['news', 'galleries', 'faq', 'pages', 'infobar'],
    lastLogin: '2026-07-24',
    expiresAt: null,
    passwordExpiresAt: null,
  },
  {
    id: 'petr-dvorak',
    login: 'pdvorak',
    name: 'Petr Dvořák',
    email: 'petr.dvorak@dolnivitkovice.cz',
    phone: '+420 603 456 789',
    photo: '/avatars/petr-dvorak.jpg',
    color: '#c58b33',
    status: 'active',
    permissions: ['products', 'vouchers', 'product-categories'],
    lastLogin: '2026-06-30',
    // Externí spolupráce na e-shopu — účet má omezenou platnost.
    expiresAt: '2026-09-30',
    passwordExpiresAt: null,
  },
  {
    id: 'lucie-zemanova',
    login: 'lzemanova',
    name: 'Lucie Zemanová',
    color: '#7a5aa6',
    email: 'lucie.zemanova@dolnivitkovice.cz',
    phone: '',
    status: 'blocked',
    permissions: ['events'],
    // Zablokovaný účet po odchodu z brigády; bez fotky → monogram.
    lastLogin: '2026-05-12',
    expiresAt: null,
    passwordExpiresAt: null,
  },
]

/* ---------- Stav účtu ---------- */
/** Efektivní stav — `expired` se nedrží v datech, plyne z `expiresAt`. */
export type UserState = 'active' | 'blocked' | 'expired'

export const USER_STATE_META: Record<UserState, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Aktivní', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  blocked: { label: 'Zablokovaný', dot: 'bg-danger-500', text: 'text-danger-500', bg: 'bg-danger-500/10' },
  expired: { label: 'Vypršel', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}

/** „Dnešek" prototypu (shodný s ostatními moduly) jako ISO datum. */
export const USERS_TODAY = '2026-07-28'

export function userState(u: CmsUser): UserState {
  if (u.status === 'blocked') return 'blocked'
  if (u.expiresAt && u.expiresAt < USERS_TODAY) return 'expired'
  return 'active'
}

/* ---------- Oprávnění a účty ---------- */
export function isSuperadmin(u: CmsUser): boolean {
  return u.permissions.includes(PERM_ALL)
}
/** Kolik modulů uživatel spravuje — do výpisu. */
export function permissionCount(u: CmsUser): number {
  return isSuperadmin(u) ? MODULE_PERMISSIONS.length : u.permissions.length
}
/** Vyprší heslo do 30 dnů? Varování ve výpisu i v detailu. */
export function passwordExpiringSoon(u: CmsUser): boolean {
  if (!u.passwordExpiresAt) return false
  const days = (Date.parse(u.passwordExpiresAt) - Date.parse(USERS_TODAY)) / 86_400_000
  return days >= 0 && days <= 30
}
/** Vlastní účet — destruktivní akce na sobě nedávají smysl (smazat/impersonovat sebe). */
export function isSelf(u: CmsUser): boolean {
  return u.id === CURRENT_USER_ID
}
export function user(id: string): CmsUser | undefined {
  return CMS_USERS.find((u) => u.id === id)
}
export function blankUser(): CmsUser {
  return {
    id: 'nový',
    login: '',
    name: '',
    email: '',
    phone: '',
    color: '#3e5c99',
    status: 'active',
    permissions: [],
    lastLogin: null,
    expiresAt: null,
    passwordExpiresAt: null,
  }
}

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
