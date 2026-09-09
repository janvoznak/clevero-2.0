# Modul: Areál

> Entita `venue`, cesta `/admin/area`. Sekce **Areál**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** nálezy `02/01`–`02/17`, rozhodnutí `00/05`, `00/06`, `00/14`–`00/20`, `00/43`.

## 1. Účel a role

- Objekty areálu — budovy, expozice a místa, která mají na webu vlastní stránku
  (Bolt Tower, Velký svět techniky, Gong, Infocentrum…). Objekt je zároveň **místem**,
  na které se odkazují akce, prohlídky, novinky a galerie.
- Používá redaktor s oprávněním `area`.
- Objekt je uzel modelu: většina vazeb v systému vede na něj, ale **žádnou z nich
  needituje** — všechny vlastní protějšek a v detailu objektu se jen zrcadlí.

## 2. Datový model a pole

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

### Tab „Základní informace"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název objektu | `area-title` | text | **ano** | ano | — | |
| URL adresa | `area-url` | slug | **ano** | ano | z názvu | Unikátní v rámci jazyka |
| Krátký popis (perex) | `area-summary` | textarea | ano, když zveřejněno | ano | — | Do výpisu a na kartu |
| Bezbariérový přístup | `area-accessible` | bool | **ano** | ne | ne | Web nezobrazuje — ponecháno *(rozhodnutí 00/19)* |
| Silueta objektu | `area-silhouette` | text | **ano** | ne | podle typu | Klíč tvaru pro mapu areálu |
| Vlastní silueta | `area-silhouette_svg` | file | ne | ne | — | Nahrané SVG přebije klíč |
| Barva objektu | `area-color` | color | **ano** | ne | `#64748b` | Používá kalendář a mapa areálu |
| Zajímavá čísla | `area-stats` | — | ne | ano (popisek) | prázdné | Opakovatelné dvojice hodnota + popisek |
| Provozní stav | `area-open_state` | enum | **ano** | ne | Otevřeno | Číselník 7.1 |
| Poznámka k provozu | `area-status_note` | text | ne | ano | — | Zobrazí se v informační liště, viz 8 a **O11** |
| Zobrazovat otevírací dobu | `area-show_hours` | bool | **ano** | ne | ano | |
| Otevírací doba | `area-opening_hours` | — | ne | ne | Po–Ne zavřeno | Sedm dní, u každého otevřeno + časy |
| Zobrazovat na dashboardu | `area-dashboard` | bool | **ano** | ne | ano | Jen administrace, na web nemá vliv |

### Tab „Galerie"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Připojené galerie | `gallery-area_id` | — | — | — | — | **Jen pro čtení** — vazbu vlastní modul 03 |
| Vlastní fotografie | `area-photos` | gallery | ne | ne | prázdná | Fotky nahrané přímo u objektu |
| Náhledový obrázek | `area-image` | — | — | — | — | **Odvozený** — hlavní fotka z galerie, nenahrává se zvlášť |

Fotky lze u objektu vést **oběma cestami** — připojit album z modulu Galerie i nahrát
přímo *(rozhodnutí 00/43, nález 03/07)*.

### Tab „Kontakt na objekt"

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| E-mail | `area-email` | email | ne | ne | — | |
| Telefon | `area-phone` | phone | ne | ne | — | |
| Vlastní web objektu | `area-web` | url | ne | ne | — | |

Vlastníkem kontaktu je objekt — modul 13 Kontakty ho jen zrcadlí.

### Záložky objektu (`pageTabs`)

Objekt má vlastní sadu záložek, které kopírují záložky na webu. Redakce je spravuje:
přidat, přejmenovat, přeskládat, smazat, přepnout typ *(rozhodnutí 00/06, nález 02/06)*.

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název záložky | `tab-label` | text | **ano** | ano | — | |
| Typ záložky | `tab-kind` | enum | **ano** | ne | Vlastní obsah | Číselník 7.2 |
| Adresa odkazu | `tab-external_url` | url | ano, když typ = odkaz | ne | — | |
| Obsah záložky | — | blocks | ne | ano | prázdný | Jen u typu „vlastní obsah" |

