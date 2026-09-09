# Modul: Vzdělávací programy

> Entita `program`. Cesta `/admin/education`. Sekce **Vzdělávací programy**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize.

## 1. Účel a role

- Programy pro školy — dílny, exkurze a projektové dny ve Světě techniky a v areálu.
  Školy si je objednávají v externím systému **Francesca**; administrace popisuje
  nabídku a odkazuje ven.
- Používá redaktor s oprávněním `education`.
- Program má **tři nezávislé taxonomie**, podle kterých učitel filtruje: stupeň školy,
  ročník a zaměření. Nejsou to štítky — jsou to tři různé otázky („pro koho",
  „pro jakou třídu", „k jakému předmětu").

## 2. Datový model a pole

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název programu | `program-title` | text | **ano** | ano | — | |
| URL adresa | `program-url` | slug | **ano** | ano | z názvu | Unikátní v rámci jazyka |
| Perex | `program-perex` | textarea | ano, když zveřejněno | ano | — | Do výpisu a na kartu |
| Popis | `program-description` | richtext | ne | ano | — | Náplň programu |
| Datum | `program-date` | date | ne | ne | — | U jednorázových programů |
| Autor | `program-author` | ref → `user` | **ano** | ne | přihlášený uživatel | Kdo program spravuje |

### Tab „Obsah"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Obsah programu | `program-content` | blocks | ne | ano | prázdný | Content builder |

### Tab „Zařazení"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Stupeň školy | `program-categories` | tags | ano, když zveřejněno | ne | prázdné | Číselník 7.1 |
| Ročníky | `program-grades` | tags | ne | ne | prázdné | Číselník 7.2 |
| Zaměření | `program-focus` | tags | ne | ne | prázdné | Číselník 7.3 |

### Tab „Parametry"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název parametru | `program-param_name` | text | **ano** | ne | — | Např. Délka, Kapacita, Cena |
| Hodnota | `program-param_value` | text | **ano** | ne | — | Např. „90 minut", „25 dětí" |

Parametry jsou **opakovatelné dvojice**, ne pevná pole. Nabídka programů se v čase mění
a pevná sada by zastarala: jeden program má kapacitu a délku, druhý navíc nutné vybavení.

### Tab „Objednávka"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Odkaz do objednávkového systému | `program-reservation_url` | url | ne | ne | — | Prostý odkaz do Francescy |
| Popisek tlačítka | `program-reservation_label` | text | ne | ne | Rezervace | |

Odkaz **vyplňuje redakce ručně** u každého programu. Negeneruje ho žádný systém,
nekontroluje se proti Francesce a prázdný odkaz je legitimní stav — program bez
objednávkového tlačítka.

### Galerie a pravý panel

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Náhledový obrázek | `program-image` | image | ano, když zveřejněno | ne | — | Na kartu |
| Štítky | `program-tags` | tags | ne | ne | prázdné | Číselník 7.4 |

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování). Modul nemá vlastní stavový model.

Program s vyplněným datem se po jeho uplynutí **nezneviditelní sám** — datum je
informace pro učitele, ne publikační okno. Stažení z webu je vždy vědomé rozhodnutí
redakce.

## 4. Obrazovky a UI

### Seznam (`/admin/education`)

- **Sloupce:** Náhled a název · Stupeň školy · Zaměření · Objednávka (má / chybí odkaz)
  · Jazykové mutace · Akce.
- **Filtr:** stupeň školy · zaměření · ročník · stav publikace.
- **Řádkové akce:** Otevřít · Duplikovat · Smazat.

### Detail (`/admin/education/:id/edit`)

Záložky: Základní informace · Obsah · Zařazení · Parametry · Objednávka · Galerie.
Pravý panel: publikace, štítky.

## 5. Akce a workflow

CRUD programů, duplikace (nový ročník programu vzniká kopií), zveřejnění a stažení
z webu, přidání a odebrání parametru.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Program bez perexu nebo bez náhledového obrázku | Nejde zveřejnit |
| Program bez stupně školy | Nejde zveřejnit — na webu by nebyl v žádném filtru |
| Odkaz do objednávkového systému prázdný | Uloží se; na webu není tlačítko |
| Parametr bez hodnoty | Nezobrazí se na webu |

## 7. Číselníky, notifikace, integrace

### 7.1 Stupeň školy

| Kód | Popisek |
|---|---|
| `kindergarten` | Mateřské školy |
| `primary1` | Základní školy 1. stupeň |
| `primary2` | Základní školy 2. stupeň |
| `secondary` | Střední školy |

### 7.2 Ročníky
`1.tř.` až `9.tř.` a `SŠ`. Neutrální číselník — jde jen o čísla tříd.

### 7.3 Zaměření

| Kód | Popisek |
|---|---|
| `financial` | Finanční gramotnost |
| `world` | Člověk a jeho svět |
| `civics` | Občanská výchova |
| `environment` | Environmentální výchova |

Číselník je otevřený — redakce smí přidat další zaměření.

### 7.4 Štítky
`Novinka` · `Oblíbené` · `Sezónní` · `S dotací`.

### 7.5 Notifikace
Modul neposílá žádné. Objednávky chodí do Francescy, administrace o nich neví.

### 7.6 Integrace — Francesca

**Bez integrace.** Vazba je opačná než u Colossea: nic se neimportuje ani nečte přes API,
jde jen o odkaz ven. Prázdný odkaz je platný stav. Objednávkový systém nemá nic
společného s interním systémem DOVIS.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se program smaže |
|---|---|---|---|
| Program → autor | **tento modul** | `program-author` | — |

**Modul nemá vazbu na objekty v Areálu** a mít ji nebude *(rozhodnutí 9. 9. 2026)*.
Kde program probíhá, se píše do parametrů nebo do obsahu. Důsledek, se kterým se počítá:
web nefiltruje programy podle místa a v detailu objektu se nezobrazuje, co se v něm učí.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 14-1 | Program bez stupně školy nejde zveřejnit. |
| 14-2 | Program bez odkazu do objednávkového systému se zveřejní a na webu nemá objednávkové tlačítko. |
| 14-3 | Popisek objednávkového tlačítka se na webu zobrazí tak, jak ho redakce zadala. |
| 14-4 | Program s uplynulým datem zůstane na webu, dokud ho redakce nestáhne. |
| 14-5 | Duplikací programu vzniká nový koncept se všemi parametry a zařazením. |
| 14-6 | Filtr na webu podle stupně školy, ročníku a zaměření vrací programy nezávisle — tři taxonomie se nesměšují. |

## Otevřené otázky

Modul nemá otevřené otázky. Vazba programu na objekt v Areálu byla **zamítnuta**
*(rozhodnutí 9. 9. 2026)* — viz sekci 8.
