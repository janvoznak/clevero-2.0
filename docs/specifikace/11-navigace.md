# Modul: Navigace

> Entity `menu`, `menuItem`. Cesta `/admin/navigation`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** souvisí s nálezem `04/08` a rozhodnutím `00/49`.

## 1. Účel a role

- Menu webu — hlavní vodorovné menu v hlavičce a servisní pruh nad ním.
- Používá redaktor s oprávněním `navigation`.
- Položka menu **neukládá adresu, ale odkaz na entitu**: u stránky drží její ID, u
  modulového výpisu klíč modulu. Odkaz se tím nerozbije při změně slugu ani při přepsání
  routingu.

## 2. Datový model a pole

### 2.1 Entita `menu` (nabídka)

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název nabídky | `menu-name` | text | **ano** | ne | — | Jen pro administraci |
| Popis umístění | `menu-purpose` | text | ne | ne | — | Kde se na webu vykresluje |

Nabídky jsou dvě a zakládají se nasazením, ne redakcí: **Hlavní menu** a **Servisní
pruh**. Přidání třetí nabídky je změna kódu, protože ji musí umět vykreslit frontend.

### 2.2 Entita `menuItem` (položka)

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Popisek v menu | `nav-label` | text | **ano** | ano | — | |
| Kam odkaz vede | `nav-target` | enum + hodnota | **ano** | ne | nevybráno | Viz 2.3 |
| Otevřít v novém okně | `nav-new_window` | bool | **ano** | ne | ne | Nabízí se jen u externího odkazu |
| Nabídka | `nav-menu_id` | ref → `menu` | **ano** | ne | — | |
| Nadřazená položka | `nav-parent_id` | ref → `menuItem` | ne | ne | — | `null` = první úroveň |
| Pořadí | `nav-order` | int | **ano** | ne | poslední | Mezi sourozenci |

### 2.3 Cíl odkazu

Typ cíle a cíl samotný je **jedno rozhodnutí, ne dvě**: redakce nevolí „typ", volí
stránku. Typ se z volby odvodí.

| Kód typu | Popisek | Co se ukládá | Odolnost |
|---|---|---|---|
| `page` | Stránka | ID stránky | Přežije změnu adresy stránky |
| `module` | Výpis modulu | Klíč modulu (`events`, `tours`, `area`, `galleries`, `news`, `products`, `education`, `grants`, `positions`, `faq`) | Přežije změnu routingu |
| `url` | Externí odkaz | Absolutní adresa | — |

Položka bez cíle se **uloží**, ale hlásí se jako neúplná — na webu by odkaz nikam nevedl.

## 3. Stavy a životní cyklus

Modul nemá publikační stav. Položka je v menu, nebo v něm není; skrývání se neřeší.
Hloubka menu je omezená na **dvě úrovně** — hlubší se na webu neovládá myší ani na
mobilu. Zanoření třetí úrovně formulář ani API nepovolí.

## 4. Obrazovky a UI

Jedna obrazovka (`/admin/navigation`) se záložkou na každou nabídku.

- Strom položek; přetažením nad řádek se položka zařadí před/za, doprostřed se zanoří.
- U položky je vidět **popisek** a pod ním **kam vede** — nebo oranžové „chybí cíl".
- Počet neúplných položek je na záložce nabídky.
- Rozbalením řádku se edituje popisek a cíl.
- Podpoložku lze přidat přímo z řádku nadřazené položky.

Jazykový přepínač je v hlavičce a přepíná popisky napříč celým stromem. Položka bez
překladu v aktivní mutaci se označí.

## 5. Akce a workflow

Přidat položku, přejmenovat, změnit cíl, přeskládat a zanořit přetažením, odebrat.
Odebráním položky s podpoložkami se **podpoložky posunou o úroveň výš** — nemažou se.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Zanoření hlouběji než dvě úrovně | Nepovoleno; přetažení doprostřed se změní na „za" |
| Položka nemůže být vlastním rodičem ani potomkem | Vynucuje přetahování i API |
| Cíl = stránka, která byla smazána | Položka zůstane a hlásí se jako neúplná |
| Externí odkaz | Otevírá se v novém okně, pokud redakce neurčí jinak |

## 7. Číselníky, notifikace, integrace

### 7.1 Cíle typu „výpis modulu"
`Kalendář akcí` · `Prohlídky` · `Areál — mapa a objekty` · `Galerie` · `Aktuality` ·
`E-shop` · `Vzdělávací programy` · `Dotační projekty` · `Kariéra — volné pozice` ·
`Časté dotazy`. Seznam je uzavřený a rozšiřuje se nasazením.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se cíl smaže |
|---|---|---|---|
| Odkaz → stránka | **tento modul** | `nav-target` | Položka zůstane bez cíle a hlásí se jako neúplná |
| Odkaz → výpis modulu | **tento modul** | `nav-target` | — |

Stránka **neurčuje**, jestli je v menu — to řídí tenhle modul *(rozhodnutí 00/49)*.
Dřívější pole `allowMenu` u stránky bylo zrušeno.

Přepínač jazyků a vyhledávání v hlavičce jsou pevné prvky frontendu a nenastavují se tu.
Pruh nad menu má vlastní modul 10.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 11-1 | Změna adresy stránky nerozbije položku menu, která na ni odkazuje. |
| 11-2 | Položka bez cíle se uloží a ve výpisu se hlásí jako neúplná; počet neúplných je vidět na záložce nabídky. |
| 11-3 | Přetažením se změní pořadí i zanoření; třetí úroveň nejde vytvořit. |
| 11-4 | Odebrání položky s podpoložkami je posune o úroveň výš, nesmaže je. |
| 11-5 | Položka bez překladu v aktivní mutaci se v administraci označí. |

## Otevřené otázky

Modul nemá otevřené otázky.