Výchozí sada nové budovy kopíruje web: Expozice · Doprovodný program · Prohlídky
(automatický výpis) · Výjezdní akce · Letní tábory · Pro školy (odkaz ven)
*(nález 02/10)*. **Galerie je samostatná fixní záložka administrace**, ne jedna
z těchto.

### Pravý panel

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Štítky | `area-tags` | tags | ne | ne | prázdné | Sada 7.3. Web nezobrazuje — ponecháno *(rozhodnutí 00/19)* |

### Pole, která modul vědomě nemá

| Co | Proč |
|---|---|
| Dlouhý popis „O objektu", vlastní nadpisy sekcí | Skládají se v content builderu záložky *(rozhodnutí 00/05, nálezy 02/01, 02/02)* |
| Obrázek hlavičky, odkaz na vstupenky, zvýrazněná část názvu, textový souhrn otevírací doby | Nedoplňuje se *(rozhodnutí 00/14, nálezy 02/03, 02/04, 02/07, 02/08)*. Důsledek: hlavička objektu není z administrace ovlivnitelná |
| Popisky dlaždic „Kam dál" | Dlaždice jsou jen navigace na záložky *(rozhodnutí 00/16, nález 02/05)* |
| Vazba na modul Stránky | Obsah záložek drží objekt *(rozhodnutí 00/17, nález 02/11)* |
| Nabízené prohlídky, akce, novinky | Odvozené z vazeb, které vlastní protějšek |

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování).

**Provozní stav** (`area-open_state`) je nezávislá vlastnost, ne publikace: objekt může
být zveřejněný a zavřený zároveň. Nadřazený otevírací době — „Zavřeno" přebije rozpis.

| Provozní stav | Web |
|---|---|
| Otevřeno | Zobrazí otevírací dobu podle rozpisu |
| Zavřeno | Objekt je označený jako zavřený, rozpis se nezobrazuje |
| Sezónně | Objekt je označený jako sezónní, rozpis se zobrazuje |

Objekt je navíc **uzavřený odvozeně**, koná-li se v něm akce s příznakem „obsazuje
objekt" (modul 01). Odvozený stav se do objektu neukládá.

## 4. Obrazovky a UI

### Seznam (`/admin/area/list`)

- **Sloupce:** Objekt (silueta, název, perex) · Provozní stav · Otevírací doba ·
  Jazykové mutace · Akce.
- **Filtr:** provozní stav · zveřejnění · štítek.
- **Řádkové akce:** Otevřít · Duplikovat · Smazat.
- **Přidání:** „Nová budova" (`/admin/area/new`).

### Detail (`/admin/area/:id/edit`)

Záložky: **název objektu** (základní informace) · Galerie · a za nimi jedna záložka
za každou položku `pageTabs`. Za nimi tlačítko „+ Záložka".

Pravý panel: publikace (stav, jazykové mutace), štítky.

### Dynamické chování formuláře

| Podmínka | Co se stane |
|---|---|
| Provozní stav = Zavřeno | Rozpis otevírací doby se skryje, zůstane poznámka k provozu |
| Zobrazovat otevírací dobu = ne | Rozpis se skryje, hodnoty zůstanou uložené |
| Typ záložky = automatický výpis prohlídek | Content builder zmizí, ukáže se read-only seznam prohlídek objektu |
| Typ záložky = odkaz na jiný web | Content builder zmizí, ukáže se pole na adresu |

## 5. Akce a workflow

- CRUD objektu, duplikace, zveřejnění a stažení z webu.
- **Správa záložek:** přidat (nová je vždy obsahová), přejmenovat, posunout vlevo/vpravo,
  odebrat, přepnout typ.
- Nahrání vlastní SVG siluety.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Náhledový obrázek se nenahrává | Odvozuje se z hlavní fotky galerie objektu |
| Provozní stav „Zavřeno" | Přebije otevírací dobu na webu |
| Záložka typu „odkaz" ⇒ adresa vyplněná | Tvrdá při zveřejnění |
| Záložka typu „automatický výpis prohlídek" | Nemá vlastní obsah; plní ji modul 06 podle `tour.areaIds` |
| Smazání objektu, na který ukazují akce, prohlídky, novinky nebo galerie | Nelze; nejdřív se vazby zruší v jejich modulech |
| Nahraná silueta | Musí být SVG; přebije klíč `area-silhouette` |

