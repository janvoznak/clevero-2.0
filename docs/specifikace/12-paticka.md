# Modul: Patička

> Entita `footer` (jeden záznam). Cesta `/admin/footer`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** souvisí s nálezem `04/08` a rozhodnutím `00/49`.

## 1. Účel a role

- Obsah patičky webu — sloupce odkazů, text o organizaci, kontakt, sociální sítě,
  odběr novinek, loga partnerů a spodní řádek.
- Používá redaktor s oprávněním `footer`.
- **Jeden záznam**, ne výpis.

Odkazy používají **stejný model cíle jako Navigace** (odkaz na entitu, ne hotová adresa),
takže se nerozbijí při změně slugu.

## 2. Datový model a pole

### 2.1 Sloupce odkazů

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Nadpis sloupce | `footer-column_heading` | text | ne | ano | — | Prázdný = sloupec bez nadpisu |
| Popisek odkazu | `footer-link_label` | text | **ano** | ano | — | |
| Kam odkaz vede | `footer-link_target` | enum + hodnota | **ano** | ne | nevybráno | Stejný výběr jako v modulu 11 |
| Otevřít v novém okně | `footer-link_new_window` | bool | **ano** | ne | ne | Nabízí se jen u externího odkazu |

Sloupců může být, kolik si redakce udělá; pořadí sloupců i odkazů se mění tlačítky.
Sloupec je obsahová věc, ne strukturní — nadpis je proto volitelný.

### 2.2 Organizace a kontakt

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Text pod logem | `footer-about` | textarea | ne | ano | — | Dvě věty o organizaci |
| Telefon | `footer-phone` | phone | ne | ne | — | Na webu odkaz `tel:` |
| E-mail | `footer-email` | email | ne | ne | — | Na webu odkaz `mailto:` |

### 2.3 Sociální sítě

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Ikona | `footer-social_icon` | enum | **ano** | ne | Web / ostatní | Číselník 7.1 |
| Název sítě | `footer-social_name` | text | **ano** | ne | — | Pro popisek a přístupnost |
| Adresa | `footer-social_url` | url | **ano** | ne | — | |

### 2.4 Odběr novinek

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Zobrazovat přihlášení | `footer-newsletter` | bool | **ano** | ne | ano | |
| Text u formuláře | `footer-newsletter_text` | text | ne | ano | — | |

Souhlas se zpracováním údajů je **pevnou součástí** formuláře, nevypíná se.
Kam se přihlášky odesílají, je mimo rozsah dodávky — napojení na e-mailing se neřeší.

### 2.5 Partneři

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název partnera | `footer-partner_name` | text | **ano** | ne | — | |
| Logo | `footer-partner_logo` | image | ne | ne | — | Bez loga se zobrazí název |
| Adresa | `footer-partner_url` | url | ne | ne | — | Nepovinná |

Web dnes ukazuje přes šedesát log — evidence je proto prostý seznam, ne galerie:
přidat partnera musí být otázka na dvě políčka.

### 2.6 Spodní řádek

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Copyright | `footer-copyright` | text | ne | ano | — | Rok doplní web automaticky |

Odkaz na správu cookies je pevná součást spodního řádku — vyžaduje ho zákon, proto se
nevypíná.

## 3. Stavy a životní cyklus

Modul nemá stavy. Patička je na webu vždy; skrývá se jen to, co není vyplněné.

## 4. Obrazovky a UI

Jedna obrazovka (`/admin/footer`) se třemi záložkami: **Sloupce odkazů** ·
**Kontakt a sítě** · **Partneři**. Počet neúplných odkazů je na záložce sloupců.

Jazykový přepínač v hlavičce přepíná popisky a texty napříč záložkami.

## 5. Akce a workflow

Přidat a odebrat sloupec, přesunout sloupec doleva/doprava, přidat a odebrat odkaz,
posunout odkaz nahoru/dolů, přidat a odebrat síť i partnera. Uložení je jedno pro
celou patičku.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Odkaz bez cíle | Uloží se, hlásí se jako neúplný, na webu se nezobrazí |
| Sloupec bez odkazů | Na webu se nezobrazí |
| Partner bez loga | Zobrazí se název jako text |
| Odběr novinek vypnutý | Blok na webu není, text zůstane uložený |

## 7. Číselníky, notifikace, integrace

### 7.1 Ikony sociálních sítí

| Kód | Popisek |
|---|---|
| `facebook` | Facebook |
| `video` | YouTube / video |
| `image` | Instagram / foto |
| `chat` | Síť s diskusí |
| `globe` | Web / ostatní |
| `share` | Sdílení |

Síť bez vlastní ikony dostane obecný glóbus.

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná. Odběr novinek se odesílá mimo tento systém.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se cíl smaže |
|---|---|---|---|
| Odkaz → stránka | **tento modul** | `footer-link_target` | Odkaz zůstane bez cíle a hlásí se jako neúplný |
| Odkaz → výpis modulu | **tento modul** | `footer-link_target` | — |

Stránka **neurčuje**, ve kterém sloupci patičky je — to řídí tenhle modul
*(rozhodnutí 00/49)*. Dřívější pole `allowFooter` u stránky bylo zrušeno.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 12-1 | Změna adresy stránky nerozbije odkaz na ni v patičce. |
| 12-2 | Odkaz bez cíle se v administraci hlásí jako neúplný a na webu se nezobrazí. |
| 12-3 | Sloupec bez odkazů se na webu nezobrazí. |
| 12-4 | Vypnutý odběr novinek zmizí z webu a jeho text zůstane uložený. |
| 12-5 | Partner bez nahraného loga se v patičce zobrazí jako název. |

## Otevřené otázky

Modul nemá otevřené otázky. Kam se odesílají přihlášky k odběru novinek, je mimo rozsah
dodávky.
