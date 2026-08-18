/**
 * Siluety budov areálu (filled SVG cesty) — jeden zdroj pravdy.
 * Používá je komponenta `VenueSilhouette.vue` k vykreslení a výběr siluety
 * v detailu objektu (Areál → Základní). Klíč se ukládá do `AreaObject.silhouette`
 * a propisuje se všude, kde se objekt vybírá (kalendář, RelationPicker v akcích…).
 */
export const SILHOUETTE_PATHS: Record<string, string> = {
  // Areál DOV — silueta skyline (pece + věž + plynojem)
  areal: 'M2 21h20v2H2zM4 21V10h3v11zM4 10l1.5-3L7 10zM9 21V6h2.5v15zM9 6l1.25-2.5L11.5 6zM14 21v-6a4 4 0 0 1 8 0v6z',
  // Bolt Tower — vysoká pec s věží
  bolt: 'M8 21h8v2H8zM9.5 21V8h5v13zM10.5 8V4h3v4zM11.6 4V1.5h1.6V4z',
  // Gong — plynojem (kupole)
  gong: 'M4 21h16v2H4zM5 21v-8a7 7 0 0 1 14 0v8z',
  // Galerie Gong — obraz na stojanu
  galerie: 'M6 3h12v12H6zM11 15h2v5h-2zM7 20h10v2H7z',
  // Svět techniky — hala s obloukovou střechou
  technika: 'M3 21h18v2H3zM4 21v-8l8-5 8 5v8zM13.5 5h2v4h-2z',
  // Důl Hlubina — těžní věž s kolem
  hlubina: 'M6 21l3-9h6l3 9h-2.2l-2.3-7h-3l-2.3 7zM12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  // HopJump — odraz (šipka nad trampolínou)
  hopjump: 'M12 3l5 7h-3v4h-4v-4H7zM5 18h14l-2 4H7z',
  // Lezecká stěna — stěna s chyty
  lezecka: 'M6 2h4v20H6zM10 5h2.5v2.5H10zM10 10.5h2.5V13H10zM10 16h2.5v2.5H10z',
}

/** Výchozí klíč siluety, když objekt žádnou nemá. */
export const DEFAULT_SILHOUETTE = 'areal'

/** Volby siluet pro výběr v detailu objektu (klíč + popisek). */
export const SILHOUETTE_OPTIONS: { key: string; label: string }[] = [
  { key: 'areal', label: 'Areál (skyline)' },
  { key: 'bolt', label: 'Bolt Tower (vysoká pec)' },
  { key: 'gong', label: 'Gong (plynojem)' },
  { key: 'galerie', label: 'Galerie' },
  { key: 'technika', label: 'Svět techniky (hala)' },
  { key: 'hlubina', label: 'Důl Hlubina (těžní věž)' },
  { key: 'hopjump', label: 'HopJump' },
  { key: 'lezecka', label: 'Lezecká stěna' },
]