## 7. Číselníky, notifikace, integrace

### 7.1 Provozní stav

| Kód | Popisek |
|---|---|
| `open` | Otevřeno |
| `closed` | Zavřeno |
| `seasonal` | Sezónně |

### 7.2 Typ záložky
| Kód | Popisek | Obsah záložky | Co dělá web |
|---|---|---|---|
| `content` | Vlastní obsah | Content builder | Vykreslí bloky |
| `tours` | Automatický výpis prohlídek | — | Vypíše prohlídky, které mají objekt jako místo konání *(rozhodnutí 00/15, nález 02/09)* |
| `external` | Odkaz na jiný web | Adresa | Záložka vede ven, otevře se v novém okně |

### 7.3 Štítky
Předdefinované: `Gastro` · `Atraktivity` · `Ubytování`.

### 7.4 Notifikace
Modul neposílá žádné.

### 7.5 Integrace
**Colosseum** — objekty s naplánovanými prohlídkami se importují. Objekty bez prohlídek
(např. Malý svět techniky) zadává redakce ručně. Seznam objektů není uzavřený —
**O9**.

## 8. Vazby na jiné moduly

Detail objektu **needituje žádnou vazbu**. Všechny vlastní protějšek a tady se zrcadlí
read-only.

| Vazba | Vlastník | Pole | Když se objekt smaže |
|---|---|---|---|
| Akce → objekt | 01 Kalendář akcí | `event-area_id` | Nelze smazat, dokud vazba trvá |
| Prohlídka → objekt | 06 Prohlídky | `tour-area_id` | Nelze smazat, dokud vazba trvá |
| Novinka → objekt | 07 Aktuality | `news-area_id` | Nelze smazat, dokud vazba trvá |
| Album → objekt | 03 Galerie | `gallery-area_id` | Nelze smazat, dokud vazba trvá |
| Pozice → objekt | 16 Kariéra | `position-area_id` | Nelze smazat, dokud vazba trvá |
| Skupina kontaktů → objekty | 13 Kontakty | `group-venue_ids` | Objekt zmizí ze skupiny |
| Uzavření objektu akcí | 01 Kalendář akcí | `event-closes_venue` | — |

Poznámka k provozu objektu míří do informační lišty (modul 10) — vztah k ručnímu textu
lišty je **O11**.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 02-1 | Redakce přidá objektu záložku, přejmenuje ji, posune a smaže, aniž by zasahoval vývojář. |
| 02-2 | Nová záložka má jako obsah content builder; přepnutím na „automatický výpis prohlídek" content builder zmizí a objeví se seznam prohlídek objektu. |
| 02-3 | Záložka typu „odkaz" bez vyplněné adresy nejde zveřejnit. |
| 02-4 | Prohlídka, která má objekt jako místo konání, se v jeho záložce Prohlídky objeví bez zásahu redakce. |
| 02-5 | Objekt s provozním stavem „Zavřeno" nezobrazuje na webu rozpis otevírací doby. |
| 02-6 | Objekt, na který se odkazuje akce nebo prohlídka, nejde smazat; hláška pojmenuje, co na něj ukazuje. |
| 02-7 | Náhledový obrázek objektu odpovídá hlavní fotce jeho galerie a nejde nahrát zvlášť. |
| 02-8 | Kontakt vyplněný u objektu se zobrazí ve skupině objektů v modulu 13 bez opsání. |

## Otevřené otázky

| # | Otázka | Dopad |
|---|---|---|
| **O9** | Uzavřený seznam objektů areálu (02/12, s ním 01/19 a 04/12) — které objekty existují a jakou mají roli? | Web pracuje s objekty, které administrace nezná; rozejde se místo konání akce, prohlídky i pronájmu |
| **O11** | Propadá poznámka k provozu do informační lišty automaticky (02/16)? Co má přednost, když je vyplněná i ruční lišta? | Dvě místa plní tentýž pruh |
