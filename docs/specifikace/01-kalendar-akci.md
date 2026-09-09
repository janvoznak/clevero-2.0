# Modul: Kalendář akcí

> Entita `event`, cesta `/admin/events`. Sekce **Kalendář akcí**.
> Společné konvence (vícejazyčnost, publikování, vazby, mazání, oprávnění, API) jsou
> v [README.md](README.md) a tady se neopakují.
> **Revize:** nálezy `01/01`–`01/20`, rozhodnutí `00/21`–`00/31`.

## 1. Účel a role

- Program areálu — koncerty, festivaly, výstavy, konference, tábory. Akce se zobrazují
  v kalendáři na webu a v detailu objektu, kde se konají.
- Používá redaktor s oprávněním `events`.
- Modul **neprodává vstupenky.** Prodej odbavuje Colosseum přes navázanou prohlídku,
  nebo pořadatel na svém webu.

**Akce není prohlídka.** Prohlídka je opakovaná placená služba s termíny z Colossea
(modul 06). Akce je kurátorský program s jedním termínem nebo rozsahem. Číselník typů
akcí proto hodnotu „Prohlídka" neobsahuje.

## 2. Datový model a pole

Kromě polí uvedených níže má entita společná pole podle [README](README.md#publikování):
`published`, `publishedLangs`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název akce | `event-title` | text | **ano** | ano | — | |
| URL adresa | `event-url` | slug | **ano** | ano | z názvu | Unikátní v rámci jazyka |
| Podnadpis | `event-subtitle` | text | ne | ano | — | Web dnes nezobrazuje — **O5** |
| Perex | `event-summary` | textarea | ano, když zveřejněno | ano | — | Do výpisu a na kartu |
| Typ akce | `event-type` | enumOpen | **ano** | ne | Festival | Číselník 7.1, lze zadat vlastní |
| Věkové omezení | `event-age_limit` | enumOpen | ne | ne | — | Číselník 7.2, lze zadat vlastní |
| Účinkující / lektoři | `event-performers` | text | ne | ne | — | Jména oddělená čárkou |

### Tab „Obsah"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Obsah akce | `event-content` | blocks | ne | ano | prázdný | Content builder, viz [README](README.md#obsah-po-blocích) |

Lineup, harmonogram, info karty a FAQ akce **nejsou samostatná pole** — skládají se
z bloků obsahu *(rozhodnutí 00/21, nálezy 01/01–01/04, 01/20)*. Důsledek: harmonogram
není strukturovaný, nejde podle něj řadit ani filtrovat.

### Tab „Termín a místo"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Místo konání — celý areál | `event-whole_area` | bool | **ano** | ne | ano | Vylučuje se s objekty |
| Místo konání — objekty | `event-area_id` | refList → `venue` | ano, když není celý areál | ne | prázdné | Akce se zobrazí u každého objektu |
| Akce obsazuje objekt | `event-closes_venue` | bool | **ano** | ne | ne | Viz 6.2 |
| Termín OD | `event-datetime` | date | **ano** | ne | dnešní datum | |
| Termín DO | `event-datetime` | date | **ano** | ne | = OD | Stejné datum = jednodenní akce |
| Čas OD | `event-datetime` | time | ne | ne | — | |
| Čas DO | `event-datetime` | time | ne | ne | — | Web dnes nezobrazuje — **O5** |
| Délka | `event-duration` | text | ne | ne | — | Slovem, např. „90 min". Web dnes nezobrazuje — **O5** |

### Tab „Vstupenky"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Způsob prodeje | `event-ticket_mode` | enum | **ano** | ne | Vstup zdarma | Číselník 7.3 — řídí, co se odkryje |
| Vstupné | `event-price` | text | ne | ne | — | Slovem, např. „od 390 Kč" |
| Navázaná prohlídka | `event-tour_ids` | refList → `tour` | ano, když způsob = Colosseum | ne | prázdné | Prodej nese prohlídka |
| Odkaz na vstupenky | `event-ticket_url` | url | ano, když způsob = externí | ne | — | Web pořadatele |
| Napojení na Colosseum | `event-colosseum_id` | text | ne | ne | — | Externí ID, unikátní |
| Kapacita | `event-capacity` | int | ne | ne | — | Z Colossea. Web dnes nezobrazuje — **O5** |
| Volná místa | `event-free_spots` | int | ne | ne | — | Z Colossea. Web dnes nezobrazuje — **O5** |

### Tab „Galerie"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Plakát | `event-image` | image | ano, když zveřejněno | ne | — | Hlavní vizuál na kartě i v detailu |
| Vlastní fotografie | `event-gallery` | gallery | ne | ne | prázdná | Fotky nahrané přímo k akci |
| Alba z této akce | `gallery-event_id` | — | — | — | — | **Jen pro čtení** — vazbu vlastní modul 03 |

### Pravý panel

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Štítky | `event-tags` | tags | ne | ne | prázdné | Sada 7.4. Web dnes nezobrazuje — **O5** |

### Odvozená pole

Neukládají se, počítají se při každém dotazu.

| Pole | Výpočet |
|---|---|
| Průběh akce | `probíhá` / `nadcházející` / `proběhlá` z termínu a dnešního data |
| Vícedenní | Termín OD ≠ Termín DO |
| Popisek místa | Název objektu, nebo „Celý areál DOV" |

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování). Modul nemá vlastní stavový
model — průběh akce je odvozený z data, neukládá se a nemá přechody.

