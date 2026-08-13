/**
 * Rychlé vytvoření obsahu — JEDINÝ zdroj pravdy pro „rychlé akce".
 * Používá je dashboard (hero „Rychlé akce") i tlačítko „Nový záznam" v sidebaru,
 * aby nabízely stejnou sadu ve stejném pořadí (princip „jeden prvek = jeden zdroj").
 */
export interface QuickCreateAction {
  label: string
  /** Ikona z Icon.vue. */
  icon: string
  /** Cílová route (vue-router name) — editor/průvodce daného modulu. */
  route: string
}

export const QUICK_CREATE: QuickCreateAction[] = [
  { label: 'Nová aktualita', icon: 'news', route: 'news-new' },
  { label: 'Nové pop-up', icon: 'popup', route: 'popup-new' },
  { label: 'Nová stránka', icon: 'page', route: 'page-new' },
  { label: 'Nová akce', icon: 'calendar', route: 'event-new' },
  { label: 'Nová prohlídka', icon: 'ticket', route: 'tour-new' },
  { label: 'Nová galerie', icon: 'gallery', route: 'gallery-new' },
]
