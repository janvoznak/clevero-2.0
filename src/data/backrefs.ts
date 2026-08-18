import { MOCK_NEWS } from './mockNews'
import { MOCK_EVENTS } from './mockEvents'
import { MOCK_TOURS } from './mockTours'
import { MOCK_GALLERIES } from './mockGalleries'
import { MOCK_VENUES } from './mockVenues'
import { MOCK_PAGES } from './mockPages'
import { MOCK_PRODUCTS } from './mockProducts'

/* ============================================================
   Zpětné vazby (kdo na tento záznam odkazuje) — sjednotné napříč moduly.

   Vazby se v modelu ukládají JEDNOSMĚRNĚ na straně odkazujícího
   (news.tourIds, event.areaId, gallery.areaId, …). Zpětné vazby se proto
   nikde neukládají — dopočítávají se READ-ONLY z existujících dat. Zdroj
   pravdy zůstává v odkazujícím záznamu; tady se jen zrcadlí + proklikne.
   ============================================================ */

export interface BackRefItem {
  id: string
  title: string
  /** Named route cílového detailu (proklik). */
  routeName: string
}
export interface BackRefGroup {
  key: string
  /** Popisek modulu. */
  label: string
  icon: string
  items: BackRefItem[]
}

const T = (ml: { cs: string }) => ml.cs || 'Bez názvu'

function group(key: string, label: string, icon: string, items: BackRefItem[]): BackRefGroup[] {
  return items.length ? [{ key, label, icon, items }] : []
}

/* ---------- Prohlídka ← aktuality, události ---------- */
export function backRefsForTour(id: string): BackRefGroup[] {
  return [
    ...group('news', 'Aktuality', 'news',
      MOCK_NEWS.filter((n) => (n.tourIds ?? []).includes(id)).map((n) => ({ id: n.id, title: T(n.title), routeName: 'news-edit' }))),
    ...group('events', 'Události', 'calendar',
      MOCK_EVENTS.filter((e) => (e.tourIds ?? []).includes(id)).map((e) => ({ id: e.id, title: T(e.title), routeName: 'event-detail' }))),
  ]
}

/* ---------- Objekt v Areálu ← aktuality, události, prohlídky, galerie ---------- */
export function backRefsForArea(id: string): BackRefGroup[] {
  return [
    ...group('news', 'Aktuality', 'news',
      MOCK_NEWS.filter((n) => n.areaId === id).map((n) => ({ id: n.id, title: T(n.title), routeName: 'news-edit' }))),
    ...group('events', 'Události', 'calendar',
      MOCK_EVENTS.filter((e) => e.areaIds.includes(id)).map((e) => ({ id: e.id, title: T(e.title), routeName: 'event-detail' }))),
    ...group('tours', 'Prohlídky', 'ticket',
      MOCK_TOURS.filter((t) => t.areaIds.includes(id)).map((t) => ({ id: t.id, title: T(t.title), routeName: 'tour-edit' }))),
    ...group('galleries', 'Galerie', 'gallery',
      MOCK_GALLERIES.filter((g) => g.areaId === id).map((g) => ({ id: g.id, title: T(g.name), routeName: 'gallery-edit' }))),
  ]
}

/* ---------- Galerie ← aktuality, události, stránky, produkty, areál ---------- */
export function backRefsForGallery(id: string): BackRefGroup[] {
  return [
    ...group('news', 'Aktuality', 'news',
      MOCK_NEWS.filter((n) => (n.galleryIds ?? []).includes(id)).map((n) => ({ id: n.id, title: T(n.title), routeName: 'news-edit' }))),
    ...group('events', 'Události', 'calendar',
      MOCK_EVENTS.filter((e) => (e.galleryIds ?? []).includes(id)).map((e) => ({ id: e.id, title: T(e.title), routeName: 'event-detail' }))),
    ...group('pages', 'Stránky', 'page',
      MOCK_PAGES.filter((p) => (p.galleryIds ?? []).includes(id)).map((p) => ({ id: p.id, title: T(p.title), routeName: 'page-edit' }))),
    ...group('products', 'Produkty', 'box',
      MOCK_PRODUCTS.filter((p) => (p.galleryIds ?? []).includes(id)).map((p) => ({ id: p.id, title: p.nameOverride.cs || p.name, routeName: 'product-edit' }))),
    ...group('area', 'Areál', 'map',
      MOCK_VENUES.filter((v) => (v.galleryIds ?? []).includes(id)).map((v) => ({ id: v.id, title: T(v.title), routeName: 'area-edit' }))),
  ]
}
