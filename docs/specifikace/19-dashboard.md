# Modul: Dashboard

> Bez vlastní entity. Cesta `/admin/dashboard`. Úvodní obrazovka administrace.
> Společné konvence jsou v [README.md](README.md) a tady se neopakují.
> **Revize:** modul nebyl součástí revize.

## 1. Účel a role

- Úvodní obrazovka. Odpovídá na jedinou otázku: **co mám dnes udělat.**
- Vidí ji každý přihlášený uživatel, včetně toho bez oprávnění na obsahové moduly.

Dashboard **nic needituje ani nezakládá**. Je to rozcestník a hlídač: agreguje
z ostatních modulů to, co vyžaduje pozornost, a odkazuje tam, kde se to řeší.

## 2. Datový model a pole

Modul **nemá vlastní entitu**. Vše se dopočítává z ostatních modulů při každém načtení.

| Blok | Zdroj | Co ukazuje |
|---|---|---|
| Vyžaduje pozornost | 05 E-shop, 16 Kariéra, 06 Prohlídky, 15 Dotační projekty | Produkty bez popisu, nové přihlášky, prohlídky bez napojení na Colosseum, projekty s prošlým termínem |
| Provoz budov | 02 Areál, 01 Kalendář akcí | Objekty zavřené nebo obsazené akcí, s odkazem na tu akci |
| Klíčová čísla | 06 Prohlídky, 05 E-shop | Prodané vstupenky, tržba, návštěvnost — vždy s porovnáním proti minulému období |
| Kalendář akcí | 01 Kalendář akcí | Nejbližší akce |
| Naposledy vytvořeno | všechny obsahové moduly | Posledních několik záznamů s autorem a časem |
| Stáří dat z Colossea | integrace | Kdy proběhl poslední úspěšný import; při selhání upozornění |

## 3. Stavy a životní cyklus

Modul nemá stavy ani záznamy.

## 4. Obrazovky a UI

Jedna obrazovka. Skladba shora dolů:

1. **Rychlé akce** — tlačítka na nejčastější úkony (nová akce, nová aktualita).
2. **Vyžaduje pozornost** — jen to, co má někdo dořešit. Když není nic, blok zmizí;
   prázdný blok „vše v pořádku" je šum.
3. **Provoz budov** — objekty a jejich dnešní stav.
4. **Klíčová čísla** — dlaždice s číslem, změnou proti minulému období a mikrografem.
5. **Kalendář akcí** a **Naposledy vytvořeno** — dva sloupce.

**Každá dlaždice a řádek je odkaz** do modulu, kde se věc řeší. Dashboard není místo,
kde se něco vyřeší, ale kde se to najde.

Uživatel vidí **jen bloky z modulů, na které má oprávnění**. Redaktor bez oprávnění na
e-shop nevidí produkty bez popisu.

## 5. Akce a workflow

Žádné vlastní akce kromě rychlých odkazů na zakládání záznamů v jiných modulech.

## 6. Byznys pravidla, výpočty a validace

| Pravidlo | Chování |
|---|---|
| Blok bez obsahu | Nezobrazí se |
| Blok z modulu bez oprávnění | Nezobrazí se, ani prázdný |
| Klíčová čísla | Vždy s porovnáním proti stejně dlouhému předchozímu období |
| Data z Colossea | Vždy s časem posledního úspěšného importu |
| Výpočet | Při každém načtení; nic se necachuje déle než 5 minut |

## 7. Číselníky, notifikace, integrace

Modul nemá číselníky a neposílá notifikace — je **cílem** dashboardových upozornění
z jiných modulů (selhání importu z Colossea, viz [README](README.md#notifikace)).

## 8. Vazby na jiné moduly

Dashboard **čte ze všech modulů a needituje žádný**. Nemá vlastní vazby; při smazání
zdrojového záznamu prostě zmizí z příslušného bloku.

## 9. Akceptační kritéria

| # | Kritérium |
|---|---|
| 19-1 | Redaktor bez oprávnění na e-shop nevidí na dashboardu blok o produktech bez popisu. |
| 19-2 | Blok „Vyžaduje pozornost" se nezobrazí, když není nic k dořešení. |
| 19-3 | Klik na položku v kterémkoli bloku otevře záznam v příslušném modulu. |
| 19-4 | Objekt obsazený akcí se zobrazí v přehledu provozu budov s odkazem na tu akci. |
| 19-5 | Klíčová čísla ukazují u každé veličiny změnu proti minulému období. |
| 19-6 | Při selhání importu z Colossea dashboard uvede, kdy proběhl poslední úspěšný import. |

## Otevřené otázky

Modul nemá otevřené otázky.
