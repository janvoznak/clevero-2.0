import { imageFor } from './mockNews'

/* ============================================================
   Modul Galerie (zástupná data pro výběr v jiných modulech).
   Galerie se spravují ve vlastním modulu; jinde se jen přiřazují.
   ============================================================ */
export interface Gallery {
  id: string
  name: string
  cover: string
  count: number
}

export const MOCK_GALLERIES: Gallery[] = [
  { id: 'g-u6', name: 'Malý svět techniky U6', cover: imageFor(4), count: 24 },
  { id: 'g-bolt', name: 'Bolt Tower', cover: imageFor(0), count: 18 },
  { id: 'g-hlubina', name: 'Důl Hlubina', cover: imageFor(5), count: 31 },
  { id: 'g-gong', name: 'Gong — multifunkční aula', cover: imageFor(8), count: 15 },
  { id: 'g-technika', name: 'Velký svět techniky', cover: imageFor(13), count: 27 },
  { id: 'g-galerie', name: 'Galerie Gong — výstavy', cover: imageFor(3), count: 20 },
  { id: 'g-areal', name: 'Areál DOV — letecké snímky', cover: imageFor(1), count: 42 },
  { id: 'g-akce', name: 'Akce a festivaly', cover: imageFor(7), count: 56 },
  { id: 'g-hotel', name: 'Ubytování v areálu', cover: imageFor(6), count: 12 },
  { id: 'g-gastro', name: 'Restaurace a kavárny', cover: imageFor(9), count: 19 },
]

export function gallery(id: string): Gallery | undefined {
  return MOCK_GALLERIES.find((g) => g.id === id)
}
