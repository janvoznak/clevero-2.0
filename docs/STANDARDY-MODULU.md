# Clevero 2.0 — Standardy a postupy pro tvorbu modulů (UI prototyp)

> Tento dokument definuje závazné konvence pro **UI prototyp** administrace Clevero 2.0.
> Cílem je, aby se u každého dalšího modulu neopakovala stejná rozhodnutí — vše, co je tu popsané, platí automaticky.
>
> **Referenční implementace:** modul **Aktuality** (`src/views/news/`). Když si nejste jistí, jak něco udělat, podívejte se, jak je to vyřešené tam.

---

## 0. Řídící princip — VIZUÁLNÍ PROTOTYP, ne funkční CMS

> **Cílem je rychlý a levný vizuální prototyp. Neprogramuj funkce, logiku ani integrace.**

Toto pravidlo má přednost před vším ostatním. Konkrétně:

- **Žádné reálné funkce a integrace.** Data jsou mock, ukládání/mazání/nahrávání/odesílání jsou předstírané (lokální stav nebo vůbec nic). Žádné API, DB, autentizace, síťová volání.
- **3rd-party komponenty = nefunkční vizuální zástupka.** Když specifikace řekne „sem patří ContentBuilder.js / CKEditor / mapa / kalendář / …", **NEPROPOJUJ je**. Vlož jen statickou napodobeninu, která vypadá jako výsledek. Dvě přípustné techniky:
  1. **Stylovaná statická napodobenina** (HTML/Tailwind blok, který vypadá jako toolbar + plátno dané komponenty) — viz `RichTextEditor.vue` jako vzor.
  2. **Screenshot / obrázek** té komponenty vložený jako `<img>` (rychlejší, když je věrnost důležitější než interakce).
- **Chování implementuj jen tam, kde je potřeba předvést UX**, ne aby reálně fungovalo: přepnutí jazykové mutace, otevření dialogu/dropdownu, filtr nad mock daty, drag&drop v galerii. Vše ostatní je vizuální.
- **Když váháš „mám to naprogramovat?", odpověď je NE** — vlož zástupku, přidej `// prototyp — nefunkční` a jdi dál.
- Míra realističnosti: dost na to, aby to na první pohled vypadalo jako hotový produkt; ani o řádek víc.

