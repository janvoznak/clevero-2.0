# Modul: Galerie

> Entity `gallerySection`, `gallery`. Cesta `/admin/galleries`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** nálezy `03/01`–`03/13`, rozhodnutí `00/04`, `00/38`–`00/45`.

## 1. Účel a role

- Fotografie areálu členěné do sekcí a alb. Album je zároveň zdrojem fotek pro objekty
  v Areálu a pro alba z proběhlých akcí.
- Používá redaktor s oprávněním `galleries`.
- Dvě úrovně: **sekce** (filtrovací záložka nad výpisem) → **album** (sada fotek).

## 2. Datový model a pole

### 2.1 Entita `gallerySection` (sekce)

Sekce je na webu **jen filtrovací záložka s počtem alb** — vlastní stránku nemá
*(rozhodnutí 00/41, nálezy 03/05, 03/12)*.

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název sekce | `section-name` | text | **ano** | ano | — | |
| Pořadí | `section-order` | int | **ano** | ne | poslední | Mění se přetažením |

Publikace po jazycích u sekce **zůstává** *(rozhodnutí 00/41)*. Popis ani náhledový
obrázek sekce nemá — web je nezobrazuje.

### 2.2 Entita `gallery` (album)

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

#### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název galerie | `gallery-name` | text | **ano** | ano | — | |
| URL adresa | `gallery-url` | slug | **ano** | ano | z názvu | Unikátní v rámci jazyka |
| Perex | `gallery-perex` | textarea | ano, když zveřejněno | ano | — | Věta pod názvem; z ní se odvozuje popisek pro vyhledávače |

#### Tab „Zařazení a vazby"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Zařazení do sekce | `gallery-section_id` | ref → `gallerySection` | **ano** | ne | první sekce | |
| Objekt v areálu | `gallery-area_id` | ref → `venue` | ne | ne | — | Album se zobrazí u objektu |
| Album z akce | `gallery-event_id` | ref → `event` | ne | ne | — | Album z proběhlé akce |

#### Tab „Fotografie"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Fotografie | `gallery-photos` | gallery | ano, když zveřejněno | ne | prázdná | První (★) je náhledovka |

#### Pravý panel

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Štítky | `gallery-tags` | tags | ne | ne | prázdné | Sada 7.1; na webu se vykreslí jako odznak na kartě |

#### Odvozená pole

| Pole | Výpočet |
|---|---|
| Počet fotek | Délka pole fotografií — nezadává se *(rozhodnutí 00/45)* |
| Náhledovka | Fotka označená ★, jinak první v pořadí |
| Pořadí alba | `order` v rámci sekce, mění se přetažením |

### 2.3 Pole, která modul vědomě nemá

| Co | Proč |
|---|---|
| Záložka „Obsah" s bloky | Zrušena, nahradil ji perex *(rozhodnutí 00/04, nález 03/11)* |
| Datum pořízení / konání | Web ho nezobrazuje ani podle něj neřadí *(rozhodnutí 00/45, nález 03/09)* |
| Popis a náhledový obrázek sekce | Sekce je jen filtr *(rozhodnutí 00/41)* |
| Nadpisy a texty kolem výpisu | Natvrdo ve frontendu *(rozhodnutí 00/39, nálezy 03/02, 03/04)* |

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování) — u sekce i u alba. Skrytá sekce
schová i alba v ní: viditelnost se dědí.

## 4. Obrazovky a UI

### Seznam (`/admin/galleries`)

Stromový výpis: sekce a pod nimi alba.

- **Sloupce:** Sekce / galerie · Počet alb v sekci · Počet fotek · Jazykové mutace · Akce.
- **Řádkové akce:** Otevřít · Smazat.
- **Přidání:** „Nová sekce"; album se zakládá z detailu sekce nebo tlačítkem.
- **Pořadí:** sekce mezi sebou a alba v rámci sekce se řadí **přetažením řádku**
  *(rozhodnutí 00/40, nález 03/03)*. Nad tabulkou je věta, která to říká.

### Detail sekce (`/admin/galleries/section/:id`)

Název, publikace po jazycích, výpis alb v sekci. Věta vysvětlující, že sekce je jen
filtrovací záložka.

### Detail alba (`/admin/galleries/:id/edit`)

Záložky: Základní informace · Zařazení a vazby · Fotografie (s počtem v záložce).
Pravý panel: publikace, zpětné vazby, štítky.

## 5. Akce a workflow

- CRUD sekcí a alb, přetahování pořadí, zveřejnění a stažení z webu.
- Nahrávání fotek, řazení přetažením, označení hlavní fotky.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Album bez fotek | Nejde zveřejnit |
| Právě jedna hlavní fotka | Označením jiné se předchozí odznačí |
| Smazání sekce s alby | Nelze; alba se nejdřív přeřadí |
| Smazání alba, které je připojené u objektu nebo u produktu | Album zmizí ze zrcadlení; cílový záznam zůstane |
| Počet fotek | Nikdy se nezadává ručně |

## 7. Číselníky, notifikace, integrace

### 7.1 Štítky
Sdílené s Aktualitami: `Akce` · `Prohlídky` · `Festival` · `Výstava` · `Pro rodiny` ·
`Sezónní` · `Tisková zpráva`. Vlastní štítek smí redakce vytvořit.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná. Fotky se nahrávají ručně.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se album smaže |
|---|---|---|---|
| Album → sekce | **tento modul** | `gallery-section_id` | — |
| Album → objekt | **tento modul** | `gallery-area_id` | Objekt ztrácí zrcadlené album |
| Album → akce | **tento modul** | `gallery-event_id` | Akce ztrácí zrcadlené album |
| Novinka → galerie | 07 Aktuality | `news-gallery_ids` | Vazba zaniká |
| Stránka → galerie | 04 Stránky | `page-gallery_ids` | Vazba zaniká |

**Vazbu album ↔ akce vlastní album** *(rozhodnutí 00/44, nález 03/08)*. Dřív ji držela
akce; směr se sjednotil, protože u objektů ho vlastnilo album a u akcí naopak akce.
V detailu akce se alba jen zrcadlí read-only.

Produkty na galerie **neodkazují** — připojené galerie u produktu byly zrušeny
*(rozhodnutí 00/38, nález 05/11)*.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 03-1 | Album bez vyplněného perexu nejde zveřejnit. |
| 03-2 | Počet fotek v albu odpovídá skutečnosti a nikde se nezadává ručně. |
| 03-3 | Přetažením se změní pořadí sekcí i alb a nové pořadí se projeví na webu. |
| 03-4 | Album z akce se v detailu té akce zobrazí jako read-only; v Kalendáři akcí se vazba nedá změnit. |
| 03-5 | Skrytá sekce schová na webu i alba, která do ní patří. |
| 03-6 | Sekci s alby nejde smazat; hláška uvede, kolik alb v ní je. |
| 03-7 | Popisek albumu pro vyhledávače odpovídá perexu, aniž by ho někdo zadával zvlášť. |

## Otevřené otázky

Modul nemá otevřené otázky. Průřezové jsou v [README](README.md#otevřené-otázky).
