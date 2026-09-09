# Modul: Stránky

> Entita `page`. Cesta `/admin/pages`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** nálezy `04/01`–`04/14`, rozhodnutí `00/46`–`00/50`, `00/48`.

## 1. Účel a role

- Statické stránky webu — O nás, Historie areálu, Kontakty, Pro školy, Návštěvní řád,
  Zásady cookies, Pronájem prostor, Dotační projekty.
- Používá redaktor s oprávněním `pages`.
- Stránka je **stavebnice z bloků**, ne formulář s pevnými poli. Členitou stránku
  (Pronájem prostor) redakce poskládá stejnou cestou jako jednoduchou.

Stránky tvoří **strom**: stránka může mít podstránky. Strom slouží k uspořádání
v administraci a k odvození přidružených záložek, ne k adresám — ty určuje slug.

## 2. Datový model a pole

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Menší nadpis | `page-eyebrow` | text | ne | ano | — | Text nad hlavním nadpisem *(rozhodnutí 00/48, nález 04/06)* |
| Nadpis | `page-title` | text | **ano** | ano | — | H1 stránky |
| URL adresa | `page-url` | slug | **ano** | ano | z nadpisu | Unikátní v rámci jazyka |
| Perex | `page-perex` | textarea | ne | ano | — | Krátký úvodní text |
| Sekce v administraci | `page-section` | enum | **ano** | ne | Menu | Číselník 7.1 — jen třídění v adminu |
| Nadřazená stránka | `page-parent_id` | ref → `page` | ne | ne | — | Určuje místo ve stromu |
| Pořadí | `page-priority` | int | **ano** | ne | poslední | Mezi sourozenci, mění se přetažením |

### Tab „Obsah"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Obsah stránky | `page-content` | blocks | ne | ano | prázdný | Content builder |

Blok s nadpisem má vlastní pole **Menší nadpis** (`block-eyebrow`) — stejný prvek jako
u stránky, jen na úrovni bloku *(rozhodnutí 00/48)*.

### Tab „Formuláře"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Šablona formuláře | `page-form_template` | ref | ne | ne | — | Předpřipravená sada polí |
| Text u formuláře | `page-contact_form_text` | textarea | ne | ano | — | |

Formuláře se **v této dodávce nepředělávají** *(rozhodnutí 00/47, nálezy 04/05, 04/10,
04/11)*. Model dnes nese čtyři paralelní nastavení formuláře (šablona, dynamický
formulář, typ poptávkového formuláře, typ kontaktního formuláře); tři z nich jsou
přebytek, který se odstraní při výrobě administrace. Do té doby zůstávají.

### Tab „Galerie" a „Přílohy"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Připojené galerie | `page-gallery_ids` | refList → `gallery` | ne | ne | prázdné | |
| Vlastní fotografie | `page-gallery` | gallery | ne | ne | prázdná | |
| Přílohy | `page-attachments` | file[] | ne | ne (per jazyk) | prázdné | Soubory ke stažení |

### Přidružené odkazy

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Popisek | `page-link_label` | text | **ano** | ano | — | |
| Adresa | `page-link_url` | url | **ano** | ne | — | Otevře se v novém okně |

### Pole, která modul vědomě nemá

| Co | Proč |
|---|---|
| Umístění v menu, ve sloupci patičky, na homepage | Vlastníkem jsou moduly 11 Navigace a 12 Patička *(rozhodnutí 00/49, nález 04/08)* |
| Otevírací doba stránky | Patří ke kontaktní kartě v obsahu; bloky budou v content builderu *(rozhodnutí 00/50, nález 04/13)* |
| Měřicí kódy a cookies per stránka | Globální nastavení webu, ne pole stránky *(rozhodnutí 00/50, nález 04/14)* |
| SEO pole | Odvozují se *(rozhodnutí 00/24, nález 04/07)* |

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování).

