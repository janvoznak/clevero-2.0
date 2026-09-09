# Modul: Kontakty

> Entita `contacts` (jeden záznam). Cesta `/admin/contacts`. Sekce **Obsah**.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize.

## 1. Účel a role

- Údaje organizace (sídlo, IČO, bankovní spojení) a kontaktní skupiny na stránce
  Kontakty.
- Používá redaktor s oprávněním `contacts`.
- **Jeden záznam**, ne výpis — organizace má jednu identitu.

## 2. Datový model a pole

### 2.1 Identita a sídlo

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název organizace | `contacts-name` | text | **ano** | ne | — | Právní název se nepřekládá |
| Doplněk názvu | `contacts-tagline` | text | ne | ano | — | |
| Ulice a číslo | `contacts-street` | text | **ano** | ne | — | |
| Město | `contacts-city` | text | **ano** | ne | — | |
| PSČ | `contacts-zip` | text | **ano** | ne | — | |
| Odkaz na mapu | `contacts-map_url` | url | ne | ne | — | Na webu z něj je tlačítko „Navigovat" |

### 2.2 Spojení

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| E-mail | `contacts-email` | email | **ano** | ne | — | Obecný kontakt organizace |
| Telefon | `contacts-phone` | phone | **ano** | ne | — | |

### 2.3 Identifikační a fakturační údaje

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| IČO | `contacts-reg_no` | text | **ano** | ne | — | |
| DIČ | `contacts-vat_no` | text | ne | ne | — | |
| Bankovní spojení | `contacts-bank_account` | text | ne | ne | — | Číslo účtu a kód banky |
| Banka | `contacts-bank_name` | text | ne | ne | — | |
| ID datové schránky | `contacts-data_box` | text | ne | ne | — | |
| Zápis v rejstříku | `contacts-registry` | text | ne | ano | — | Větný text, proto vícejazyčný |

Údaje se **nepřekládají** kromě zápisu v rejstříku — jsou to čísla a vlastní jména.

### 2.4 Skupiny kontaktů

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Název skupiny | `group-name` | text | **ano** | ano | — | |
| Popis | `group-description` | text | ne | ano | — | Věta pod nadpisem skupiny |
| Čím je skupina naplněná | `group-kind` | enum | **ano** | ne | Lidé | Číselník 7.1 |
| E-mail skupiny | `group-email` | email | ne | ne | — | Jen u skupiny lidí |
| Telefon skupiny | `group-phone` | phone | ne | ne | — | Jen u skupiny lidí |
| Zobrazovat skupinu | `group-published` | bool | **ano** | ne | ano | Skrytá schová i obsah |
| Objekty | `group-venue_ids` | refList → `venue` | ano, když typ = objekty | ne | prázdné | Údaje se zrcadlí z Areálu |

Kontakt na celou skupinu (`pronajem@`) má smysl vedle lidí — část návštěvníků nechce
psát konkrétnímu člověku.

### 2.5 Osoba ve skupině

| Pole | name | Typ | Povinné | ML | Výchozí | Poznámka |
|---|---|---|---|---|---|---|
| Jméno a příjmení | `person-name` | text | **ano** | ne | — | |
| Pozice | `person-role` | text | ne | ano | — | Podle ní si návštěvník vybírá |
| E-mail | `person-email` | email | ne | ne | — | |
| Telefon | `person-phone` | phone | ne | ne | — | |
| Poznámka | `person-note` | text | ne | ano | — | Čemu se věnuje, kdy je k zastižení |
| Fotka | `person-photo` | image | ne | ne | — | Bez fotky se zobrazí monogram |
| Zobrazovat osobu | `person-published` | bool | **ano** | ne | ano | Skrytá zůstane uložená |

### 2.6 Pole, která modul vědomě nemá

| Co | Proč |
|---|---|
| Otevírací doba | Patří objektu v Areálu (modul 02); skupina typu „objekty" ji zrcadlí |
| Kontakt na objekt | Vlastníkem je objekt (modul 02) |
| Přepínač „jeden seznam osob / skupiny" | Kontakty DOV mají čtyři skupiny a jinak než po skupinách se stránka číst nedá |

## 3. Stavy a životní cyklus

Modul nemá publikační stav pro celý záznam. Viditelnost se řídí na úrovni skupiny a
osoby a **dědí se**: skrytá skupina schová i lidi v ní.

## 4. Obrazovky a UI

Jedna obrazovka (`/admin/contacts`) se dvěma záložkami:

| Záložka | Obsah |
|---|---|
| Organizace | Identita, sídlo, spojení, identifikační a fakturační údaje |
| Skupiny kontaktů | Skupiny, v nich lidé nebo vybrané objekty |

U skupiny typu „objekty" se pod výběrem zobrazí **read-only přehled** toho, co web ukáže:
název, e-mail, telefon a provozní stav každého objektu. Objekt bez vyplněného kontaktu
se označí.

## 5. Akce a workflow

Přidat a odebrat skupinu, posunout skupinu nahoru/dolů, přepnout typ skupiny,
přidat a odebrat osobu, posunout osobu, skrýt skupinu i osobu. Uložení je jedno pro
celý záznam.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Skupina typu „objekty" bez vybraných objektů | Na webu se nezobrazí |
| Objekt ve skupině bez e-mailu i telefonu | Administrace to hlásí; na webu se ukáže jen název a otevírací doba |
| Skrytá skupina | Schová i lidi a objekty v ní |
| Osoba bez e-mailu i telefonu | Uloží se; na webu je jen jméno a pozice |

## 7. Číselníky, notifikace, integrace

### 7.1 Typ skupiny
| Kód | Popisek | Obsah |
|---|---|---|
| `people` | Lidé | Jména a kontakty zadané ručně |
| `venues` | Objekty z Areálu | Vybrané objekty; otevírací doba i kontakt se zrcadlí z modulu 02 |

### 7.2 Notifikace
Modul neposílá žádné.

### 7.3 Integrace
Žádná.

## 8. Vazby na jiné moduly

| Vazba | Vlastník | Pole | Když se objekt smaže |
|---|---|---|---|
| Skupina → objekty | **tento modul** | `group-venue_ids` | Objekt zmizí ze skupiny |

Otevírací dobu ani kontakt objektu modul **needituje** — vlastníkem je Areál (modul 02).

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 13-1 | Změna otevírací doby objektu v Areálu se projeví na stránce Kontakty bez zásahu v tomto modulu. |
| 13-2 | Změna e-mailu objektu v Areálu se projeví ve skupině objektů bez opsání. |
| 13-3 | Skrytá skupina schová na webu i lidi, kteří do ní patří. |
| 13-4 | Objekt bez vyplněného kontaktu se v administraci označí. |
| 13-5 | Osoba bez fotky se na webu zobrazí s monogramem, ne s prázdným místem. |

## Otevřené otázky

Modul nemá otevřené otázky.
