# Modul: Aktuality

> Zdroj: `/admin/news/list/` (interní entita `news`). Součást sekce **Obsah**.

## 1. Účel a role
- Správa aktualit / novinek zobrazovaných na webu (časově omezené příspěvky s galerií obrázků, textem, videem a přílohami).
- Používá administrátor / editor obsahu.
- Podpora více jazykových mutací (možnost zadávat obsah v češtině, angličtině a dalších jazycích).
- Snadné a uživatelsky přívětivé rozhraní pro CRUD akce (vytvořit, editovat, mazat).

## 2. Datový model a pole
Entita `news`. Formulář je vícejazyčný — pole označená **ML** existují v samostatných jazykových mutacích.

### Základní informace
| Pole | Název (name) | Typ | Povinné | ML | Poznámka |
|------|--------------|-----|---------|----|----------|
| Nadpis | `news-title` | text | **ano** | **ano** | Hlavní nadpis aktuality |
| Shrnutí / PEREX | `news-summary` | textarea | ne | **ano** | Úvodní text / krátký výtah |
| Text | `news-text` | richtext (CKEditor) | ne | **ano** | Hlavní obsah (WYSIWYG editor) |
| Odkaz na video | `news-videoLink` | text (URL) | ne | ne | Možnost vložit odkaz na video |
| Datum publikace OD | `news-dateFrom` | datum + čas | ne | ne | Od kdy se aktualita zobrazuje na webu |
| Datum publikace DO | `news-dateTo` | datum + čas | ne | ne | Do kdy se aktualita zobrazuje na webu |

### Marketing (SEO)
| Pole | Název | Typ | ML | Poznámka |
|------|-------|-----|----|----------|
| Titulek stránky | `news-meta_title` | text | **ano** | Meta title (ideálně s možností automatického vygenerování po zadání nadpisu a textu) |
| Meta description | `news-meta_description` | textarea | **ano** | Meta popis (ideálně s možností automatického vygenerování po zadání nadpisu a textu) |
| Meta keywords | `news-meta_keywords` | text | **ano** | Meta klíčová slova |
| Obrázek pro sociální sítě | `news-og_image` | upload | ne | Náhledový obrázek pro sdílení na sociálních sítích |

### Fotogalerie a Hlavní obrázek
| Pole | Název | Typ | Poznámka |
|------|-------|-----|----------|
| Fotogalerie | `news-gallery` | upload (více souborů) + editor | Jednotná galerie pro všechny obrázky aktuality. Tlačítko „Nahrát obrázky". Možnost úpravy obrázku v editoru a vymazání. |

**Logika hlavního obrázku:**
- Obrázek na **1. pozici** v galerii je automaticky považován za **hlavní obrázek** aktuality.
- U obrázku na 1. pozici (nebo při kliknutí na ikonu hvězdičky `★` u jakékoliv fotky) se aktivuje příznák „Hlavní obrázek“.
- Nastavení hlavního obrázku lze provést buď přetažením na 1. místo (Drag & Drop), nebo kliknutím na hvězdičku `★`, která fotku automaticky přesune na první pozici.

### Přílohy
| Pole | Název | Typ | ML | Poznámka |
|------|-------|-----|----|----------|
| Přílohy | `news-attachments` | upload | **ano** | Možnost nahrát přílohu / soubor (přílohy mohou být specifické pro daný jazyk) |

## 3. Stavy a životní cyklus
- Viditelnost aktuality na webu je plně řízena časovým rozsahem **Publikace OD – DO**.
  - Pokud je aktuální datum v rozmezí OD–DO (nebo je OD v minulosti a DO prázdné), aktualita se na webu zobrazuje.

## 4. Obrazovky a UI

### Seznam (`/admin/news/list/`)
- **Horní filtr:**
  - Název aktuality (textové vyhledávání)
  - Publikace OD – DO (výběr data)
- **Tabulka aktualit (sloupce):**
  - Checkbox (pro hromadné akce)
  - Název Aktuality
  - Datum publikace OD – DO
  - Akce (ikony):
    - **Náhled:** ikona s proklikem na detail aktuality na webu (URL)
    - **Editace:** přechod do formuláře úprav
    - **Smazat:** odstranění aktuality
- **Hromadné akce (přes checkboxes):**
  - Smazat
- **Stránkování:** Stránkování ve spodní části pro případ velkého množství aktualit.

### Editace / Detail aktuality (`/admin/news/new/`, editace obdobně)
- **Přepínač jazykových mutací:** Přepínací záložky nebo tlačítka pro volbu jazyka (např. CZ / EN / DE) v horní části formuláře.
- **Základní formulář:** Nadpis (ML), Shrnutí/PEREX (ML), Text (CKEditor, ML), Odkaz na video, Publikace OD–DO.
- **Sekce Fotogalerie:**
  - Tlačítko „Nahrát obrázky".
  - Mřížka nahraných fotek s možností Drag & Drop řazení.
  - Vizuální označení hvězdičkou `★` u fotky na 1. pozici (= hlavní obrázek).
  - Tlačítka u jednotlivých fotek: Úprava v editoru obrázků, Smazat, Nastavit jako hlavní (`★`).
- **Sekce Přílohy:** Tlačítko pro nahrání přílohy (ML).
- **Sekce Marketing:** Titulek stránky (ML), Meta description (ML), Meta keywords (ML), Obrázek pro sociální sítě + automatické vygenerování titulku a meta popisu z nadpisu a textu pro zvolený jazyk.

## 5. Akce a workflow
- Vytvoření, editace a mazání aktualit ve více jazykových mutacích.
- Přepínání mezi jazykovými verzemi v detailu aktuality.
- Hromadné mazání položek v seznamu.
- Správa fotogalerie: nahrávání fotek, určování hlavního obrázku posunem na 1. pozici / hvězdičkou a Drag & Drop řazení.
- Proklik na veřejný web přes ikonu náhledu.

## 6. Vazby na jiné moduly
- **Obsah** — Aktuality jsou jedním z obsahových modulů (vedle Blog, Stránky, FAQ, Galerie, Reference…).
- **Navigace / Slider** — na aktuality může odkazovat navigace nebo slider (křížově, není povinné).
- Sdílí obecné chování obsahových entit (SEO tab, obrázky, přílohy, jazykové mutace, časové okno zobrazení) — stejná osnova jako u Blog/Stránky.