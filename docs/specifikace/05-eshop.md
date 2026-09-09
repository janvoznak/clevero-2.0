# Modul: E-shop

> Entity `product`, `productCategory`. Cesty `/admin/products`, `/admin/vouchers`,
> `/admin/product-categories`. Sekce **Produkty**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** nálezy `05/01`–`05/14`, rozhodnutí `00/03`, `00/32`–`00/38`.

## 1. Účel a role

- Suvenýry, vouchery a merch, které web ukazuje ve výpisu e-shopu. Nákup a košík
  odbavuje **Colosseum**; web na něj odkazuje.
- Používá redaktor s oprávněním `products`, `vouchers`, `product-categories`.
- Produkt **nezakládá redakce** — importuje se z Colossea. Redakce doplňuje to, co
  Colosseum nemá: perex, fotky a členění.

## 2. Datový model a pole

### 2.1 Entita `product`

Pole se dělí na dvě skupiny: **z Colossea** (jen pro čtení, i pro API) a **z CMS**.

#### Data z Colossea — jen pro čtení

| Pole | name | Typ | Povinné | ML | Poznámka |
|---|---|---|---|---|---|
| ID zboží v Colosseu | `product-colosseum_id` | text | **ano** | ne | Externí ID, unikátní, párovací klíč |
| Název z Colossea | `product-name` | text | **ano** | ne | Jednojazyčný, needitovatelný |
| Cena | `product-price` | money | **ano** | ne | |
| Počet na skladě | `product-stock` | int | **ano** | ne | |
| Obrázek z Colossea | `product-colosseum_image` | image | ne | ne | Colosseum má jen jeden |
| Typ zboží | `product-type` | enum | **ano** | ne | Číselník 7.1 — technická informace |
| Naimportováno | `product-imported_at` | datetime | **ano** | ne | |
| Poslední synchronizace | `product-synced_at` | datetime | **ano** | ne | |
| Odkaz do košíku | `product-cart_url` | url | **ano** | ne | Vede do websale Colossea |

#### Obsah doplňovaný v CMS

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název pro web | `product-name_override` | text | ne | ano | — | Prázdné = použije se název z Colossea |
| Perex | `product-perex` | textarea | ano, když zveřejněno | ano | — | Jediný text, který web na kartě ukáže *(rozhodnutí 00/03, nález 05/01)* |
| URL adresa | `product-url` | slug | ano, když existuje detail | ano | z názvu | Viz 3.2 |
| Obsah produktu | `product-content` | blocks | ne | ano | prázdný | Content builder — jen pro detail |
| Vlastní fotografie | `product-gallery` | gallery | ne | ne | prázdná | Karusel na kartě |
| Členění | `product-category_ids` | refList → `productCategory` | ano, když zveřejněno | ne | prázdné | Viz 6.2 |

**Perex je navázaný na kontrolu „chybí popis"** — produkt bez perexu se hlásí na nástěnce
i ve filtru výpisu.

### 2.2 Entita `productCategory`

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název kategorie | `category-name` | text | **ano** | ano | — | Na webu filtrovací chip s počtem |
| Popis | `category-description` | richtext | ne | ano | — | Web nezobrazuje — zatím ponecháno *(rozhodnutí 00/38)* |
| Náhledový obrázek | `category-image` | image | ne | ne | — | Web nezobrazuje — zatím ponecháno |
| Pořadí | — | — | — | — | — | **Neřeší se** *(rozhodnutí 00/34)* |

### 2.3 Pole, která modul vědomě nemá

| Co | Proč |
|---|---|
| Akční cena a příznak slevy | Nezavádí se *(rozhodnutí 00/32, nález 05/02)*. Důsledek: sleva se dál obchází kategorií „Výprodej" a produkt tím zmizí z původní kategorie |
| Pořadí kategorií a produktů | Neřeší se *(rozhodnutí 00/34, nález 05/05)*. Důsledek: redakce nevypíchne, co se má prodávat první |
| Připojené galerie z modulu Galerie | Odebráno *(rozhodnutí 00/38, nález 05/11)* — na webu se u produktu neprojevily |
| Texty kolem výpisu e-shopu | Natvrdo ve frontendu *(rozhodnutí 00/33, nálezy 05/03, 05/04)* |
| SEO pole | Odvozují se *(rozhodnutí 00/24, nález 05/13)* |
| Per-jazyk publikace | Produkty ji nemají — publikaci řídí import, ne ruční přepínač mutací |

## 3. Stavy a životní cyklus

### 3.1 Dostupnost

Odvozená z počtu na skladě, neukládá se.

| Dostupnost | Podmínka | Web |
|---|---|---|
| Na skladě | > 5 kusů | Lze koupit |
| Poslední kusy | 1–5 kusů | Lze koupit, zvýrazněné |
| Vyprodáno | 0 kusů | Nelze koupit |

Zveřejnění je nezávislé: vyprodaný produkt může zůstat na webu. Viditelnost řídí
`published` v CMS, dostupnost Colosseum.

### 3.2 Detail produktu

**Detail produktu vznikne** *(rozhodnutí 00/35, nálezy 05/06, 05/12, 05/13)*. Do jeho
nasazení platí:

| Prvek | Do nasazení detailu | Po nasazení |
|---|---|---|
| URL adresa produktu | Nepovinná, nepoužívá se | Povinná |
| Obsah po blocích | Neukládá se na web | Vykresluje se v detailu |
| Karta ve výpisu | Nikam nevede, obsah je na kartě | Vede na detail |

## 4. Obrazovky a UI

### 4.1 Seznam produktů (`/admin/products`) a voucherů (`/admin/vouchers`)