Nadřazená stránka, která není zveřejněná, schová i podstránky — viditelnost se dědí.
Smazání stránky s podstránkami nabízí dvě cesty: **přesunout podstránky o úroveň výš**,
nebo **smazat kaskádově**. Volba je vždy explicitní, nikdy se neděje mlčky.

## 4. Obrazovky a UI

### Seznam (`/admin/pages/list`)

Stromový výpis se třemi sekcemi (Menu / Ostatní / Klientská zóna).

- **Sloupce:** Stránka (nadpis, adresa) · Podstránky · Jazykové mutace · Akce.
- **Řádkové akce:** Otevřít · Přidat podstránku · Duplikovat · Smazat.
- **Pořadí a zanoření:** přetažením řádku — nad řádek se zařadí před/za, doprostřed
  se zanoří.
- **Přidání:** „Nová stránka", nebo „Přidat podstránku" u konkrétní stránky.

### Detail (`/admin/pages/:id/edit`)

Záložky: Základní informace · Obsah · Formuláře · Galerie · Přílohy.
Pravý panel: publikace, jazykové mutace.

## 5. Akce a workflow

- CRUD stránek, zanoření a řazení přetažením, duplikace.
- Přidání podstránky přímo z řádku nadřazené stránky.
- Smazání s volbou, co s podstránkami.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Adresa (slug) unikátní v rámci jazyka | Tvrdá; při kolizi hláška navrhne jinou |
| Stránka nemůže být vlastním rodičem ani potomkem | Vynucuje přetahování i API |
| Smazání stránky s podstránkami | Vyžádá volbu: přesunout výš, nebo smazat kaskádově |
| Smazání stránky, na kterou míří odkaz v menu nebo v patičce | Odkaz zůstane bez cíle a hlásí se jako neúplný *(modul 11, 12)* |
| Změna adresy | Odkazy v menu a patičce se nerozbijí — drží ID stránky, ne URL |

## 7. Číselníky, notifikace, integrace

### 7.1 Sekce v administraci

| Kód | Popisek |
|---|---|
| `menu` | Menu |
| `other` | Ostatní |
| `client` | Klientská zóna |

Jen třídění v administraci. **Neurčuje**, jestli je stránka v menu — to řídí modul 11.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se stránka smaže |
|---|---|---|---|
| Stránka → podstránka | **tento modul** | `page-parent_id` | Podle volby: přesun výš, nebo kaskáda |
| Stránka → galerie | **tento modul** | `page-gallery_ids` | Vazba zaniká |
| Odkaz v menu → stránka | 11 Navigace | `navItem.target` | Odkaz zůstane bez cíle |
| Odkaz v patičce → stránka | 12 Patička | `navItem.target` | Odkaz zůstane bez cíle |

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 04-1 | Redakce poskládá členitou stránku (Pronájem prostor) z bloků, aniž by zasahoval vývojář. |
| 04-2 | Pole „Menší nadpis" je u stránky i u bloku s nadpisem a na webu se vykreslí nad hlavním nadpisem. |
| 04-3 | Změna adresy stránky nerozbije odkaz na ni v menu ani v patičce. |
| 04-4 | Smazání stránky s podstránkami vyžádá volbu, co s nimi; bez volby se nic nesmaže. |
| 04-5 | Nezveřejněná nadřazená stránka schová na webu i své podstránky. |
| 04-6 | Přetažením se změní pořadí i zanoření a nové uspořádání se projeví ve stromu. |
| 04-7 | Dvě stránky nemají v témže jazyce stejnou adresu; při kolizi hláška navrhne jinou. |

## Otevřené otázky

| # | Otázka | Dopad |
|---|---|---|
| **O1** | Katalog bloků obsahu — co která šablona umí? | Bez seznamu redakce neví, co si může poskládat, a nejde odhadnout práci na editoru ani na frontendu. Týká se celého modulu |

Stránka **Pronájem prostor** v prototypu chybí *(nález 04/01)*. Není to otevřená
otázka — rozhodnutí 00/46 říká, že se v prototypu nezakládá, protože admin nemá ostrá
data. Při vývoji vznikne jako běžná stránka z bloků.
