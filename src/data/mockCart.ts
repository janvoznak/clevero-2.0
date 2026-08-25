/* ============================================================
   Košík (prototyp) — sdílený stav mezi výběrem vstupenek
   a stránkou košíku. V ostrém provozu drží košík Colosseum;
   tady je to jen reaktivní objekt v paměti.

   Klíč skupiny (`key`) = akce + termín (u datovaných), resp. akce
   + `open` (u nedatovaných, které žádný termín nemají). Díky němu
   se opakovaný nákup téhož slučuje do jedné skupiny a „Upravit
   výběr" se vrací do TÉŽE skupiny místo zakládání druhé,
   vizuálně shodné položky.
   ============================================================ */
import { reactive } from 'vue'

export interface CartLine {
  /** Id vstupenky/balíčku v rámci skupiny. */
  id: string
  label: string
  /** Doplněk pod názvem — věk, podmínka. */
  sub?: string
  /** Cena za kus / balíček. */
  unitPrice: number
  qty: number
  /** Počet osob na jeden kus (balíček = dospělí + děti). */
  personsPerUnit: number
  /** U rodinného balíčku zvolený počet dětí (kvůli návratu do editace). */
  packageChildren?: number
}

export interface CartGroup {
  /** `itemId|termín` nebo `itemId|open` — viz komentář nahoře. */
  key: string
  itemId: string
  title: string
  venue: string
  /**
   * Datovaná vstupenka = váže se na pevný termín. U nedatovaných
   * se datum NIKDE nezobrazuje — zákazník má 30 dnů a dorazí kdy chce.
   */
  dated: boolean
  /** Hlavní řádek termínu — „25. srpna 2026 · úterý 9:00" (jen datované). */
  dateLabel?: string
  /** Jazyk prohlídky s průvodcem — vykresluje se s vlaječkou. */
  language?: string
  /** Ostatní doplňky k termínu. */
  extraMeta: string[]
  lines: CartLine[]
}

export const cart = reactive<{ groups: CartGroup[] }>({
  groups: [
    /* Ukázkový obsah odpovídá reálnému košíku z Colossea (11 vstupenek, 2 130 Kč),
       aby šla stránka otevřít i bez průchodu výběrem. */
    {
      key: 'farani-do-dolu|2026-08-25T09:00',
      itemId: 'farani-do-dolu',
      title: 'Fárání do DOLU a báňské záchranářství',
      venue: 'Landek Park',
      dated: true,
      dateLabel: '25. srpna 2026 · úterý 9:00',
      language: 'Česky',
      extraMeta: [],
      lines: [
        { id: 'adult', label: 'Dospělý', unitPrice: 295, qty: 2, personsPerUnit: 1 },
        { id: 'student', label: 'Student', sub: '15–26 let', unitPrice: 220, qty: 1, personsPerUnit: 1 },
        { id: 'senior', label: 'Senior', sub: '65+ let', unitPrice: 220, qty: 3, personsPerUnit: 1 },
        { id: 'child', label: 'Dítě', sub: '6–15 let', unitPrice: 220, qty: 1, personsPerUnit: 1 },
        { id: 'child-free', label: 'Dítě do 6 let', sub: 'Vstup zdarma', unitPrice: 0, qty: 2, personsPerUnit: 1 },
        { id: 'ztp', label: 'ZTP', sub: 'Průkaz předložte u vstupu', unitPrice: 220, qty: 1, personsPerUnit: 1 },
        { id: 'ztpp', label: 'ZTP/P', sub: 'Průvodce vstupuje zdarma', unitPrice: 220, qty: 1, personsPerUnit: 1 },
      ],
    },
  ],
})

export function findGroup(key: string): CartGroup | undefined {
  return cart.groups.find((g) => g.key === key)
}

/** Vloží výběr do košíku; stejný termín se sloučí do jedné skupiny. */
export function addToCart(group: CartGroup) {
  const existing = findGroup(group.key)
  if (!existing) {
    cart.groups.unshift(group)
    return
  }
  for (const line of group.lines) {
    const match = existing.lines.find((l) => l.id === line.id)
    if (match) {
      match.qty += line.qty
      match.packageChildren = line.packageChildren ?? match.packageChildren
    } else {
      existing.lines.push({ ...line })
    }
  }
}

/** Přepíše skupinu po návratu z editace výběru (nezakládá druhou). */
export function replaceGroup(key: string, group: CartGroup) {
  const index = cart.groups.findIndex((g) => g.key === key)
  if (index === -1) {
    addToCart(group)
    return
  }
  if (!group.lines.length) {
    cart.groups.splice(index, 1)
    return
  }
  cart.groups.splice(index, 1, group)
}

export function removeLine(group: CartGroup, lineId: string) {
  group.lines = group.lines.filter((l) => l.id !== lineId)
  if (!group.lines.length) cart.groups = cart.groups.filter((g) => g !== group)
}

export function groupTotal(group: CartGroup): number {
  return group.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
}

export function cartTotal(): number {
  return cart.groups.reduce((sum, g) => sum + groupTotal(g), 0)
}

export function cartPersons(): number {
  return cart.groups.reduce(
    (sum, g) => sum + g.lines.reduce((s, l) => s + l.qty * l.personsPerUnit, 0),
    0,
  )
}

/** Počet položek (vstupenek a balíčků) — do odznaku u košíku. */
export function cartCount(): number {
  return cart.groups.reduce((sum, g) => sum + g.lines.reduce((s, l) => s + l.qty, 0), 0)
}