Akce z Colossea (tábory) jsou read-only projekce: nelze je upravit ani smazat, jen skrýt
z webu.

## 4. Obrazovky a UI

### Seznam (`/admin/events`)

Dva pohledy nad týmiž daty, přepínají se v hlavičce:

| Pohled | Obsah |
|---|---|
| Výpis | Název, typ, termín, místo, způsob prodeje, stav, jazykové mutace, akce |
| Kalendář | Měsíční mřížka; řádek na objekt, zvláštní pruh „Celý areál" nahoře |

- **Filtr:** stav (probíhá / nadcházející / proběhlé / koncept) · typ akce · místo konání
  · období od–do.
- **Řádkové akce:** Otevřít · Duplikovat · Smazat.
- **Hromadné akce:** Smazat.
- **Přidání:** „Nová akce" (`/admin/events/new`) — průvodce, viz 5.2.

### Detail (`/admin/events/:id`)

Záložky: Základní informace · Obsah · Termín a místo · Vstupenky · Galerie · Propagace.
Pravý panel: publikace (stav, jazykové mutace), štítky.

**Propagace** je interní nástroj — připraví koncept příspěvku na sociální sítě z údajů
akce. Na web nejde nic *(nález 01/16)*.

### Dynamické chování formuláře

| Podmínka | Co se stane |
|---|---|
| Změna způsobu prodeje | Odkryje se jen pole patřící k režimu, ostatní se skryjí; hodnoty zůstanou uložené |
| Celý areál = ano | Výběr objektů zmizí, přepínač „obsazuje objekt" je nedostupný |
| Napojení na Colosseum vyplněné a známé | Kapacita a volná místa se zobrazí z Colossea, jen pro čtení |
| Napojené ID Colosseum nezná | Akce se hlásí jako nenapojená; uložit ji lze |

## 5. Akce a workflow

### 5.1 Běžný tok

CRUD akce, duplikace, zveřejnění a stažení z webu, hromadné mazání.

### 5.2 Založení akce z odkazu

Průvodce, který z veřejné adresy pozvánky předvyplní název, termín, místo, perex a plakát.
Předvyplněné hodnoty jsou **návrh** — redakce je před uložením potvrdí. Selže-li načtení,
průvodce to řekne a nabídne prázdný formulář. Je to pomůcka, ne integrace.

## 6. Byznys pravidla, výpočty a validace

### 6.1 Validace

| Pravidlo | Chování |
|---|---|
| Termín DO ≥ Termín OD | Tvrdá, nelze uložit |
| Celý areál ⇒ objekty prázdné | Vynucuje formulář i API, obojí naráz nejde |
| Způsob prodeje = Colosseum ⇒ navázaná prohlídka | Tvrdá při zveřejnění |
| Způsob prodeje = externí ⇒ odkaz vyplněný | Tvrdá při zveřejnění |
| Obsazuje objekt ⇒ není celý areál | Uzavřít lze konkrétní objekt, ne celý areál |
| Napojené ID Colosseum nezná | Měkká: uloží se, akce se hlásí jako nenapojená |

### 6.2 Uzavření objektu

Akce s příznakem „obsazuje objekt" po dobu svého konání označuje objekty z místa konání
jako uzavřené *(rozhodnutí 00/31, nález 01/15)*.

| Kde | Co se stane |
|---|---|
| Dashboard administrace | Objekt se hlásí v přehledu „Provoz budov" s odkazem na akci |
| Web — detail objektu | Objekt je označený jako uzavřený s odkazem na akci |

Uzavření je **odvozené**, do objektu se neukládá. Po skončení akce se objekt otevře sám.

### 6.3 Chování webu podle způsobu prodeje

Web mění tlačítko podle režimu *(rozhodnutí 00/30, nález 01/14)*. U vstupu zdarma
nesmí nabízet nákup.

## 7. Číselníky, notifikace, integrace

### 7.1 Typ akce

