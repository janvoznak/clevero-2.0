# Clevero 2.0 — Administrace (UI prototyp)

Vizuální **UI prototyp** administrace CMS Clevero 2.0. Klient: **Dolní Vítkovice** (obsah je zástupný — administrace je produkt pro více klientů).

> ⚠️ **Toto je vizuální prototyp, ne funkční CMS.** Data jsou mock, akce jsou předstírané, 3rd-party nástroje se vkládají jako nefunkční vizuální zástupky. Neprogramují se funkce ani integrace. Podrobně viz **[`docs/STANDARDY-MODULU.md`](docs/STANDARDY-MODULU.md)** → sekce 0 (řídící princip).

## Tech stack
Vue 3 + TypeScript · Vite 6 · Tailwind CSS v4 · [Reka UI](https://reka-ui.com) · vue-router

## Spuštění (lokálně)
```bash
npm install
npm run dev          # http://localhost:5180
npm run build        # produkční build (spustí i typovou kontrolu)
npx vue-tsc -b       # jen typová kontrola
```

## Kde co je
| Cesta | Obsah |
|---|---|
| `docs/STANDARDY-MODULU.md` | **Závazné standardy a postupy** — čti jako první |
| `aktuality-nove (1).md` | Specifikace modulu Aktuality (referenční modul) |
| `src/views/news/` | Referenční implementace: seznam + editace Aktualit |
| `src/components/ui/` | Univerzální prvky (`AppButton`, `AppSelect`, `Icon`) |
| `src/components/admin/` | Bloky administrace (sidebar, topbar, galerie, přílohy…) |
| `src/style.css` | Design tokeny (`@theme`) — jediný zdroj barev a fontů (admin + veřejný web) |
| `src/views/public/`, `src/components/public/` | **Veřejný web** — prototyp nákupu vstupenek (`/vstupenky/:id`, `/kosik`) |
| `src/data/mockTicketing.ts` | Mock skladba vstupenek (v ostrém provozu z Colossea přes API) |
| `src/data/mockCart.ts` | Sdílený stav košíku mezi výběrem a stránkou košíku |

## Veřejný prototyp: nákup vstupenek
Náhrada nákupního procesu Colossea (výběr vstupenek → košík). Běží mimo `AdminLayout`,
v grafice nového webu dolnivitkovice.cz (tokeny `--color-dov-*`, Saira Condensed + Inter).

| URL | Ukázka |
|---|---|
| `/vstupenky/svet-techniky-a-maly-svet-u6` | kombinovaná vstupenka, volitelné datum návštěvy |
| `/vstupenky/maly-svet-techniky-u6` | dvě rodinná vstupná, vstupenka zdarma |
| `/vstupenky/svet-techniky` | rodinné 2+2/3 a 1+2/3 |
| `/vstupenky/farani-do-dolu` | pevný termín prohlídky + jazyk výkladu |
| `/kosik` | krok 2 — košík, doručení, platba, údaje (předvyplněný ukázkovým obsahem) |

## Stav prací
- ✅ **Aktuality** — kompletní (seznam + editace, jazykové mutace, galerie, SEO)
- ⬜ Další moduly — postupovat dle `docs/STANDARDY-MODULU.md` (recept + checklist)

## Nasazení
GitHub (zdroj pravdy) → Vercel (auto-deploy z větve `main`).
