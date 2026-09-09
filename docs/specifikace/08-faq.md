# Modul: FAQ

> Entita `faq`. Cesta `/admin/faq`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize.

## 1. Účel a role

- Často kladené dotazy členěné do kategorií. Na webu je z nich rozbalovací seznam.
- Používá redaktor s oprávněním `faq`.

## 2. Datový model a pole

Kromě polí níže má entita společná pole podle [README](README.md#publikování).

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Dotaz | `faq-question` | text | **ano** | ano | — | |
| Odpověď | `faq-answer` | richtext | ano, když zveřejněno | ano | — | Odstavce, odkazy, seznamy |
| Kategorie | `faq-category` | enumOpen | **ano** | ne | Vstupenky a rezervace | Číselník 7.1, lze vytvořit vlastní |
| Pořadí | `faq-order` | int | **ano** | ne | poslední | V rámci kategorie, mění se přetažením |

Dotaz patří **do jedné kategorie**. Vícenásobné zařazení se nezavádí — návštěvník hledá
téma, ne průnik.

## 3. Stavy a životní cyklus

Publikační stav podle [README](README.md#publikování). Modul nemá časové okno —
dotaz je buď zveřejněný, nebo koncept.

## 4. Obrazovky a UI

### Seznam (`/admin/faq`)

Dotazy seskupené po kategoriích, uvnitř v pořadí `faq-order`.

- **Sloupce:** Dotaz (s náhledem odpovědi) · Kategorie · Jazykové mutace · Akce.
- **Filtr:** kategorie · stav publikace · jazyková mutace.
- **Řádkové akce:** Otevřít · Duplikovat · Smazat.
- **Pořadí:** přetažením řádku v rámci kategorie.
- **Rozbalení:** klik na řádek ukáže odpověď rovnou ve výpisu — redakce nemusí otvírat
  detail, aby zkontrolovala znění.

### Detail (`/admin/faq/:id/edit`)

Jedna obrazovka bez záložek: dotaz, odpověď, kategorie. Pravý panel: publikace.

## 5. Akce a workflow

CRUD dotazů, přetahování pořadí, zveřejnění a stažení z webu. Kategorie se zakládá
zadáním nové hodnoty u dotazu — samostatný číselníkový výpis modul nemá.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Dotaz bez odpovědi | Nejde zveřejnit |
| Kategorie bez zveřejněného dotazu | Na webu se nezobrazí |
| Smazání posledního dotazu v kategorii | Kategorie zmizí z webu, v číselníku zůstane |

## 7. Číselníky, notifikace, integrace

### 7.1 Kategorie

| Kód | Popisek |
|---|---|
| `tickets` | Vstupenky a rezervace |
| `hours` | Otevírací doba |
| `transport` | Doprava a parkování |
| `tours` | Prohlídky |
| `program` | Akce a program |
| `services` | Služby a zázemí |

Otevřený číselník — vlastní kategorii smí redakce vytvořit; ukládá se jako text bez kódu
a barvu dostane z palety.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná.

## 8. Vazby na jiné moduly

Modul nemá vazby na jiné entity. Odkaz „Časté dotazy" v menu a v patičce míří na výpis
modulu (moduly 11 a 12).

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 08-1 | Dotaz bez odpovědi nejde zveřejnit. |
| 08-2 | Přetažením se změní pořadí dotazů uvnitř kategorie a projeví se na webu. |
| 08-3 | Kategorie, ve které není žádný zveřejněný dotaz, se na webu nezobrazí. |
| 08-4 | Klik na řádek ve výpisu ukáže odpověď bez otevření detailu. |

## Otevřené otázky

Modul nemá otevřené otázky.