| Kód | Popisek |
|---|---|
| `festival` | Festival |
| `concert` | Koncert |
| `sport` | Sportovní akce |
| `exhibition` | Výstava |
| `education` | Vzdělávací program |
| `conference` | Konference |
| `standup` | Stand-up |

Typ je zároveň filtr na webu. Číselník je **otevřený** — redakce smí zadat vlastní
hodnotu *(rozhodnutí 00/26, nález 01/17)*. Vlastní hodnota se ukládá jako text; filtr ji
porovnává na přesnou shodu.

### 7.2 Věkové omezení

| Kód | Popisek |
|---|---|
| `from3` | Od 3 let |
| `from6` | Od 6 let |
| `from12` | Od 12 let |
| `from15` | Od 15 let |
| `from18` | Od 18 let |

Vlastní hodnota se ukládá jako text bez kódu — web ji vypíše, ale nefiltruje podle ní.

Otevřený: web používá i hodnoty mimo číselník („6–12 let", „do 15 let", „60+")
*(rozhodnutí 00/22, nález 01/05)*.

### 7.3 Způsob prodeje vstupenek

| Kód | Popisek | Co se u akce vyplňuje | Co dělá web |
|---|---|---|---|
| `colosseum` | Online přes Colosseum | Navázaná prohlídka | Dostupnost i košík táhne prohlídka |
| `external` | Odkaz na web pořadatele | Odkaz na vstupenky | Tlačítko „Na webu pořadatele" |
| `onsite` | Vstupenky na místě | — | Tlačítko „Vstupenky na místě", bez odkazu |
| `free` | Vstup zdarma | — | Bez tlačítka |

„Zdarma" a „na místě" se **neslévají** — je to placeno × neplaceno, dva různé případy.

### 7.4 Štítky

Předdefinované: `Zdarma` · `Rodinné` · `Venku` · `Hudba` · `Pro školy`. Vlastní štítek
smí redakce vytvořit.

### 7.5 Notifikace

Modul neposílá žádné.

### 7.6 Integrace

**Colosseum** — tábory se importují jako read-only projekce každou hodinu. Ostatní akce
se neimportují, kalendář je kurátorský program. Napojení akce na Colosseum přes externí ID
slouží k načtení kapacity a volných míst.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se akce smaže |
|---|---|---|---|
| Akce → objekt (místo konání) | **tento modul** | `event-area_id` | Vazba zaniká, objekt zůstává |
| Akce → prohlídky | **tento modul** | `event-tour_ids` | Vazba zaniká, prohlídka zůstává |
| Album → akce | modul 03 Galerie | `gallery.eventId` | Album zůstává, vazba se ruší |

V detailu akce se **zrcadlí read-only**: alba z této akce (modul 03).
Prohlídky se v modulu 06 samy o akci nestarají — vazbu vlastní akce.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 01-1 | Akce se způsobem prodeje „vstup zdarma" nemá na webu tlačítko k nákupu, ani když má vyplněnou cenu. |
| 01-2 | Akce s externím prodejem a prázdným odkazem nejde zveřejnit; hláška pojmenuje chybějící pole. |
| 01-3 | Akce označená „obsazuje objekt" se po dobu konání hlásí na dashboardu v přehledu provozu budov; po skončení hlášení zmizí bez zásahu obsluhy. |
| 01-4 | Vlastní typ akce mimo číselník projde uložením a akce se podle něj dá na webu filtrovat. |
| 01-5 | Věkové omezení „6–12 let" projde uložením a zobrazí se na kartě akce. |
| 01-6 | Akce v celém areálu nemá ve formuláři výběr objektů a přepínač uzavření objektu je nedostupný. |
| 01-7 | Tábor importovaný z Colossea nelze upravit ani smazat; jde ho skrýt z webu. |
| 01-8 | Vícedenní akce se v kalendáři zobrazuje ve všech dnech svého rozsahu. |
| 01-9 | Smazání akce nesmaže album, které se na ni odkazovalo; album zůstane bez vazby. |

## Otevřené otázky

| # | Otázka | Dopad |
|---|---|---|
| **O5** | Pět polí, která web dnes nezobrazuje — štítky (01/10), podnadpis (01/11), čas konce a délka (01/12), kapacita a volná místa (01/13). Doplnit na web, nebo z modelu odebrat? | Redakce plní pole, která nikam nejdou. Do rozhodnutí zůstávají v modelu a jsou v tabulkách označená |
| **O8** | Příznak „zvýraznit akci ve výpisu" (01/08) — zavést? | V modelu zatím není; redakce nemůže akci vypíchnout |
| **O10** | Přebírá kalendář termíny prohlídek automaticky z modulu 06 (01/18)? | Určuje, odkud web bere data pro kalendář, a jestli hrozí dvojí zadávání |

Otázky jsou vedené v [README — Otevřené otázky](README.md#otevřené-otázky).
