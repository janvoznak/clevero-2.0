import type { NewsItem, GalleryImage, PublishState } from './types'

/** Reálné obrázky (lokálně v public/images). Prototyp — obsah je zástupný. */
const IMAGE_COUNT = 18
export function imageFor(seed: number): string {
  return `/images/g${(((seed % IMAGE_COUNT) + IMAGE_COUNT) % IMAGE_COUNT) + 1}.jpg`
}

function makeGallery(count: number, offset = 0): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${offset}-${i}`,
    src: imageFor(offset * 3 + i),
    alt: `Fotografie ${i + 1}`,
    isMain: i === 0,
  }))
}

const empty = { cs: '', en: '', de: '' }

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n-2041',
    title: {
      cs: 'Bolt Tower otevírá letní vyhlídkovou sezónu',
      en: 'Bolt Tower opens the summer viewing season',
      de: 'Bolt Tower eröffnet die Sommer-Aussichtssaison',
    },
    summary: {
      cs: 'Nová vyhlídková plošina na vrcholu vysoké pece nabízí výhled na celou Ostravu.',
      en: 'The new observation deck atop the blast furnace offers a view of all of Ostrava.',
      de: '',
    },
    text: {
      cs: '<p>Od 1. července se návštěvníkům otevírá <strong>Bolt Tower</strong> s prodlouženou otevírací dobou.</p>',
      en: '',
      de: '',
    },
    videoLink: 'https://www.youtube.com/watch?v=dov-bolt-tower',
    dateFrom: '2026-07-01T08:00',
    dateTo: '2026-09-30T20:00',
    metaTitle: { cs: 'Bolt Tower — letní sezóna | Dolní Vítkovice', en: '', de: '' },
    metaDescription: { cs: 'Vyhlídka z vrcholu vysoké pece č. 1 v areálu Dolní Vítkovice.', en: '', de: '' },
    metaKeywords: { cs: 'Bolt Tower, vyhlídka, Ostrava, vysoká pec', en: '', de: '' },
    ogImage: null,
    gallery: makeGallery(6, 0),
    attachments: [
      { id: 'a1', name: 'tiskova-zprava-bolt-tower.pdf', size: '248 kB', ext: 'pdf', lang: 'cs' },
      { id: 'a2', name: 'oteviraci-doba-leto.pdf', size: '96 kB', ext: 'pdf', lang: 'cs' },
    ],
  },
  {
    id: 'n-2038',
    title: {
      cs: 'Colours of Ostrava 2026 — program v Gongu',
      en: 'Colours of Ostrava 2026 — programme at the Gong',
      de: '',
    },
    summary: { cs: 'Doprovodný program festivalu se letos přesouvá do multifunkční auly Gong.', en: '', de: '' },
    text: { cs: '<p>Multifunkční aula <strong>Gong</strong> hostí přednášky a diskuze.</p>', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-07-15T00:00',
    dateTo: '2026-07-20T23:59',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(4, 2),
    attachments: [{ id: 'a3', name: 'program-gong.pdf', size: '512 kB', ext: 'pdf', lang: 'cs' }],
  },
  {
    id: 'n-2035',
    title: { cs: 'Noční prohlídky Dolu Hlubina', en: 'Night tours of the Hlubina Mine', de: '' },
    summary: { cs: 'Zážitkové prohlídky bývalého černouhelného dolu při svitu lamp.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-08-01T18:00',
    dateTo: null,
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(3, 1),
    attachments: [],
  },
  {
    id: 'n-2030',
    title: { cs: 'Velký svět techniky — nová interaktivní expozice', en: '', de: '' },
    summary: { cs: 'Science and technology centrum U6 rozšiřuje expozici o robotiku.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-05-10T09:00',
    dateTo: '2026-06-30T18:00',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(5, 3),
    attachments: [],
  },
  {
    id: 'n-2024',
    title: { cs: 'Adventní trhy v areálu — připravujeme', en: '', de: '' },
    summary: { cs: 'Rozpracovaný koncept vánočních trhů mezi vysokými pecemi.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: null,
    dateTo: null,
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: [],
    attachments: [],
  },
  {
    id: 'n-2019',
    title: { cs: 'Den otevřených dveří energetické ústředny', en: '', de: '' },
    summary: { cs: 'Komentované prohlídky strojovny a dmychadel.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-03-01T10:00',
    dateTo: '2026-03-02T17:00',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(2, 4),
    attachments: [],
  },
]

/** Odvození stavu publikace z časového okna OD–DO vůči „dnešku" prototypu. */
export function publishState(item: NewsItem, now = new Date('2026-07-28T12:00:00')): PublishState {
  const from = item.dateFrom ? new Date(item.dateFrom) : null
  const to = item.dateTo ? new Date(item.dateTo) : null
  if (!from && !to) return 'draft'
  if (from && from > now) return 'scheduled'
  if (to && to < now) return 'expired'
  return 'active'
}

export const STATE_META: Record<PublishState, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Publikováno', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  scheduled: { label: 'Naplánováno', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  expired: { label: 'Ukončeno', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
  draft: { label: 'Koncept', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}
