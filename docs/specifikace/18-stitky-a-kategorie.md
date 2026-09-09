# Modul: Štítky a kategorie

> Entita `taxonomyTerm`. Cesta `/admin/taxonomy`. Sekce **Nastavení**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize.

## 1. Účel a role

- Centrální správa štítků a kategorií — jejich **překlady** a **barvy**.
- Používá redaktor s oprávněním `taxonomy`.

**Taxonomie se překládá jednou tady, ne v panelu záznamu.** V detailu aktuality nebo
albumu se štítek jen *vybírá* — jazykově nezávisle, protože tentýž záznam má stejná
témata ve všech mutacích. Kdyby se štítek překládal u záznamu, měl by „Festival" tolik
anglických podob, kolik je aktualit.

## 2. Datový model a pole

### 2.1 Entita `taxonomyTerm`

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Klíč | `term-id` | slug | **ano** | ne | z českého názvu | Stabilní identita nezávislá na překladu |
| Název | `term-label` | text | **ano** | ano | — | Čeština je identita v záznamech |
| Barva | `term-color` | color | **ano** | ne | z palety | Sdílená napříč mutacemi |
| Skupina | `term-group` | enum | **ano** | ne | — | Číselník 7.1 |

**Záznam referencuje pojem českým názvem** (`term-label.cs`), ne klíčem. Klíč slouží
k identitě pojmu v této správě; ostatní jazyky jsou jen pro web. Přejmenování českého
názvu je proto změna, která se musí propsat do záznamů — viz 6.

### 2.2 Sady pojmů

Každý modul má **vlastní sadu** předdefinovaných štítků; společný číselník napříč moduly
se nezavádí *(rozhodnutí session 8. 9. 2026)*. Tenhle modul je spravuje na jednom místě,
ale nesměšuje.

| Skupina | Kde se používá |
|---|---|
| Štítky aktualit | 07 Aktuality, 03 Galerie |
| Kategorie aktualit | 07 Aktuality |
| Štítky akcí | 01 Kalendář akcí |
| Štítky prohlídek | 06 Prohlídky |
| Štítky objektů | 02 Areál |
| Štítky programů | 14 Vzdělávací programy |
| Kategorie FAQ | 08 FAQ |
| Taxonomie programů | 14 — stupeň školy, ročníky, zaměření |

## 3. Stavy a životní cyklus

Modul nemá stavy. Pojem existuje, nebo neexistuje; skrývání se neřeší — nepoužívaný
pojem se odebere.

## 4. Obrazovky a UI

Jedna obrazovka (`/admin/taxonomy`) se záložkou na každou skupinu pojmů. V každé
tabulka s editací v řádku: barva, český název, překlady, počet záznamů, které pojem
používají. Jedno uložení pro celou obrazovku.

Pojem bez překladu v některé mutaci se označí — na webu by v ní vypadl na češtinu.

## 5. Akce a workflow

Přidat pojem, přejmenovat, doplnit překlad, změnit barvu, odebrat. Nový pojem vzniká
i **z detailu záznamu** — redakce ho vytvoří rovnou u aktuality a tady se objeví
k překladu.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Český název unikátní v rámci skupiny | Tvrdá — dva stejné štítky by se v záznamech nerozlišily |
| Přejmenování českého názvu | Propíše se do všech záznamů, které pojem používají; operace je transakční |
| Odebrání pojmu, který někdo používá | **Nelze**; obrazovka uvede počet záznamů a odkaz na ně |
| Pojem bez překladu | Uloží se; na webu se v té mutaci zobrazí česky |
| Barva | Z palety; ruční hex je povolený |

Přejmenování je nejrizikovější operace modulu — proto je transakční a s potvrzením,
které uvede počet dotčených záznamů.

## 7. Číselníky, notifikace, integrace

### 7.1 Skupina pojmu

| Kód | Popisek |
|---|---|
| `news-tags` | Štítky aktualit |
| `news-categories` | Kategorie aktualit |
| `event-tags` | Štítky akcí |
| `tour-tags` | Štítky prohlídek |
| `area-tags` | Štítky objektů |
| `program-tags` | Štítky programů |
| `faq-categories` | Kategorie FAQ |
| `program-levels` | Stupeň školy |
| `program-grades` | Ročníky |
| `program-focus` | Zaměření |

Seznam skupin je **uzavřený** a rozšiřuje se nasazením — každá skupina má na straně
modulu svoje místo, kde se nabízí.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná.

## 8. Vazby na jiné moduly

Pojem se v záznamech referencuje **českým názvem**, ne cizím klíčem. Vazba tedy není
`ref`, ale textová hodnota v poli typu `tags`.

| Vazba | Vlastník | Pole | Když se pojem odebere |
|---|---|---|---|
| Záznam → štítek / kategorie | modul záznamu | `*-tags`, `*-categories` | **Nelze odebrat**, dokud ho někdo používá |

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 18-1 | Překlad štítku zadaný tady se projeví u všech záznamů, které štítek používají, bez zásahu v jejich detailu. |
| 18-2 | V detailu aktuality se štítek jen vybírá — nejde ho tam přeložit. |
| 18-3 | Pojem, který někdo používá, nejde odebrat; hláška uvede počet záznamů. |
| 18-4 | Přejmenování českého názvu se propíše do všech dotčených záznamů; při chybě se nezmění nic. |
| 18-5 | Štítek bez překladu se na cizojazyčné verzi webu zobrazí česky, ne prázdný. |
| 18-6 | Nový štítek vytvořený z detailu aktuality se objeví v této správě k překladu. |
| 18-7 | Dva pojmy ve stejné skupině nemají stejný český název. |

## Otevřené otázky

Modul nemá otevřené otázky.
