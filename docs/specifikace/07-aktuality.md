# Modul: Aktuality

> Entita `news`. Cesta `/admin/news`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize (ta pokrývala sekce 01–06). Zadání vychází
> z prototypu a z průřezových rozhodnutí.

## 1. Účel a role

- Novinky, tiskové zprávy a oznámení. Zobrazují se ve výpisu aktualit, na úvodní stránce
  a u objektu, kterého se týkají.
- Používá redaktor s oprávněním `news`.
- Aktualita je **referenční modul prototypu** — ostatní obsahové moduly kopírují její
  strukturu (jazykové mutace, publikační okno, galerie, přílohy, štítky).

## 2. Datový model a pole

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Nadpis | `news-title` | text | **ano** | ano | — | |
| URL adresa | `news-url` | slug | **ano** | ano | z nadpisu | Unikátní v rámci jazyka |
| Shrnutí / perex | `news-summary` | textarea | ano, když zveřejněno | ano | — | Do výpisu a na kartu |
| Odkaz na video | `news-videoLink` | url | ne | ne | — | YouTube nebo Vimeo |
| Autor | `news-author` | ref → `user` | **ano** | ne | přihlášený uživatel | Podepisuje aktualitu |

### Tab „Obsah"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Obsah aktuality | `news-content` | blocks | ne | ano | prázdný | Content builder |

### Tab „Zařazení a vazby"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Objekt v areálu | `news-area_id` | ref → `venue` | ne | ne | — | Aktualita se zobrazí u objektu |
| Související prohlídky | `news-tour_ids` | refList → `tour` | ne | ne | prázdné | |
| Připojené galerie | `news-gallery_ids` | refList → `gallery` | ne | ne | prázdné | |

### Tab „Galerie" a „Přílohy"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Vlastní fotografie | `news-gallery` | gallery | ne | ne | prázdná | První (★) je náhledovka |
| Přílohy | `news-attachments` | file[] | ne | ne (per jazyk) | prázdné | Tisková zpráva, ceník |

### Tab „Propagace"

Interní nástroj — připraví koncept příspěvku na sociální sítě z údajů aktuality.
Na web nejde nic; příspěvek se nikam nepublikuje, jen se zobrazí k okopírování.

### Publikační okno a pravý panel

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Publikace OD | `news-date_from` | datetime | ne | ne | — | Naplánované zveřejnění |
| Publikace DO | `news-date_to` | datetime | ne | ne | — | Po termínu z webu mizí |
| Štítky | `news-tags` | tags | ne | ne | prázdné | Sada 7.1 |
| Kategorie | `news-categories` | tags | ne | ne | prázdné | Sada 7.2 |

**Štítek vs. kategorie** — dvě různé věci, neslévat: štítek je téma napříč obsahem
(Festival, Pro rodiny), kategorie je zařazení k objektu nebo provozovně (Bolt Café,
Cineport). Obojí drží centrální správa v modulu 18.

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování), včetně časového okna
`Publikace OD` – `Publikace DO`.

## 4. Obrazovky a UI

### Seznam (`/admin/news/list`)

- **Sloupce:** Náhled a nadpis se štítky · Autor · Kategorie · Publikace OD–DO ·
  Jazykové mutace · Akce.
- **Filtr:** stav publikace · jazyková mutace · publikace OD · publikace DO · řazení.
  Bez fulltextu.
- **Hromadné akce:** Smazat.
- **Stránkování:** 24 záznamů na stránku.

### Detail (`/admin/news/:id/edit`)

Záložky: Základní informace · Obsah · Zařazení a vazby · Galerie · Přílohy · Propagace.
Pravý panel: publikace (stav, okno, jazykové mutace), štítky, kategorie.

## 5. Akce a workflow

- CRUD aktualit, duplikace, zveřejnění a stažení z webu, hromadné mazání.
- **Překlad mutací přes AI**: z české verze doplní cizí mutace všech vícejazyčných polí.
  Výsledek je návrh, redakce ho před zveřejněním zkontroluje.
- **Příprava příspěvku na sociální sítě** — viz tab Propagace.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Publikace DO ≥ Publikace OD | Tvrdá, nelze uložit |
| Aktualita bez shrnutí | Nejde zveřejnit |
| Náhledovka | Odvozená z hlavní fotky galerie, nenahrává se zvlášť |
| Smazání aktuality | Nemaže připojené galerie ani prohlídky, jen vazby |

## 7. Číselníky, notifikace, integrace

### 7.1 Štítky
`Akce` · `Prohlídky` · `Festival` · `Výstava` · `Pro rodiny` · `Sezónní` ·
`Tisková zpráva`. Vlastní štítek smí redakce vytvořit.

### 7.2 Kategorie
`DOV` · `Ateliéry Hlubina` · `Bolt Café` · `Brickhouse` · `Bufet U Karla` · `Cineport`.
Vlastní kategorii smí redakce vytvořit.

### 7.3 Notifikace
Modul neposílá žádné.

### 7.4 Integrace
Žádná. Příprava příspěvku na sociální sítě nikam neodesílá — je to koncept k okopírování.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se aktualita smaže |
|---|---|---|---|
| Novinka → objekt | **tento modul** | `news-area_id` | Vazba zaniká |
| Novinka → prohlídky | **tento modul** | `news-tour_ids` | Vazba zaniká |
| Novinka → galerie | **tento modul** | `news-gallery_ids` | Vazba zaniká |
| Novinka → autor | **tento modul** | `news-author` | — |

Smazání uživatele, který je autorem aktualit, nesmaže aktuality — u záznamu zůstane
jméno autora (modul 17).

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 07-1 | Aktualita bez shrnutí nejde zveřejnit. |
| 07-2 | Aktualita s publikací OD v budoucnosti se zveřejní sama do 5 minut po tom termínu. |
| 07-3 | Aktualita po termínu Publikace DO zmizí z webu a zůstane v administraci. |
| 07-4 | Překlad mutací přes AI doplní cizí mutace a nepřepíše českou verzi. |
| 07-5 | Aktualita s vazbou na objekt se zobrazí v detailu toho objektu, aniž by se v Areálu cokoli nastavovalo. |
| 07-6 | Náhledovka aktuality odpovídá hlavní fotce její galerie. |
| 07-7 | Smazání autora nesmaže jeho aktuality; u záznamu zůstane jméno. |

## Otevřené otázky

Modul nemá vlastní otevřené otázky. Průřezové jsou v [README](README.md#otevřené-otázky) —
z nich se modulu týká **O1** (katalog bloků obsahu).
