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
| `src/style.css` | Design tokeny (`@theme`) — jediný zdroj barev a fontů |

## Stav prací
- ✅ **Aktuality** — kompletní (seznam + editace, jazykové mutace, galerie, SEO)
- ⬜ Další moduly — postupovat dle `docs/STANDARDY-MODULU.md` (recept + checklist)

## Nasazení
GitHub (zdroj pravdy) → Vercel (auto-deploy z větve `main`).