Tatáž obrazovka nad jedním datovým zdrojem, filtruje se podle typu zboží.

- **Nástěnka nahoře:** produkty **bez popisu**, čerstvě naimportované první. Je to
  jediné, co redakce po importu musí udělat.
- **Sloupce:** Náhled a název · Členění · Cena · Sklad · Dostupnost · Popis (má / chybí)
  · Akce.
- **Filtr:** členění · dostupnost · popis (má / chybí).
- **Řádkové akce:** Otevřít. Produkt se nezakládá ani nemaže — vzniká a mizí importem.

### 4.2 Seznam kategorií (`/admin/product-categories`)

Název, počet produktů, akce. Kategorii zakládá a maže redakce.

### 4.3 Detail produktu (`/admin/products/:id/edit`)

Záložky: Základní informace · Obsah · Napojení a prodej · Galerie.
Pravý panel: **Zobrazení na webu** — stav a věta, že dostupnost řídí Colosseum.

Údaje z Colossea jsou v detailu vidět jako **referenční blok** (název, cena, sklad,
obrázek, čas synchronizace), ne jako editovatelná pole.

## 5. Akce a workflow

- Doplnění perexu, fotek a členění u naimportovaného produktu.
- Zveřejnění a stažení z webu.
- CRUD kategorií.
- **Import z Colossea** — automaticky každou hodinu, viz 7.4.

Produkt nelze založit ručně ani smazat: zdrojem pravdy je Colosseum.

## 6. Byznys pravidla, výpočty a validace

### 6.1 Validace

| Pravidlo | Chování |
|---|---|
| Produkt bez perexu | Nejde zveřejnit; hlásí se na nástěnce |
| Produkt bez členění | Nejde zveřejnit — na webu by nebyl v žádném filtru |
| Smazání kategorie s produkty | Nelze; produkty se nejdřív přeřadí |
| ID z Colossea | Neměnné, i pro API |

### 6.2 Jeden produkt, jedna kategorie

Produkt patří **do jedné kategorie** *(rozhodnutí 00/36, nález 05/08)*. Vícenásobné
zařazení rozbíjí počty ve filtru na webu — součet by přesáhl počet produktů.

**Typ zboží z Colossea není kategorie**: rozhoduje o chování košíku (voucher vs. zboží),
na webu se nezobrazuje. Pro web se používají výhradně kategorie
*(rozhodnutí 00/36, nález 05/07)*.

### 6.3 Množství a košík

Počítadlo kusů na kartě a předání množství do košíku **řeší API Colossea**
*(rozhodnutí 00/37, nález 05/10)*. Administrace do toho nezasahuje.

## 7. Číselníky, notifikace, integrace

### 7.1 Typ zboží

| Kód | Popisek | Chování košíku |
|---|---|---|
| `goods` | Zboží | Fyzické zboží, odesílá se |
| `voucher` | Voucher | Elektronický, doručí se e-mailem |
| `souvenir` | Suvenýr | Fyzické zboží |

Číselník drží Colosseum; v CMS je jen pro čtení.

### 7.2 Kategorie
Zakládá redakce. Podle webu: `Vouchery` · `Suvenýry` · `Magnetky` · `Pro děti` ·
`Knihy` · `DOV` · `Žertovinky` · `Výprodej`. Sada se sjednotí podle webu — počty a názvy
v prototypu jsou mock data *(rozhodnutí 00/36, nález 05/09)*.

### 7.3 Notifikace
Selhání importu se hlásí na dashboardu uživatelům s oprávněním `products`. E-mail se
neposílá.

### 7.4 Integrace — Colosseum

| Data | Směr | Perioda |
|---|---|---|
| Zboží a vouchery (ID, název, cena, sklad, obrázek, typ) | čtení | 1 h |
| Odkaz do košíku | čtení | 1 h |

- Nový produkt v Colosseu se objeví v CMS jako **bez popisu** a hlásí se na nástěnce.
- Produkt, který Colosseum přestane posílat, zůstane v CMS a označí se jako nenapojený —
  nemaže se automaticky.
- Výpadek importu nezablokuje editaci; poslední známé údaje zůstanou a dashboard hlásí
  stáří dat.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se produkt smaže |
|---|---|---|---|
| Produkt → kategorie | **tento modul** | `product-category_ids` | Vazba zaniká |

Produkty na galerie **neodkazují** *(rozhodnutí 00/38)*. Zpětné vazby galerie proto
produkty neobsahují.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 05-1 | Nově naimportovaný produkt bez perexu se objeví na nástěnce e-shopu a nejde zveřejnit. |
| 05-2 | Doplnění perexu odstraní produkt z nástěnky bez dalšího zásahu. |
| 05-3 | Produkt bez členění nejde zveřejnit. |
| 05-4 | Produkt patří nejvýš do jedné kategorie; součet počtů ve filtru na webu odpovídá počtu produktů. |
| 05-5 | Cenu, sklad ani název z Colossea nelze v CMS změnit — ani přes API. |
| 05-6 | Produkt, který Colosseum přestane posílat, zůstane v CMS a označí se jako nenapojený. |
| 05-7 | Výpadek importu nezablokuje editaci perexu a fotek; dashboard hlásí stáří dat. |
| 05-8 | Kategorii s produkty nejde smazat; hláška uvede, kolik produktů v ní je. |
| 05-9 | Vyprodaný produkt může zůstat zveřejněný a na webu se označí jako vyprodaný. |

## Otevřené otázky

Modul nemá vlastní otevřené otázky — rozhodnutí revize je uzavřela. Z průřezových se ho
týká **O1** (katalog bloků obsahu, potřebný až s detailem produktu).