Viz i sekce [Co je jen prototyp](#co-je-jen-prototyp).

---

## 0b. Komponentová jednotnost — jeden prvek = jedna komponenta

> **Každý opakující se UI prvek je jedna sdílená Vue komponenta (vizuálně navázaná na Reka UI). Nikdy se nestyluje ad-hoc podruhé.**

Ostrý CMS se bude skládat z Vue komponent nad Reka UI — a prototyp má tuto strukturu **předjímat**, aby byl vizuál i chování jednotné napříč moduly už teď.

- Objeví-li se prvek podruhé (tlačítko, select, chip, odznak, karta, dialog, pole…), **použij existující komponentu**, nebo ji vytvoř do `components/ui/` (univerzální) / `components/admin/` (administrace). **Zákaz kopírovat a znovu stylovat** stejný prvek jinými třídami.
- Vizuál a varianty řídí komponenta (props), ne místo použití. Změna vzhledu prvku = jedna změna v komponentě → propíše se všude.
- Než začneš psát nový blok tříd, zeptej se: *„Není tohle prvek, který má být komponenta?"* Když ano → komponenta.
- Sdílené primitivy zatím: `AppButton`, `AppSelect`, `Icon`, `TagChip`, `TagPicker`, `FormSection`, `GalleryManager`, `AttachmentsManager`, `RichTextEditor` (viz [sekce 5](#5-sdílené-komponenty-api)). Seznam roste — přidávej, nekopíruj.
- **Kandidáti k vytažení do komponenty** (dnes ještě inline, sjednotit při dalším výskytu): stavový odznak (`StatusBadge`), datumový rozsah OD–DO, prázdný stav (`EmptyState`).

---

## 1. Tech stack

| Vrstva | Volba | Pozn. |
|---|---|---|
| Framework | **Vue 3** (`<script setup lang="ts">`) | Composition API, TypeScript |
| Build | **Vite 6** | dev na portu **5180** |
| Styly | **Tailwind CSS v4** (CSS-first, `@theme` v `src/style.css`) | žádný `tailwind.config.js` |
| Komponenty | **Reka UI** (`reka-ui`) | headless primitivy — viz [sekce 4](#4-reka-ui--závazné-pravidlo) |
| Router | **vue-router 4** | |
| Ikony | vlastní `Icon.vue` (inline SVG) | žádná externí ikon-knihovna |
| Fonty | Archivo / Inter / IBM Plex Mono (Google Fonts v `index.html`) | |

**Spuštění:**
```bash
npm install
npm run dev          # http://localhost:5180
npx vue-tsc -b       # typová kontrola (musí projít bez chyb)
```

Před dokončením modulu vždy: `vue-tsc` bez chyb + vizuální kontrola v prohlížeči + čistá konzole.

---

## 2. Struktura projektu

```
src/
├─ main.ts                 # router + registrace routes
├─ style.css               # @theme design tokeny (JEDINÝ zdroj barev/fontů)
├─ App.vue                 # jen <RouterView/>
├─ layouts/
│  └─ AdminLayout.vue      # shell: sidebar + topbar + <main><RouterView/></main>
├─ components/
│  ├─ admin/               # stavební bloky administrace (sdílené napříč moduly)
│  │  ├─ AppSidebar.vue
│  │  ├─ AppTopbar.vue
│  │  ├─ FormSection.vue
│  │  ├─ GalleryManager.vue
│  │  ├─ AttachmentsManager.vue
│  │  └─ RichTextEditor.vue
│  └─ ui/                  # univerzální UI primitivy (napříč celým systémem)
│     ├─ AppButton.vue
│     ├─ AppSelect.vue
│     └─ Icon.vue
├─ data/
│  ├─ types.ts             # sdílené typy (LangCode, ML, …)
│  └─ mock<Modul>.ts       # mock data + helpery daného modulu
└─ views/
   └─ <modul>/             # obrazovky modulu
      ├─ <Modul>List.vue
      └─ <Modul>Edit.vue
```

**Pravidlo umístění:**
- Prvek použitelný **kdekoli** (tlačítko, select, ikona) → `components/ui/`.
- Prvek specifický pro **administraci/obsahové moduly** (galerie, přílohy, sekce formuláře) → `components/admin/`.
- Obrazovka konkrétního modulu → `views/<modul>/`.
- Mock data + odvozovací helpery → `data/mock<Modul>.ts`.

---

## 3. Design systém (tokeny)

Všechny barvy a fonty jsou **výhradně** v `src/style.css` v bloku `@theme`. Nikdy nepiš hex hodnoty přímo do komponent — používej Tailwind třídy odvozené z tokenů (`bg-brand-500`, `text-steel-500`…).

### Barvy
| Skupina | Rozsah | Použití |
|---|---|---|
| `graphite-600…950` | tmavá ocel | tmavé texty, tmavé plochy, avatary |
| `steel-50…600` | studená šeď | plátno (`steel-50`), okraje (`steel-200`), sekundární text (`steel-500`) |
| `brand-50…900` | **značková oranžová `#EE703D`** (z loga) | **jediná primární CTA barva**, akcenty, focus, aktivní stavy |
| `sidebar-top/bottom` | terakota gradient | výhradně pozadí levého panelu |
| `forge-500/600` | ocelová zelená | stavová sémantika „úspěch/publikováno" — **NE tlačítka** |
| `amber-500` | jantar | stav „naplánováno / upozornění" |
| `danger-500/600` | červená | destruktivní akce (mazání) a chyby |

### Typografie
| Token | Font | Použití |
|---|---|---|
| `font-display` | **Archivo** | nadpisy stránek/sekcí (`font-700`/`800`, `tracking-tight`) |
| `font-sans` | **Inter** | veškerý UI text, formuláře, tabulky |
| `font-mono` | **IBM Plex Mono** | identifikátory, cesty, **field-tagy**, počty, datum-kódy |

### Rádiusy
`rounded-md` (6px) pro pole/tlačítka/karty, `rounded-lg` (10px) pro větší kontejnery/dropdowny, `rounded-xl` pro dialogy.

### Focus
Focus ring je globálně `2px solid brand-500` (viz `*:focus-visible` v `style.css`). Interaktivní komponenty přidávají `focus-visible:ring-4 focus-visible:ring-brand-500/15`.

---

## 4. Reka UI — závazné pravidlo

> **Kdykoli Reka UI nabízí primitiv pro daný interaktivní prvek, MUSÍ se použít.** Nestav vlastní dropdown/dialog/tab/checkbox „na koleni".

Mapa primitivů (co je ověřené a používané):

| Potřeba | Reka primitiv |
|---|---|
| Rozbalovací menu (uživatel, workspace, akce) | `DropdownMenu*` |
| Výběr z možností (filtry, formulářové selecty) | `Select*` → obalené v `AppSelect.vue` |
| Přepínač záložek / segmentů (jazykové mutace) | `Tabs*` (řízené přes `:model-value` + `@update:model-value`) |
| Stránkování | `Pagination*` |
| Modální potvrzení | `Dialog*` |
| Zaškrtávátko (výběr řádků) | `Checkbox*` |
| Bublinová nápověda u ikon | `Tooltip*` (obalit `TooltipProvider`) |
| Přepínač formátování (editor) | `ToggleGroup*` |

**Výjimky (nativní HTML je správně):**
- `<input>`, `<textarea>`, `<input type="date/datetime-local">`, `<input type="file">` — Reka pro ně primitiv nemá.
- `<button>` — Reka Button neexistuje → používej **`AppButton`** (viz níže).

**Vzor pro řízený Reka prvek s typovaným v-modelem** (kvůli TS):
```vue
<TabsRoot :model-value="activeLang" @update:model-value="(v) => (activeLang = v as LangCode)">
```

---

## 5. Sdílené komponenty (API)

### `ui/AppButton.vue` — jediný zdroj tlačítek
Barvu/vizuál **nikdy** neurčuj ad-hoc třídami v místě použití. Vždy `AppButton` + `variant`.

```vue
<AppButton variant="primary">…</AppButton>
```
| prop | hodnoty | default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `danger` \| `ghost` | `primary` |
| `size` | `sm` \| `md` | `md` |

- **primary** = značková oranžová → **všechny hlavní CTA** (Uložit, Nový záznam, Vygenerovat…).
- **secondary** = bílá s obrysem → Zrušit, doplňkové akce.
- **danger** = červená → potvrzení mazání.
- **ghost** = bez pozadí → nenápadné akce.

`@click`, `:disabled`, `type` se předávají nativně (atributy propadnou na `<button>`).

### `ui/AppSelect.vue` — filtry a selecty (nad Reka `Select`)
```vue
<AppSelect v-model="filterStatus" :options="statusOptions" placeholder="Vyberte…" />
```
`options: { value: string; label: string }[]`. Používej pro každý výběr z pevné množiny.

### `ui/Icon.vue` — ikony
```vue
<Icon name="news" :size="18" />
```
Ikony jsou inline SVG stroke (feather-styl). **Nová ikona = přidat cestu do mapy `paths` v `Icon.vue`**, ne importovat knihovnu. Barva se dědí přes `currentColor`.

### `admin/FormSection.vue` — karta sekce formuláře
```vue
<FormSection title="Základní informace" icon="news" hint="…" tag="ML">…</FormSection>
```
Každá logická skupina polí v editaci = jedna `FormSection`. `tag` zobrazí mono štítek (např. `ML`, `news-gallery`).

### `admin/GalleryManager.vue` a `admin/AttachmentsManager.vue`
Znovupoužitelné pro jakýkoli obsahový modul s galerií / přílohami (`v-model`). Galerie řeší drag&drop řazení + hlavní obrázek (hvězda). Přílohy jsou per-jazyk.

### `admin/RichTextEditor.vue`
Placeholder WYSIWYG (`v-model`). Zastupuje CKEditor — viz [prototyp](#co-je-jen-prototyp). Obsahuje i AI „Napsat s AI".

### `admin/TagPicker.vue` + `ui/TagChip.vue`
Výběr štítků (`v-model="string[]"`, prop `options: Tag[]`) — hledání v předdefinovaných + vytvoření nového. `TagChip` = zobrazení jednoho štítku (barva + label, volitelně `removable`). Viz [konvence štítků](#7-konvence-ui-prvků).

---

## 6. Layout a vzory obrazovek

### Shell (`AdminLayout.vue`)
`[ Sidebar (terakota, 256px) ][ Topbar (bílý, 64px) + <main> plátno steel-50 ]`.
Sidebar a topbar jsou **sdílené a hotové** — nový modul se do nich jen zaregistruje přes navigaci.

- **Sidebar** (`AppSidebar.vue`): bílé logo na terakotě, workspace přepínač (Reka DropdownMenu), navigace seskupená do `Přehled / Obsah / Systém`. Aktivní položka = světlý rail + `bg-white/15`. **Nový modul → přidej položku do `groups` v `AppSidebar.vue`.**
- **Topbar** (`AppTopbar.vue`): vlevo velké vyhledávací pole (hlavní prvek), vpravo notifikace + uživatel. **Žádná drobečkovka** — kontext dává sidebar + nadpis stránky. Topbar je bílý (záměrně jiná barva než sidebar).

### List obrazovka (`<Modul>List.vue`) — vzor dle `NewsList.vue`
Plná šířka `px-8 py-6`. Skladba shora dolů:
1. **Hlavička**: mono field-tag entity + cesta, `font-display` nadpis, počet položek, vpravo primární `AppButton` „Nový…".
2. **Filtr** (karta): sada `AppSelect`/date polí + „Zrušit filtry" (zobrazí se jen když je filtr aktivní). **Bez fulltextového pole** — hledání pokrývá globální search v topbaru. Zvaž relevantní atributy: stav, jazyk, datumové okno, řazení.
3. **Bulk action bar**: objeví se při výběru řádků (počet + Zrušit výběr + `AppButton variant="danger"` v Dialogu).
4. **Tabulka**: `Checkbox` (výběr) → náhled+název+meta → datumy → stavový odznak → akce (Náhled/Editace/Smazat jako `Tooltip` ikony). Prázdný stav s ikonou a textem.
5. **Stránkování**: Reka `Pagination` + text „Zobrazeno X–Y z Z".

### Edit/Detail obrazovka (`<Modul>Edit.vue`) — vzor dle `NewsEdit.vue`
Dvousloupcový layout `xl:grid-cols-[minmax(0,1fr)_360px]`, plná šířka `px-8`.
- ⚠️ **Vícejazyčnost je POVINNÁ pro každý obsahový modul** (Aktuality, Kalendář akcí, Blog, Stránky…). Texty určené pro web (název, shrnutí, popis, SEO) jsou vždy `ML` (CZ/EN/DE/PL) — **nikdy nedělej obsahový modul jednojazyčně.** Nejazykové údaje (datum, budova, typ, cena, obrázek) `ML` nejsou. Stejný vzor jako Aktuality: jazykový přepínač `Tabs` v hlavičce + karta „Jazykové mutace" v railu + „Přeložit z CZ přes AI". V seznamu/kalendáři se zobrazuje CZ (`.cs`). Mock data: píšeš jen CZ, `ML` doplní normalizace (`ml()`/`toML()`).
- **Sticky hlavička**: zpět, cesta+nadpis, přepínač **jazykových mutací** (Reka `Tabs`, **pilulkový** styl), `Zrušit` + `Uložit` (`AppButton`).
- **Levý sloupec = obsahové sekce v záložkách** (Reka `Tabs` + `TabsContent`): Základní informace / Fotogalerie / Přílohy / Marketing (SEO)… v jedné kartě. Zkracuje scrollování a zaostřuje pozornost.
  - ⚠️ **Dvě roviny záložek se MUSÍ vizuálně lišit**, aby nevznikla záměna: **jazyk = pilulky** v hlavičce, **sekce = podtržené záložky** na jemném pruhu (`bg-steel-50/60`). Nikdy obojí stejným stylem.
  - Aktivní záložka sekce musí být **dostatečně viditelná**: podbarvení `bg-brand-50` + `text-brand-700` + spodní linka `border-b-2 border-brand-500` (samotné podtržení je málo — snadno se přehlédne).
  - Jazyk je globální (přepíná napříč všemi sekcemi), sekce je lokální (co je vidět). Jsou to ortogonální osy — proto jeden ovladač nahoře + záložky v kartě.
  - Krátký hint + field-tag dej na začátek každého panelu (ne velký nadpis — ten supluje záložka).
- **Pravý rail (sticky)**: karty „Publikace" (stav + datumy), „Jazykové mutace" (přehled vyplněnosti), „Obsah" (souhrny). Zůstává vidět nad rámec záložek — sem patří metadata a přehled úplnosti, ne hlavní obsah. `FormSection` se používá zde.

---

## 7. Konvence UI prvků

- **Stavové odznaky**: pilulka `bg-{color}/10 text-{color}-600` + barevná tečka. Stav se **odvozuje** z dat (u obsahu z časového okna OD–DO), definice v `mock<Modul>.ts` (`STATE_META`). Barvy: forge=aktivní, amber=naplánováno, steel=ukončeno/koncept.
- **Field-tagy (záměrně ponechané, NEODSTRAŇOVAT)**: u každého pole/sekce mono štítek s názvem pole ze specifikace (`news-title · CS`), plus nad H1 technická cesta (`news` + `/admin/news/list`). Vypadají „vývojářsky", ale jsou tam schválně jako **most mezi UI prototypem a pozdější implementací** — vývojář hned vidí, které pole/entita/route co je. I když působí neproklientsky, **nemažte je** (bylo to vědomé rozhodnutí). Až se z prototypu bude stavět ostrý CMS, teprve tehdy se skryjí/nahradí.
- **Toast**: potvrzení asynchronní akce (AI překlad apod.) → krátký tmavý toast dole uprostřed (`fixed bottom-6`), sám zmizí po ~3 s. Ne pro triviální akce.
- **Štítky (tags)**: průřezová kategorizace (ne per-jazyk), pole `tags: string[]` na entitě. Výběr přes `TagPicker` (Reka `Popover`: hledání v předdefinovaných + „Vytvořit nový" **s volbou barvy z palety `TAG_PALETTE` — ~10 barev**). Zobrazení přes `TagChip` = **plný barevný label** (bílý text, hranatý `rounded-md`) v barvě štítku. Předdefinovaný seznam, `TAG_PALETTE` a `tagColor()` v `mock<Modul>.ts`; barvy jsou hex.
  - ⚠️ **Štítek musí vypadat jinak než stavový odznak** (jinak matoucí): stav = jemná pilulka (`rounded-full`, tint + tečka), štítek = plný barevný hranatý label. Nikdy oba stejně.
  - V seznamu ukazuj štítky pod nadpisem; ve formuláři kartou v pravém railu.
- **ML (vícejazyčná) pole**: hodnota per jazyk přes typ `ML = Record<LangCode,string>`. Editují se přes aktivní `Tabs` mutaci (`form.title[activeLang]`). U mutací zobrazuj tečku vyplněnosti (forge = vyplněno).
- **Prázdné stavy**: vždy ikona + nadpis + jedna věta co dělat („Vytvořte první…"). Nikdy prázdná plocha.
- **Datumy**: formátuj přes `toLocaleDateString('cs-CZ', …)`, čas mono a menší.
- **Potvrzení mazání**: vždy Reka `Dialog` s ikonou, nadpisem, popisem nevratnosti a dvojicí `AppButton` (secondary + danger). Nikdy mazat bez potvrzení.

---

## 8. Texty a tón (copywriting)

- **Spisovná čeština**, vykání / neutrální imperativ („Přepněte jazyk", „Nahrát přílohu"). (Pozn.: tykání patří jen chatbotům jako Váňa, ne administraci.)
- **Sentence case** v nadpisech i tlačítkách (ne Title Case).
- Tlačítko říká, co udělá, a stejný název drží celý tok: `Uložit` → toast `Uloženo`.
- Chyby a prázdné stavy = návod, ne omluva; konkrétní, ne obecné.
- Pojmenovávej věci podle toho, co uživatel ovládá, ne podle interní implementace.

---

## 9. Obrázky a média

- Reálné obrázky leží lokálně v `public/images/` (prototyp — obsah je zástupný, na tématu nezáleží).
- Vykresluj přes `<img … class="object-cover">`, ne CSS `background`.
- Přiřazení v mock datech přes deterministický helper (`imageFor(seed)` v `mockNews.ts`).
- Chybějící obrázek → ikon-placeholder (`bg-steel-100` + `Icon name="image"`).

---

## 10. Přístupnost a kvalita (nepodkročitelné minimum)

- Viditelný focus (řeší globální `*:focus-visible`).
- Reka primitivy zajišťují klávesovou obsluhu a ARIA — proto se používají.
- Ikonová tlačítka mají `Tooltip` s popiskem.
- Respektuj `prefers-reduced-motion` (řešeno globálně v `style.css`).
- Responzivita: cílem je desktop admin; layouty se ale slévají do jednoho sloupce pod `xl`.

---

## 11. Co je jen prototyp

Tyto věci **záměrně nejsou** plně funkční a u nových modulů se řeší stejně (placeholder + poznámka v kódu). Platí [řídící princip](#0-řídící-princip--vizuální-prototyp-ne-funkční-cms) — 3rd-party nástroje se vkládají jako nefunkční vizuální zástupka (stylovaná napodobenina nebo screenshot), nikdy se nepropojují:
- **Editor obsahu** — dnes `RichTextEditor` (contenteditable) jako náhrada CKEditoru. Pokud specifikace řekne jiný editor (např. **ContentBuilder.js**), nahradí se jen vizuální zástupka — žádná integrace, žádné skripty té knihovny.
- **Nahrávání souborů** (galerie, přílohy, OG obrázek) — mockované, generuje zástupný obsah.
- **Editor obrázků** — jen tlačítko/tooltip, bez skutečného editoru.
- **Stránkování** — Reka komponenta je funkční, ale dataset je simulovaný (řádky se reálně nestránkují).
- **Náhled na web** — mrtvý odkaz (`#`).
- **Mazání/ukládání** — jen lokální stav, žádné API.
- **AI prvky** — žádná reálná AI (viz níže).

Když přidáváš prototypový prvek, **okomentuj to v kódu** („prototyp — …"), ať je jasné, co je zástupné.

### 11a. AI prvky (prototyp — bez reálné AI)

AI má klientům usnadnit práci; v prototypu je ale vždy jen **UI + předstíraný stav** (`ref` + `setTimeout`, jako SEO auto-generování). Žádné volání modelu, žádné klíče. Zavedené vzory:

- **AI blok (hero)** — větší AI vstup (import z odkazu, composer z promptu…) **vždy přes sdílenou komponentu `AiPanel`** (`components/admin/AiPanel.vue`). Je **defaultně sbalený**, výrazně podbarvený značkovou oranžovou s ikonou `sparkles` v hlavičce → nepřehlédnutelný; klik na hlavičku ho rozbalí. Props: `title`, `hint`, `badge` (default „AI"), `icon`, `defaultOpen`. Obsah = slot. **Nikdy nestavět AI blok ad-hoc** — jen `AiPanel`, ať je vizuál napříč moduly jednotný.
- **Generování textu** — v `RichTextEditor` tlačítko „✨ Napsat s AI" (Reka `Popover`): prompt + `Vygenerovat` (`AppButton`). Po simulovaném běhu vloží zástupný text. Protože je v editoru, funguje ve všech modulech s richtextem.
- **Překlad na klik** — v railu „Jazykové mutace" tlačítko „Přeložit z CZ přes AI": ze zdrojového jazyka (`SOURCE_LANG`) doplní všechny cizí mutace všech ML polí. V prototypu zkopíruje zdroj + potvrdí toastem.
- **Vizuál AI akcí**: značková oranžová + ikona `sparkles`, stav „Generuji…/Překládám…" s `animate-pulse`. Disabled, dokud není co zpracovat (např. prázdná CZ verze).

---

## 12. Datový model — konvence

- Sdílené typy do `data/types.ts` (`LangCode`, `Lang`, `LANGS`, `SOURCE_LANG`, `ML`).
- **Jazyky: CZ (zdroj) + EN, DE, PL.** ML pole = `Record<LangCode,string>` (všechny jazyky přítomné). V mock datech stačí uvést jen některé — zbytek doplní normalizace (`toML` v `mockNews.ts`), takže literály nemusí vypisovat prázdné jazyky.
- Per modul `data/mock<Modul>.ts`: pole `MOCK_<MODUL>`, odvozovací helpery (stav, obrázek) a `STATE_META`.
- Entita = interface s ML poli jako `ML` a kolekcemi (galerie, přílohy) jako pole objektů s `id`.

---

## 13. Postup vytvoření nového modulu (recept)

1. **Přečti specifikaci** modulu (MD ve `/Clevero-2.0/…`). Vytěž: pole (+ které jsou ML), obrazovky, akce, stavy, vazby.
2. **Typy + mock data**: `data/types.ts` (jen nové sdílené typy) + `data/mock<Modul>.ts` (entita, mock záznamy, `STATE_META`, helpery).
3. **Obrazovky**: `views/<modul>/<Modul>List.vue` a `<Modul>Edit.vue` — vyjdi z vzoru Aktualit (zkopíruj strukturu, ne styl ad-hoc).
4. **Routy**: zaregistruj v `main.ts` (`admin/<modul>/list`, `/new`, `/:id/edit`).
5. **Navigace**: přidej položku do `groups` v `AppSidebar.vue` (správná skupina + ikona; případně novou ikonu do `Icon.vue`).
6. **Znovupoužij** `AppButton`, `AppSelect`, `FormSection`, `GalleryManager`, `AttachmentsManager`, `Icon`. Nová sdílená potřeba → komponenta do `ui/` nebo `admin/`, ne kopie.
7. **Kontrola**: `npx vue-tsc -b` bez chyb → dev server → projít list i edit v prohlížeči → čistá konzole.

### Checklist před „hotovo"
- [ ] **Jeden prvek = jedna komponenta** — žádný opakující se prvek není nakopírovaný/přestylovaný ad-hoc (viz [princip 0b](#0b-komponentová-jednotnost--jeden-prvek--jedna-komponenta)).
- [ ] Žádné hex barvy ani ad-hoc tlačítka v šablonách — vše přes tokeny a `AppButton`.
- [ ] Každý interaktivní prvek, pro který Reka má primitiv, ho používá.
- [ ] List: hlavička + filtr (bez fulltextu) + tabulka + stránkování + prázdný stav.
- [ ] Edit: sticky hlavička + jazykové `Tabs` (pilulky) + **sekce v podtržených záložkách** + dvousloupcový layout + pravý rail. Obě roviny záložek vizuálně odlišené.
- [ ] **Obsahový modul je vícejazyčný (ML)** — texty pro web v CZ/EN/DE/PL, jazykové `Tabs` + AI překlad; nejazykové údaje ML nejsou.
- [ ] ML pole se editují per mutace a mají indikátor vyplněnosti.
- [ ] Field-tagy u polí odpovídají názvům ze specifikace.
- [ ] Mazání přes potvrzovací `Dialog`.
- [ ] Prototypové prvky okomentované.
- [ ] Položka v sidebaru, funkční routy, `vue-tsc` čistý, konzole bez chyb.
