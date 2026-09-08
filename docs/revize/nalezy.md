# Revize prototypu administrace — nálezy

Porovnání schváleného frontendu `dolnivitkovice.cz.dev.poski.com` s prototypem administrace (DOV-admin). Stav k 4. 9. 2026.

**94 nálezů v šesti sekcích.** Rozhoduje se o nich v rozhodovacím protokolu (49 rozhodnutí s náhledy web ↔ admin); u každého nálezu je uvedeno, které rozhodnutí ho pokrývá. Tento soubor je podklad pro vývojáře a základ budoucího zadání.

| Sekce | Nálezů | Chybí | Přebývá | Rozpory |
|---|---:|---:|---:|---:|
| 01 Kalendář akcí | 20 | 9 | 7 | 4 |
| 02 Detail budovy | 17 | 8 | 5 | 4 |
| 03 Galerie | 13 | 4 | 5 | 4 |
| 04 Pronájem prostor | 10 | 5 | 2 | 3 |
| 05 E-shop | 14 | 5 | 4 | 5 |
| 06 Prohlídky | 20 | 10 | 5 | 5 |

## 01 — Kalendář akcí

Výpis akcí a detail akce. Dvacet rozdílů mezi schváleným webem a prototypem administrace.

### Chybí v administraci

#### 01/01 — Lineup / účinkující

- **Na webu:** Sekce „Lineup — Kdo bude hrát“: karty s rolí (Kapela · Headliner, Sólo, DJ, Workshop, Perkusní kolektiv), jménem, zemí původu a medailonkem. U festivalu AFROSTRAVA jich je osm.
- **V administraci:** Jediné jednořádkové textové pole „Účinkující / lektoři“ (volný text).
- **Dopad:** Redakce nemá jak sekci naplnit — lineup by skončil ve volném textu a web ho neumí vykreslit jako karty.
- **Návrh:** Přidat do detailu akce opakovatelný blok „Lineup“: role, jméno, odkud, medailonek, foto. Volné pole „Účinkující“ buď zrušit, nebo nechat jen pro drobné akce.
- **Zdroj:** `FE: sekce Lineup · Admin: EventDetail.vue → Základní informace`
- **Rozhoduje se v:** 00/21 — Detail akce: čtyři sekce, které admin neumí · možnosti: Doplnit všechny čtyři sekce / Doplnit jen harmonogram a lineup / Nedoplňovat / K diskusi

#### 01/02 — Harmonogram (program akce)

- **Na webu:** Sekce „Harmonogram — Co se kdy děje“: časová osa rozdělená po dnech, položka = čas, název, délka, scéna.
- **V administraci:** Není vůbec.
- **Dopad:** U vícedenních festivalů a konferencí je program hlavní obsah stránky — bez toho ho nelze zveřejnit.
- **Návrh:** Přidat záložku „Program“ s řádky (den, čas, název, délka, scéna) a možností duplikovat den.
- **Zdroj:** `FE: sekce Harmonogram · Admin: chybí`
- **Rozhoduje se v:** 00/21 — Detail akce: čtyři sekce, které admin neumí · možnosti: Doplnit všechny čtyři sekce / Doplnit jen harmonogram a lineup / Nedoplňovat / K diskusi

#### 01/03 — Praktické info

- **Na webu:** Sekce „Praktické info — Než vyrazíte“: čtyři karty s ikonou a textem — Doprava, Občerstvení, Platba, Přístupnost.
- **V administraci:** Není. Text by šlo naskládat do univerzální záložky „Obsah“, ale bez struktury a bez ikon.
- **Dopad:** Buď se strukturovaná sekce zaplní nestrukturovaným textem, nebo zůstane prázdná.
- **Návrh:** Buď blok „Info karty“ v ContentBuilderu (ikona + nadpis + text), nebo pevná sekce se čtyřmi předvyplněnými poli, která jdou vypnout.
- **Zdroj:** `FE: sekce Praktické info · Admin: chybí`
- **Rozhoduje se v:** 00/21 — Detail akce: čtyři sekce, které admin neumí · možnosti: Doplnit všechny čtyři sekce / Doplnit jen harmonogram a lineup / Nedoplňovat / K diskusi

#### 01/04 — Časté otázky k akci

- **Na webu:** Sekce „Časté otázky — Na co se lidé ptají“, rozbalovací (5 otázek u AFROSTRAVY).
- **V administraci:** ContentBuilder umí blok „FAQ / akordeon“, ale ne jako samostatnou sekci akce. Zároveň existuje samostatný modul FAQ, který na akce napojený není.
- **Dopad:** Není jasné, kam otázky patří — hrozí dvojí správa stejného obsahu.
- **Návrh:** Rozhodnout jednu cestu: (a) blok v Obsahu, (b) vlastní sekce v detailu akce, (c) výběr otázek z modulu FAQ.
- **Zdroj:** `FE: sekce Časté otázky · Admin: ContentBuilder / modul FAQ`
- **Rozhoduje se v:** 00/21 — Detail akce: čtyři sekce, které admin neumí · možnosti: Doplnit všechny čtyři sekce / Doplnit jen harmonogram a lineup / Nedoplňovat / K diskusi

#### 01/05 — Zvýrazněná akce ve výpisu

- **Na webu:** Data akce nesou příznak „highlight“ (u AFROSTRAVY) — akce se ve výpisu vypíchne.
- **V administraci:** Žádné pole.
- **Dopad:** Nelze určit, která akce má být ve výpisu zvýrazněná — o pořadí by rozhodoval kód, ne redakce.
- **Návrh:** Přidat přepínač „Zvýraznit ve výpisu“, ideálně s omezením, kolik akcí smí být zvýrazněných naráz.
- **Zdroj:** `FE: příznak highlight · Admin: chybí`
- **Rozhoduje se v:** 00/22 — Karta akce: věkové omezení a zvýraznění · možnosti: Doplnit obojí / Jen rozšířit věkový číselník / Nedoplňovat / K diskusi

#### 01/06 — Související prohlídky

- **Na webu:** Detail akce zatím nabízí jen obecný odkaz „Stálé prohlídky“, ne konkrétní prohlídky k dané akci.
- **V administraci:** Vazba akce → prohlídky je v datovém modelu i ve standardu modulů (pravidlo 14), ale v editaci akce chybí — výběr objektů je použitý jen pro místo konání.
- **Dopad:** Vazba je nadefinovaná, ale nejde nastavit. Podle standardu přes ni navíc má jít i prodej vstupenek přes Colosseum.
- **Návrh:** Doplnit výběr „Související prohlídky“ do záložky Vstupenky nebo Termín a místo.
- **Zdroj:** `Admin: mockEvents.ts → tourIds · docs/STANDARDY-MODULU.md, pravidlo 14`
- **Rozhoduje se v:** 00/23 — Související prohlídky u akce · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 01/07 — SEO a náhled pro sdílení

- **Na webu:** Každá akce má vlastní titulek stránky, popisek pro vyhledávače a obrázek pro sdílení na sítích.
- **V administraci:** Akce nemá SEO pole ani v datovém modelu. Pozor: SEO pole nejde editovat v žádném modulu — Aktuality, Produkty, Stránky a Galerie je mají jen v modelu, editor k nim není nikde.
- **Dopad:** Titulky a popisky se generují automaticky, redakce je neovlivní. Nejde o srovnání se zbytkem administrace — SEO je potřeba zavést od nuly, viz průřezové rozhodnutí v Přehledu.
- **Návrh:** Rozhodnout jeden SEO standard pro celý web (titulek, popisek, obrázek pro sdílení) a zavést ho všude, kde má položka vlastní URL.
- **Zdroj:** `Řeší se v Přehledu, bod 05 · Admin: bez SEO editoru`
- **Rozhoduje se v:** 00/24 — SEO: nejde nastavit v žádném modulu · možnosti: SEO sekce všude / Odvozovat z názvu a perexu / Odvozovat + možnost přepsat / K diskusi

#### 01/08 — Věkové omezení — chybějící hodnoty

- **Na webu:** Na kartách i v detailu se objevuje: 15+, 18+, 60+, 6–12 let, 8–15 let, do 8 let, od 10 let.
- **V administraci:** Pevný číselník pouze: Od 3 / 6 / 12 / 15 / 18 let.
- **Dopad:** Většinu hodnot z webu nelze zadat — chybí rozsahy, „do X let“ i seniorské 60+.
- **Návrh:** Rozšířit číselník o rozsahy a „do X let“, nebo povolit dopsání vlastní hodnoty.
- **Zdroj:** `Admin: mockEvents.ts → AGE_LIMIT_OPTIONS`
- **Rozhoduje se v:** 00/22 — Karta akce: věkové omezení a zvýraznění · možnosti: Doplnit obojí / Jen rozšířit věkový číselník / Nedoplňovat / K diskusi

#### 01/09 — Texty rozcestníků nad a pod výpisem

- **Na webu:** Nad filtrem blok „Prozkoumejte DOV“ (odkaz na prohlídky), pod výpisem blok „Kam dál — Nenašli jste to pravé?“ s odkazy na Mapu areálu a Prohlídky.
- **V administraci:** Nikde se needitují — jsou natvrdo v kódu webu.
- **Dopad:** Změna promo textu nad kalendářem vyžaduje zásah vývojáře.
- **Návrh:** Přidat do Nastavení (nebo do modulu Stránky) editaci nadpisu, textu a odkazů obou bloků.
- **Zdroj:** `FE: bloky nad/pod výpisem · Admin: chybí`
- **Rozhoduje se v:** 00/25 — Texty kolem výpisu akcí · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

### Rozpor k rozhodnutí

#### 01/17 — Číselník typů akcí se rozchází

- **Na webu:** Festival, Klub, Koncert, Konference, Program, Prohlídka, Společenská akce, Sport, Výstava, Vědecká show, Workshop.
- **V administraci:** Festival, Koncert, Sportovní akce, Výstava, Vzdělávací program, Konference, Stand-up. Navíc se v datech objevuje typ „Soukromá akce“, který v číselníku vůbec není.
- **Dopad:** Číselníky se prakticky nepřekrývají. Typ akce je zároveň kategorie ve filtru na webu — nesoulad se projeví hned na výpisu.
- **Návrh:** Sestavit jeden společný číselník a doplnit chybějící „Soukromá akce“ do číselníku administrace.
- **Zdroj:** `Admin: EVENT_TYPES · FE: filtr Kategorie`
- **Rozhoduje se v:** 00/26 — Číselník typů akcí se rozchází · možnosti: Sjednotit číselník nově / Platí administrace / Platí web / K diskusi

#### 01/18 — Prohlídky v kalendáři akcí

- **Na webu:** Kalendář míchá akce a prohlídky dohromady — Vysokopecní okruh, Bolt Tower, Fárání do dolu i Hornické muzeum jsou ve výpisu jako akce typu „Prohlídka“.
- **V administraci:** Záměrně to zakazuje: typ „Prohlídka“ je z číselníku odstraněný, protože prohlídky mají vlastní modul s opakovanými termíny a vstupenkami z Colossea (pravidlo 14b ve standardu modulů).
- **Dopad:** Nejzásadnější rozpor celé sekce. Rozhoduje o tom, odkud se berou data do kalendáře a jestli by redakce jednu prohlídku nezakládala dvakrát.
- **Návrh:** Doporučení: prohlídky nezadávat ručně jako akce, ale nechat kalendář, aby termíny prohlídek automaticky přebíral z modulu Prohlídky.
- **Zdroj:** `docs/STANDARDY-MODULU.md, pravidlo 14b · FE: akce typu Prohlídka`
- **Rozhoduje se v:** 00/27 — Patří prohlídky do kalendáře akcí? · možnosti: Kalendář přebírá prohlídky automaticky / Zadávat prohlídky i jako akce / Prohlídky do kalendáře nepatří / K diskusi

#### 01/19 — Seznam lokalit se rozchází

- **Na webu:** Filtr nabízí 7 lokalit včetně Landek Parku; u akcí se objevují místa jako Vysoká pec č. 1, Klub Heligonka, Music Studios nebo Tendon Hlubina.
- **V administraci:** 13 objektů z modulu Areál (Bolt Tower, Gong, Galerie Gong, U6, Hornické muzeum, Heligonka, HopJump, Lezecká stěna, NZM, Fajna Dilna, Futureum…). Landek Park mezi nimi není.
- **Dopad:** Část míst z webu nejde v administraci vybrat a naopak — filtr na webu zná jen zlomek objektů z Areálu. Souvisí s bodem 12 v sekci Detail budovy.
- **Návrh:** Sjednotit jeden seznam míst nad modulem Areál a rozhodnout, jestli filtr na webu ukazuje všechny objekty, nebo jen vybrané „hlavní“ lokality.
- **Zdroj:** `Admin: mockVenues.ts · FE: filtr Lokace v areálu`
- **Rozhoduje se v:** 00/18 — Landek Park: web s ním pracuje, administrace ho nezná · možnosti: Doplnit chybějící objekty / Zúžit seznam na webu / Obojí / K diskusi

#### 01/20 — Obsah: volné bloky vs. pevné sekce

- **Na webu:** Detail akce má pevnou stavbu: O akci → Lineup → Harmonogram → Galerie → Praktické info → Časté otázky. Pořadí ani skladbu redakce nemění.
- **V administraci:** Obsah akce se skládá z volných bloků (odstavce, nadpisy, obrázky, citace, FAQ, galerie…) v libovolném pořadí.
- **Dopad:** Zastřešuje body 1–4. Buď se web naučí vykreslovat volné bloky, nebo administrace dostane pevné sekce — smíšená cesta by znamenala dvojí správu obsahu.
- **Návrh:** Doporučení: pevné sekce pro to, co má web nakreslené (lineup, program, praktické info, FAQ) a volné bloky jen pro doplňkový text v „O akci“.
- **Zdroj:** `Admin: ContentBuilder · FE: pevné sekce detailu`
- **Rozhoduje se v:** 00/21 — Detail akce: čtyři sekce, které admin neumí · možnosti: Doplnit všechny čtyři sekce / Doplnit jen harmonogram a lineup / Nedoplňovat / K diskusi

### Přebývá v administraci

#### 01/10 — Štítky akcí

- **Na webu:** Web štítky nikde nezobrazuje. Filtr „Štítky“ nabízí jedinou možnost — „Zdarma“ — a tu si odvozuje z ceny, ne ze štítku.
- **V administraci:** Plnohodnotný výběr štítků s deseti předdefinovanými barevnými hodnotami (Rodinné, Venku, Hudba, Noční, Pro školy…).
- **Dopad:** Redakce plní pole, které se na webu nikde neprojeví.
- **Návrh:** Buď doplnit zobrazení a filtrování štítků na webu (karty + filtr), nebo štítky z akcí odebrat a nechat jen odvozené „Zdarma“.
- **Zdroj:** `Admin: PREDEFINED_EVENT_TAGS · FE: filtr Štítky`
- **Rozhoduje se v:** 00/29 — Akce: pět polí, která web nezobrazuje · možnosti: Odebrat nevyužitá pole / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 01/11 — Podnadpis akce

- **Na webu:** Nevykresluje se — ani ve výpisu, ani v detailu.
- **V administraci:** Vícejazyčné pole „Podnadpis / claim“ hned pod názvem.
- **Dopad:** Redakce vyplňuje text, který nikdo neuvidí. Zároveň ho vyplňuje i import z Colossea.
- **Návrh:** Rozhodnout, jestli ho web má zobrazovat (např. pod titulkem v detailu), nebo pole zrušit.
- **Zdroj:** `Admin: mockEvents.ts → subtitle`
- **Rozhoduje se v:** 00/29 — Akce: pět polí, která web nezobrazuje · možnosti: Odebrat nevyužitá pole / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 01/12 — Čas konce a délka akce

- **Na webu:** Zobrazuje se jen čas začátku. Délka se objevuje pouze u jednotlivých položek harmonogramu.
- **V administraci:** Samostatná pole „Čas DO“ a „Délka“.
- **Dopad:** Dvě pole navíc bez využití — u délky navíc kolize s bodem 2 (harmonogram).
- **Návrh:** Buď web doplnit o „16:00–22:00“ a délku v souhrnu akce, nebo pole vypustit.
- **Zdroj:** `Admin: EventDetail.vue → Termín`
- **Rozhoduje se v:** 00/29 — Akce: pět polí, která web nezobrazuje · možnosti: Odebrat nevyužitá pole / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 01/13 — Kapacita a volná místa

- **Na webu:** Nikde se nezobrazuje — ani ve výpisu, ani v detailu.
- **V administraci:** Pole „Kapacita“ a „Volných míst“, tažená z napojené akce v Colosseu.
- **Dopad:** Buď jde o čistě interní přehled, nebo web přichází o užitečnou informaci („posledních 40 míst“).
- **Návrh:** Rozhodnout, jestli se má na webu zobrazovat dostupnost, nebo jde jen o interní údaj.
- **Zdroj:** `Admin: Vstupenky → kapacita / volná místa`
- **Rozhoduje se v:** 00/29 — Akce: pět polí, která web nezobrazuje · možnosti: Odebrat nevyužitá pole / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 01/14 — Režimy prodeje vstupenek

- **Na webu:** Jediné tlačítko „Koupit vstupenku“ — zobrazuje se dokonce i u akcí s cenou „Vstup zdarma“.
- **V administraci:** Čtyři režimy: Přes Colosseum, Externí odkaz, Prodej na místě, Zdarma. Každý mění, co se u akce vyplňuje.
- **Dopad:** Web rozdíl mezi režimy nijak nepromítá. U akcí zdarma navíc nabízí koupi vstupenky, což je chyba na straně webu.
- **Návrh:** Sjednotit: web má podle režimu měnit tlačítko (Koupit / Na webu pořadatele / Vstupenky na místě / bez tlačítka).
- **Zdroj:** `Admin: TICKET_MODE_OPTIONS · FE: CTA v kartě i detailu`
- **Rozhoduje se v:** 00/30 — Režimy prodeje vstupenek se na webu neprojeví · možnosti: Web doplní chování podle režimu / Zjednodušit na jedno tlačítko / K diskusi

#### 01/15 — Příznak „Uzavírá budovu“

- **Na webu:** V kalendáři akcí se nijak neprojeví. Uzavření objektu web hlásí jen horním pruhem „Co je otevřeno?“.
- **V administraci:** Pole „akce obsazuje objekt“ je v datovém modelu, ale editor k němu není nikde — jen ho čte widget „Provoz budov“ na dashboardu, který podle něj nabízí budovu zavřít.
- **Dopad:** Mechanismus funguje, ale nastavit ho nikdo nemůže. Provozní příznak s dopadem na web se dnes zadat nedá.
- **Návrh:** Doplnit přepínač k akci (u termínu a místa) a potvrdit, kde se uzavření objeví na webu.
- **Zdroj:** `Admin: closesVenue bez editoru, čte jen Dashboard.vue`
- **Rozhoduje se v:** 00/31 — Akce obsazuje budovu: pole bez editoru · možnosti: Doplnit přepínač / Odebrat z modelu / K diskusi

#### 01/16 — Propagace (příprava příspěvku na sociální sítě)

- **Na webu:** Netýká se webu.
- **V administraci:** Záložka „Propagace“ generuje koncept příspěvku na Facebook z dat akce.
- **Dopad:** Interní nástroj, ne obsah webu — do revize patří jen pro pořádek.
- **Návrh:** Ponechat; jen potvrdit, že se s ním počítá i v ostré administraci.
- **Zdroj:** `Admin: EventDetail.vue → záložka Propagace`
- **Rozhoduje se v:** 00/29 — Akce: pět polí, která web nezobrazuje · možnosti: Odebrat nevyužitá pole / Doplnit je na web / Ponechat vše jak je / K diskusi

## 02 — Detail budovy

Stránka objektu v areálu — modul Areál. Referenční stránka je Velký svět techniky; ostatní budovy zatím detail na webu nemají.

### Chybí v administraci

#### 02/01 — Dlouhý popis „O objektu“

- **Na webu:** Sekce „O objektu“ = perex + tři plné odstavce textu o budově (architekt, expozice, kino, provozní detaily).
- **V administraci:** Jen krátký perex. Pole pro blokový obsah v datovém modelu existuje, ale v editaci budovy k němu není žádný editor — dlouhý text nejde napsat.
- **Dopad:** Nejzávažnější bod sekce: hlavní text stránky budovy se z administrace nedá vytvořit ani změnit.
- **Návrh:** Přidat do první záložky budovy editor obsahu (stejný jako u přidružených záložek), nebo prosté pole pro odstavce.
- **Zdroj:** `Admin: AreaEdit.vue — ContentBuilder je použitý jen pro přidružené záložky`
- **Rozhoduje se v:** 00/05 — Budova: dlouhý text „O objektu“ nejde napsat · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 02/02 — Vlastní nadpisy sekcí

- **Na webu:** Každá budova má vlastní nadpisy: „O Velkém světě techniky“ a „Co je nového ve Světě techniky“.
- **V administraci:** Needitovatelné — nadpisy by byly generické pro všechny budovy.
- **Dopad:** Web ztratí drobnou, ale znatelnou personalizaci stránek jednotlivých objektů.
- **Návrh:** Doplnit dvě nepovinná pole pro nadpis sekce „O objektu“ a sekce „Novinky“; prázdné = obecný nadpis.
- **Zdroj:** `FE: aboutHeading, newsHeading`
- **Rozhoduje se v:** 00/05 — Budova: dlouhý text „O objektu“ nejde napsat · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 02/03 — Hero obrázek hlavičky

- **Na webu:** Široký vizuál na pozadí hlavičky budovy, jiný záběr než fotky v galerii.
- **V administraci:** Hlavní obrázek se odvozuje z první fotky galerie (★). Samostatné pole pro hero není.
- **Dopad:** Fotka do galerie a fotka do široké hlavičky mají jiný ořez — jedna fotka nemůže sloužit obojímu.
- **Návrh:** Přidat samostatné pole „Obrázek hlavičky“ s doporučeným poměrem stran; bez něj se použije hlavní fotka z galerie.
- **Zdroj:** `FE: heroImage · Admin: cover z galerie`
- **Rozhoduje se v:** 00/14 — Hlavička budovy: čtyři údaje, které nejdou nastavit · možnosti: Doplnit všechna čtyři pole / Doplnit jen obrázek a vstupenky / Nedoplňovat / K diskusi

#### 02/04 — Tlačítko „Koupit vstupenky“

- **Na webu:** V hlavičce budovy hned vedle stavu otevřeno / zavřeno.
- **V administraci:** Budova nemá žádný odkaz na prodej ani napojení na Colosseum.
- **Dopad:** Hlavní konverzní tlačítko stránky nejde nastavit ani vypnout u budov, které vstupenky neprodávají.
- **Návrh:** Přidat volitelný odkaz na vstupenky (nebo napojení na Colosseum) s možností tlačítko skrýt.
- **Zdroj:** `FE: CTA v hlavičce · Admin: chybí`
- **Rozhoduje se v:** 00/14 — Hlavička budovy: čtyři údaje, které nejdou nastavit · možnosti: Doplnit všechna čtyři pole / Doplnit jen obrázek a vstupenky / Nedoplňovat / K diskusi

#### 02/05 — Popisky dlaždic „Kam dál“

- **Na webu:** Každá záložka má v bloku „Kam dál“ svůj podtitulek — „Co je uvnitř“, „Ceny a rezervace“, „Přivezeme program k vám“, „Prázdniny ve Světě techniky“.
- **V administraci:** U záložky je jen její název, popisek chybí.
- **Dopad:** Dlaždice na konci stránky by zůstaly bez popisků, nebo by je psal vývojář do kódu.
- **Návrh:** Přidat k záložce nepovinné pole „Popisek do dlaždice“.
- **Zdroj:** `FE: podtitulky v sekci Kam dál`
- **Rozhoduje se v:** 00/16 — Popisky dlaždic „Kam dál“ u budovy · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 02/06 — Správa záložek budovy

- **Na webu:** Velký svět techniky má sedm záložek, poslední („Pro školy“) vede na externí web a otevírá se v novém okně.
- **V administraci:** Obsah záložek se edituje, ale záložku nejde přidat, přejmenovat, odebrat, přeskládat ani označit jako externí odkaz. Výchozí sada Expozice / Vstupenky / Pro školy je natvrdo v kódu.
- **Dopad:** Každá budova má na webu jinou sadu záložek — bez správy záložek to redakce nenastaví.
- **Návrh:** Doplnit správu záložek: přidat, přejmenovat, přesunout, smazat, přepnout na externí odkaz (s URL).
- **Zdroj:** `Admin: DEFAULT_PAGE_TAB_LABELS, AreaEdit.vue`
- **Rozhoduje se v:** 00/06 — Záložky budovy: jiná sada a nejdou spravovat · možnosti: Doplnit správu záložek / Nechat pevnou sadu / K diskusi

#### 02/07 — Zvýrazněná část názvu v nadpisu

- **Na webu:** Nadpis zvýrazní konec názvu jinou barvou — „Velký svět <em>techniky</em>“.
- **V administraci:** Žádné pole; nadpis je jednolitý.
- **Dopad:** Drobnost, ale bez určení by web musel část názvu odhadovat (například poslední slovo).
- **Návrh:** Buď doplnit nepovinné pole „Zvýrazněná část názvu“, nebo potvrdit automatické pravidlo (poslední slovo).
- **Zdroj:** `FE: nameTail`
- **Rozhoduje se v:** 00/14 — Hlavička budovy: čtyři údaje, které nejdou nastavit · možnosti: Doplnit všechna čtyři pole / Doplnit jen obrázek a vstupenky / Nedoplňovat / K diskusi

#### 02/08 — Textový souhrn otevírací doby

- **Na webu:** V hlavičce jedna věta: „Pondělí – neděle, 9:00–18:00“.
- **V administraci:** Rozpis po jednotlivých dnech, souhrnná věta nikde.
- **Dopad:** Souhrn se dá z rozpisu odvodit, ale je potřeba potvrdit pravidlo — u nepravidelné doby („Út–Ne, v pondělí zavřeno“) může vyjít nešikovně.
- **Návrh:** Odvozovat automaticky z rozpisu a povolit ruční přepsání jedním polem.
- **Zdroj:** `FE: hoursSummary · Admin: OpeningHoursEditor`
- **Rozhoduje se v:** 00/14 — Hlavička budovy: čtyři údaje, které nejdou nastavit · možnosti: Doplnit všechna čtyři pole / Doplnit jen obrázek a vstupenky / Nedoplňovat / K diskusi

### Rozpor k rozhodnutí

#### 02/09 — Záložky: volný obsah vs. generovaný výpis

- **Na webu:** Záložka „Prohlídky“ je automatický výpis z modulu Prohlídky (karty s cenou, délkou, bezbariérovostí a tlačítkem koupit), „Galerie“ je výpis fotek. Ručně se nepíšou.
- **V administraci:** Každá záložka je volný blokový editor — počítá s tím, že obsah napíše redakce.
- **Dopad:** Kdyby redakce psala prohlídky ručně, vznikla by dvojí správa téhož obsahu a data by se rozešla.
- **Návrh:** Rozlišit dva typy záložek: „textová“ (blokový editor) a „automatická“ (výpis prohlídek / galerie / akcí), u automatické jen nadpis a úvodní text.
- **Zdroj:** `FE: /velky-svet-techniky/prohlidky · Admin: pageTabs = ContentBuilder`
- **Rozhoduje se v:** 00/15 — Záložka budovy: výpis z modulu, nebo psaný text? · možnosti: Rozlišit typy záložek / Nechat vše textové / K diskusi

#### 02/10 — Neshoda názvů a počtu záložek

- **Na webu:** Expozice · Doprovodný program · Galerie · Prohlídky · Výjezdní akce · Letní tábory · Pro školy (7).
- **V administraci:** Výchozí sada Expozice · Vstupenky · Pro školy (3). „Galerie“ je navíc samostatná fixní záložka administrace.
- **Dopad:** Souvisí s bodem 6 — dokud nejde záložky spravovat, sada zůstane špatně u všech budov.
- **Návrh:** Sjednotit sadu podle webu a nechat ji per budovu upravitelnou; vyjasnit, jestli je Galerie fixní záložka, nebo jedna z přidružených.
- **Zdroj:** `Admin: DEFAULT_PAGE_TAB_LABELS · FE: routes`
- **Rozhoduje se v:** 00/06 — Záložky budovy: jiná sada a nejdou spravovat · možnosti: Doplnit správu záložek / Nechat pevnou sadu / K diskusi

#### 02/11 — Dvě cesty ke stejnému obsahu

- **Na webu:** Web zná jen jednu strukturu: budova a její záložky.
- **V administraci:** Model nabízí dvě cesty — „hlavní přidružená stránka“ z modulu Stránky a zároveň vlastní záložky s obsahem přímo v Areálu. V editaci se needituje ani jedna.
- **Dopad:** Dvě cesty ke stejnému výsledku znamenají nejasnost pro redakci i pro vývojáře.
- **Návrh:** Vybrat jednu cestu. Doporučení: obsah záložek držet v Areálu u budovy, vazbu na modul Stránky zrušit.
- **Zdroj:** `Admin: mockVenues.ts → mainPageId vs. pageTabs`
- **Rozhoduje se v:** 00/17 — Obsah záložek: v Areálu, nebo v modulu Stránky? · možnosti: Obsah v Areálu / Obsah v modulu Stránky / K diskusi

#### 02/12 — Počet objektů areálu

- **Na webu:** Web pracuje se sedmi objekty (Bolt Tower, Gong, Velký svět techniky, Malý svět techniky U6, Důl Hlubina, Multifunkční aula, Landek Park).
- **V administraci:** Třináct objektů; Landek Park mezi nimi chybí.
- **Dopad:** Stejný rozpor jako bod 19 v sekci Kalendář akcí — rozhodnout jednotně pro obě.
- **Návrh:** Sjednotit seznam objektů a určit, které z nich mají na webu vlastní detail a které jen figurují jako místo konání.
- **Zdroj:** `Admin: mockVenues.ts · FE: mapa areálu + filtr lokalit`
- **Rozhoduje se v:** 00/18 — Landek Park: web s ním pracuje, administrace ho nezná · možnosti: Doplnit chybějící objekty / Zúžit seznam na webu / Obojí / K diskusi

### Přebývá v administraci

#### 02/13 — Bezbariérový přístup u budovy

- **Na webu:** Na stránce budovy se nikde nezobrazuje. Bezbariérovost je na webu atributem prohlídky, ne objektu.
- **V administraci:** Přepínač „Bezbariérový přístup“ v základních údajích budovy.
- **Dopad:** Informace se buď zbytečně zadává dvakrát, nebo webu chybí místo, kde ji ukázat.
- **Návrh:** Rozhodnout, jestli má web bezbariérovost u budovy zobrazovat (například v hlavičce), nebo pole odebrat a nechat ji jen u prohlídek.
- **Zdroj:** `Admin: area-accessible · FE: atribut prohlídky`
- **Rozhoduje se v:** 00/19 — Budova: čtyři pole, která web nezobrazuje · možnosti: Odebrat bezbariérovost a štítky / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 02/14 — Štítky budovy

- **Na webu:** Gastro / Atraktivity / Ubytování se na webu neobjevují — ani na detailu, ani v mapě areálu.
- **V administraci:** Výběr štítků v pravém sloupci detailu budovy.
- **Dopad:** Redakce plní pole bez využití, nebo webu chybí filtrování objektů podle štítků.
- **Návrh:** Buď doplnit filtrování objektů podle štítků do mapy areálu, nebo štítky u budov zrušit.
- **Zdroj:** `Admin: PREDEFINED_AREA_TAGS`
- **Rozhoduje se v:** 00/19 — Budova: čtyři pole, která web nezobrazuje · možnosti: Odebrat bezbariérovost a štítky / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 02/15 — Barva objektu a nahraná silueta

- **Na webu:** Web má vlastní sadu ikon objektů a vlastní barevnost; nahranou siluetu ani barvu z administrace nepoužívá.
- **V administraci:** Barva objektu a nahrání vlastní SVG siluety — používá se v kalendáři akcí v administraci.
- **Dopad:** Nejde o zbytečné pole, ale je třeba potvrdit, jestli se má propsat i do interaktivní mapy areálu na webu.
- **Návrh:** Ponechat pro administraci a rozhodnout, jestli barvu a siluetu přebere i mapa areálu na webu.
- **Zdroj:** `Admin: area-silhouette, barva objektu · FE: vlastní ikony`
- **Rozhoduje se v:** 00/19 — Budova: čtyři pole, která web nezobrazuje · možnosti: Odebrat bezbariérovost a štítky / Doplnit je na web / Ponechat vše jak je / K diskusi

#### 02/16 — Poznámka k provozu

- **Na webu:** Nelze ověřit — v prototypu není žádná budova zavřená ani sezónní.
- **V administraci:** Vícejazyčná poznámka „na web“, například „Zavřeno kvůli rekonstrukci do jara 2027“.
- **Dopad:** Bez potvrzení, kde se poznámka na webu ukazuje, může zůstat nezobrazená.
- **Návrh:** Potvrdit místo zobrazení: hlavička budovy, horní pruh s upozorněním, nebo stránka „Co je otevřeno“.
- **Zdroj:** `Admin: area-status_note`
- **Rozhoduje se v:** 00/20 — Poznámka k provozu: kde ji web ukáže? · možnosti: Potvrdit místo zobrazení / Odebrat z adminu / K diskusi

#### 02/17 — „Zobrazovat na dashboardu“

- **Na webu:** Netýká se webu.
- **V administraci:** Přepínač, jestli se budova objeví ve widgetu „Provoz budov“ v administraci.
- **Dopad:** Čistě interní nastavení — do revize patří jen pro pořádek.
- **Návrh:** Ponechat beze změny.
- **Zdroj:** `Admin: area-show_dashboard`
- **Rozhoduje se v:** 00/19 — Budova: čtyři pole, která web nezobrazuje · možnosti: Odebrat bezbariérovost a štítky / Doplnit je na web / Ponechat vše jak je / K diskusi

## 03 — Galerie

Rozcestník galerie a detail albumu — modul Galerie. Struktura sekce → album → fotky s webem sedí, rozdíly jsou v textech, pořadí a v roli sekcí.

### Chybí v administraci

#### 03/01 — Perex albumu

- **Na webu:** Detail albumu má pod názvem jednu větu — „Nejvyšší vyhlídka v Ostravě — 80 m nad areálem.“ Tentýž text web používá i jako popisek pro vyhledávače a pro sdílení na sítích.
- **V administraci:** Model pole pro popis albumu má, ale v editaci albumu není žádné pole na popis — jen záložka „Obsah“ s blokovým editorem.
- **Dopad:** Nejzávažnější bod sekce: jediná věta, kterou na detailu albumu vidí návštěvník, se nedá zadat. Bez ní nemá web co dát ani do popisku pro Google.
- **Návrh:** Přidat do základních informací albumu pole „Perex“ (jeden až dva řádky, vícejazyčné) a nechat z něj odvozovat popisek pro vyhledávače.
- **Zdroj:** `FE: subtitle albumu + meta description · Admin: GalleryEdit.vue → Základní informace`
- **Rozhoduje se v:** 00/04 — Album galerie: popis pod názvem nejde napsat · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 03/02 — Nadpis a úvodní text rozcestníku

- **Na webu:** Nad výpisem alb je nadřazený popisek „Fotografie atraktivit a akcí“, nadpis „Galerie“ a odstavec, který popisuje, co v galerii návštěvník najde.
- **V administraci:** Needitovatelné — modul Stránky stránku Galerie nemá a modul Galerie má jen sekce a alba.
- **Dopad:** Úvodní text hlavní stránky galerie by musel měnit vývojář v kódu.
- **Návrh:** Doplnit editaci úvodního bloku rozcestníku (nadpis, nadřazený popisek, odstavec) — buď do Nastavení, nebo jako stránku v modulu Stránky.
- **Zdroj:** `FE: hlavička /galerie · Admin: chybí`
- **Rozhoduje se v:** 00/39 — Texty kolem výpisu galerie · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

#### 03/03 — Pořadí sekcí a alb

- **Na webu:** Sekce i alba se vypisují v pevném pořadí (Bolt Tower, Velký svět techniky, Malý svět U6, …) — pořadí nese význam, nejde o abecedu ani o datum.
- **V administraci:** Sekce mají v modelu pole pro pořadí, ale nikde se needituje. Alba pořadí nemají vůbec.
- **Dopad:** Redakce nemůže určit, které album je ve výpisu první — a přitom je to hlavní stránka galerie.
- **Návrh:** Doplnit přeskládání sekcí i alb přetažením (nebo číslem pořadí) v seznamu modulu Galerie.
- **Zdroj:** `Admin: GallerySection.order bez UI · Gallery bez pořadí`
- **Rozhoduje se v:** 00/40 — Pořadí sekcí a alb v galerii · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 03/04 — Texty bloků „Kam dál“

- **Na webu:** Dva různé bloky: na rozcestníku „Chcete vidět víc?“ s odkazy na Mapu areálu a Kalendář akcí, na detailu albumu „Prohlédněte si další alba“ s odkazy zpět na galerii a na kalendář.
- **V administraci:** Nikde se needitují — jsou natvrdo v kódu webu.
- **Dopad:** Stejný typ nálezu jako bod 9 v sekci Kalendář akcí — vyřešit jednotně pro celý web, ne po modulech.
- **Návrh:** Zavést jedno místo pro editaci rozcestníkových bloků (nadpis, text, odkazy) a použít ho ve všech modulech.
- **Zdroj:** `FE: bloky Kam dál · Admin: chybí`
- **Rozhoduje se v:** 00/39 — Texty kolem výpisu galerie · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

### Rozpor k rozhodnutí

#### 03/05 — Sekce: filtr, nebo vlastní stránka?

- **Na webu:** Sekce je jen filtrovací záložka nad výpisem s počtem alb — Vše 10 / Atraktivity 6 / Akce 4. Vlastní stránku, popis ani obrázek nemá.
- **V administraci:** Sekce má popis (formátovaný text), náhledový obrázek a vlastní publikaci po jazycích — jako by měla vlastní stránku.
- **Dopad:** Rozhoduje o bodech 12 a 13. Buď sekce dostane na webu vlastní stránku, nebo se z administrace vypustí vše, co je pro stránku.
- **Návrh:** Doporučení: nechat sekci jen jako filtr — zrušit u ní popis, obrázek a publikaci po jazycích.
- **Zdroj:** `FE: filtrovací záložky · Admin: GallerySectionDetail.vue`
- **Rozhoduje se v:** 00/41 — Sekce galerie: filtr, nebo vlastní stránka? · možnosti: Sekce = jen filtr / Sekce dostane vlastní stránku / K diskusi

#### 03/06 — Názvy a počet sekcí se rozchází

- **Na webu:** Dvě sekce: Atraktivity a Akce.
- **V administraci:** Čtyři sekce: Fotografie atraktivit, Fotografie z akcí, Areál z výšky, Ubytování a gastronomie. Jiné názvy i jiný počet.
- **Dopad:** Filtr na webu by ukazoval jiné rozdělení, než jaké redakce vidí v administraci.
- **Návrh:** Sjednotit sadu sekcí a jejich názvy; rozhodnout, jestli „Areál z výšky“ a „Ubytování a gastronomie“ na webu být mají.
- **Zdroj:** `Admin: MOCK_SECTIONS · FE: kind atraktivity / akce`
- **Rozhoduje se v:** 00/42 — Dvě sekce na webu proti čtyřem v administraci · možnosti: Podle webu (2 sekce) / Podle adminu (4 sekce) / Sjednotit nově / K diskusi

#### 03/07 — Tři cesty k fotkám u budovy

- **Na webu:** Budova má na své stránce jednu galerii a odkaz „Prohlédnout celou galerii“.
- **V administraci:** Tři cesty ke stejnému výsledku: budova má vlastní inline fotky, k tomu připojené galerie, a album má navíc vazbu „objekt v areálu“.
- **Dopad:** Redakce nebude vědět, kam fotku nahrát, a fotky se rozejdou mezi třemi místy.
- **Návrh:** Vybrat jednu cestu. Doporučení: fotky držet vždy v albu modulu Galerie, u budovy jen vybrat, které album se zobrazí.
- **Zdroj:** `Admin: area-photos, venue.galleryIds, gallery.areaId`
- **Rozhoduje se v:** 00/43 — Tři cesty k fotkám u budovy · možnosti: Vše přes modul Galerie / Fotky u budovy zvlášť / K diskusi

#### 03/08 — Vazba album ↔ akce

- **Na webu:** Sekce Akce obsahuje alba z proběhlých akcí (AFROSTRAVA 2025, Colours of Ostrava 2025), ale z albumu nevede odkaz na akci ani naopak.
- **V administraci:** Vazba existuje jen z opačné strany — u akce se vybírají galerie. U budov je to přesně naopak: vazbu vlastní album. Směry vazeb si tedy odporují.
- **Dopad:** Nekonzistence napříč moduly: u jednoho vztahu se edituje v Galerii, u druhého v Kalendáři akcí.
- **Návrh:** Sjednotit směr vazeb (doporučení: vlastní ji vždy album) a doplnit u albumu volitelnou vazbu na akci.
- **Zdroj:** `Admin: event.galleryIds vs. gallery.areaId · docs/STANDARDY-MODULU.md, pravidlo 14`
- **Rozhoduje se v:** 00/44 — Album z akce nemá vazbu na akci · možnosti: Vazbu vlastní album / Vazbu vlastní cílový modul / K diskusi

### Přebývá v administraci

#### 03/09 — Datum pořízení / konání

- **Na webu:** Web datum albumu nikde nezobrazuje, ani podle něj neřadí a nefiltruje.
- **V administraci:** Pole „Datum pořízení / konání“ v základních informacích albumu.
- **Dopad:** Redakce vyplňuje údaj bez využití — nebo webu chybí řazení alb od nejnovějších.
- **Návrh:** Rozhodnout: buď web doplní datum na kartu albumu a řazení od nejnovějších, nebo pole odebrat.
- **Zdroj:** `Admin: gallery-date`
- **Rozhoduje se v:** 00/45 — Album: tři pole, která web nezobrazuje · možnosti: Odebrat všechna tři / Doplnit je na web / Ponechat jak jsou / K diskusi

#### 03/10 — Štítky albumu

- **Na webu:** Web štítky nezobrazuje ani nefiltruje — jediné filtrování je podle sekce.
- **V administraci:** Výběr štítků v pravém sloupci albumu (Pro rodiny, Sezónní, Prohlídky, Výstava, Festival…).
- **Dopad:** Stejný nález jako u akcí a budov — štítky se plní napříč moduly, ale web s nimi nikde nepracuje.
- **Návrh:** Rozhodnout jednotně pro celý web: buď štítky zobrazovat a filtrovat, nebo je z modulů odebrat.
- **Zdroj:** `Admin: gallery-tags`
- **Rozhoduje se v:** 00/45 — Album: tři pole, která web nezobrazuje · možnosti: Odebrat všechna tři / Doplnit je na web / Ponechat jak jsou / K diskusi

#### 03/11 — Obsah albumu (blokový editor)

- **Na webu:** Album má na webu jednu větu perexu a mřížku fotek — žádný další formátovaný obsah.
- **V administraci:** Album má celou záložku „Obsah“ s blokovým editorem (odstavce, nadpisy, obrázky, citace, video…).
- **Dopad:** Nabízí redakci obsah, který web nevykreslí. Zároveň to nahrazuje chybějící perex (bod 1) něčím, co se nezobrazí.
- **Návrh:** Doporučení: blokový editor u albumu zrušit a nahradit ho polem „Perex“ z bodu 1.
- **Zdroj:** `Admin: GalleryEdit.vue → záložka Obsah`
- **Rozhoduje se v:** 00/45 — Album: tři pole, která web nezobrazuje · možnosti: Odebrat všechna tři / Doplnit je na web / Ponechat jak jsou / K diskusi

#### 03/12 — Popis a náhledový obrázek sekce

- **Na webu:** Ani jedno se nezobrazuje — sekce je jen filtrovací záložka.
- **V administraci:** Sekce má formátovaný popis a náhledový obrázek.
- **Dopad:** Navázáno na bod 5. Pokud sekce zůstane jen filtrem, jsou obě pole zbytečná.
- **Návrh:** Odebrat spolu s rozhodnutím u bodu 5, nebo webu doplnit stránku sekce.
- **Zdroj:** `Admin: section-description, section-cover`
- **Rozhoduje se v:** 00/41 — Sekce galerie: filtr, nebo vlastní stránka? · možnosti: Sekce = jen filtr / Sekce dostane vlastní stránku / K diskusi

#### 03/13 — SEO pole albumu bez editace

- **Na webu:** Titulek a popisek stránky albumu se odvozují z názvu a perexu.
- **V administraci:** Model albumu má titulek, popisek, klíčová slova i obrázek pro sdílení — ale žádné z nich se v administraci needituje. Stejně je to u Aktualit, Produktů i Stránek; akce a prohlídky SEO pole nemají ani v modelu.
- **Dopad:** Mrtvá pole v modelu. SEO dnes nejde editovat nikde v administraci — je to průřezové rozhodnutí, ne nález jednoho modulu.
- **Návrh:** Rozhodnout v Přehledu (bod 05): buď všude odvozování z názvu a perexu, nebo všude stejná SEO sekce.
- **Zdroj:** `Řeší se v Přehledu, bod 05 · Admin: meta pole bez UI`
- **Rozhoduje se v:** 00/24 — SEO: nejde nastavit v žádném modulu · možnosti: SEO sekce všude / Odvozovat z názvu a perexu / Odvozovat + možnost přepsat / K diskusi

## 04 — Pronájem prostor

Stránka bez vlastního modulu — obsah se skládá v modulu Stránky pomocí Content builderu. Nálezy o chybějících vzorech v paletě jsme z revize vyřadili: builder je v prototypu jen vizuální zástupka a v ostré administraci bude mít vlastní bloky. Zůstaly věci, které Content builder nevyřeší — nastavení stránky, formulář a odkud se berou prostory.

### Chybí v administraci

#### 04/01 — Stránka „Pronájem prostor“ vůbec neexistuje

- **Na webu:** Stránka je živá, je v hlavním menu i v patičce a odkazuje se na ni z dalších stránek.
- **V administraci:** V modulu Stránky je deset stránek (O nás, Historie areálu, Kariéra, Volné pozice, Kontakty, Pro školy, Poděkování partnerům, Archiv akcí 2023, Návštěvní řád, Zásady cookies). Pronájem prostor mezi nimi není.
- **Dopad:** Bez založené stránky není v prototypu vidět, jak se tak členitá stránka v Content builderu skládá — a právě to má být ukázka pro vývojáře.
- **Návrh:** Založit stránku v prototypu a poskládat ji z bloků tak, jak vypadá na webu — poslouží jako referenční příklad použití Content builderu.
- **Zdroj:** `Admin: mockPages.ts — stránka chybí`
- **Rozhoduje se v:** 00/46 — Stránka Pronájem prostor v administraci není · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 04/05 — Formulář jako blok v obsahu

- **Na webu:** Formulář je uvnitř sekce „Poptávka“ — má nad sebou vlastní nadřazený popisek, nadpis „Poptejte prostor“ a odstavec, a je na konci stránky před blokem „Kam dál“.
- **V administraci:** Formulář se vybírá jako nastavení celé stránky (jeden na stránku) a redakce neurčí, kam se na stránce vloží. V knihovně bloků formulář není.
- **Dopad:** Na stránce, která se skládá z bloků, musí být formulář taky blok — jinak redakce neovlivní, kde se objeví.
- **Návrh:** Přidat blok „Formulář“ (výběr formuláře + nadpis + text nad ním) a nastavení formuláře na úrovni stránky zrušit — viz bod 11.
- **Zdroj:** `FE: formulář v sekci Poptávka · Admin: page-formTemplateId`
- **Rozhoduje se v:** 00/47 — Formulář: pole, umístění a čtyři paralelní nastavení · možnosti: Formulář jako blok + editor polí / Ponechat šablony a nastavení stránky / K diskusi

#### 04/06 — Nadřazený popisek (eyebrow)

- **Na webu:** Hero má nad nadpisem „Sály a objekty k pronájmu“ a každá sekce svůj: „Akce, konference, koncerty“, „Ateliéry, zkušebny, kanceláře“, „Ceremonie a hostina na Landeku“, „Nezávazná poptávka“.
- **V administraci:** Ani stránka, ani textové bloky takové pole nemají.
- **Dopad:** Prvek se opakuje na celém webu (stejný nález u detailu budovy, bod 2 v sekci 02) — bez pole ho redakce nikde nenastaví.
- **Návrh:** Doplnit nepovinné pole „Nadřazený popisek“ ke stránce i k blokům s nadpisem.
- **Zdroj:** `FE: eyebrow u hero i sekcí`
- **Rozhoduje se v:** 00/48 — Nadřazený popisek nad nadpisem · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 04/07 — SEO stránky

- **Na webu:** Stránka má vlastní titulek, popisek pro vyhledávače i texty pro sdílení na sítích.
- **V administraci:** Model stránky SEO pole má (titulek, popisek, klíčová slova, kanonická URL, indexování), ale v editaci stránky není ani jedno. Editor SEO polí není v celé administraci nikde.
- **Dopad:** Průřezový nález, ne chyba jednoho modulu: u stránky, u které je SEO nejpodstatnější, se dnes nedá nastavit nic.
- **Návrh:** Rozhodnout v Přehledu (bod 05) a zavést jeden standard všude, kde má položka vlastní URL.
- **Zdroj:** `Řeší se v Přehledu, bod 05 · Admin: page meta pole bez UI`
- **Rozhoduje se v:** 00/24 — SEO: nejde nastavit v žádném modulu · možnosti: SEO sekce všude / Odvozovat z názvu a perexu / Odvozovat + možnost přepsat / K diskusi

#### 04/08 — Umístění stránky (menu, patička, homepage)

- **Na webu:** Pronájem prostor je v hlavním menu i v patičce ve sloupci „Skupiny a firmy“.
- **V administraci:** Model má přepínače pro menu, sloupec patičky, zobrazení na homepage i prioritu — v editaci stránky se ale needituje nic z toho (pořadí jen přetažením v seznamu).
- **Dopad:** Redakce nemůže rozhodnout, kde se stránka v navigaci objeví — a to je u statických stránek základní úkon.
- **Návrh:** Doplnit do editace stránky sekci „Umístění“: v menu, sloupec patičky, na homepage, priorita.
- **Zdroj:** `Admin: allowMenu / allowFooter / allowHp / priority bez UI`
- **Rozhoduje se v:** 00/49 — Umístění stránky v menu a v patičce · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

### Rozpor k rozhodnutí

#### 04/10 — Formulář: šablona vs. skutečná pole

- **Na webu:** Deset polí: prostor (povinný výběr ze 7 hodnot), typ akce (povinný výběr ze 7), předpokládaný termín, počet účastníků jako rozsah (Do 50 / 50–200 / 200–500 / 500+), jméno a příjmení, společnost, e-mail, telefon, zpráva a souhlas se zpracováním osobních údajů.
- **V administraci:** Šablona „Poptávka pronájmu prostor“ má jméno/firma, e-mail, telefon, typ akce, termín, počet hostů (číslo) a popis akce. Chybí výběr prostoru, oddělená společnost, rozsahy u počtu a souhlas s údaji. Šablony jsou navíc natvrdo — nejde měnit pole, jejich povinnost ani hodnoty ve výběrech.
- **Dopad:** Formulář je hlavní konverzní prvek stránky. Jestli má být redakce schopná ho měnit, potřebuje editor polí, ne pevnou šablonu.
- **Návrh:** Doporučení: nechat redakci skládat formulář z polí (typ, popisek, povinnost, hodnoty ve výběru) a doplnit povinný souhlas s údaji jako pevnou součást každého formuláře.
- **Zdroj:** `Admin: FORM_TEMPLATES → ft-pronajem · FE: formulář Poptejte prostor`
- **Rozhoduje se v:** 00/47 — Formulář: pole, umístění a čtyři paralelní nastavení · možnosti: Formulář jako blok + editor polí / Ponechat šablony a nastavení stránky / K diskusi

#### 04/11 — Čtyři paralelní nastavení formuláře

- **Na webu:** Web zná jeden formulář v jedné sekci.
- **V administraci:** Stránka má v modelu čtyři nezávislá nastavení formuláře: výběr šablony, dynamický formulář, typ poptávkového formuláře a typ kontaktního formuláře. V editaci je vidět jen výběr šablony.
- **Dopad:** Čtyři cesty ke stejné věci — nejasné pro redakci i pro vývojáře, kterou implementovat.
- **Návrh:** Nechat jednu cestu. Doporučení: formulář jako blok v obsahu (bod 5) a ostatní tři nastavení z modelu odstranit.
- **Zdroj:** `Admin: formTemplateId / dynamicFormId / inquiryFormType / contactForm`
- **Rozhoduje se v:** 00/47 — Formulář: pole, umístění a čtyři paralelní nastavení · možnosti: Formulář jako blok + editor polí / Ponechat šablony a nastavení stránky / K diskusi

#### 04/12 — Prostory k pronájmu vs. modul Areál

- **Na webu:** Karty prostor: SpaceBuzz, Multifunkční aula Gong, Velký Svět Techniky, Zámek Vítkovice, Landek Park, Ateliéry Hlubina, Vilka Hlubina. Výběr ve formuláři přidává ještě Důl Hlubina, Bolt Tower a Trojhalí Karolina.
- **V administraci:** Modul Areál zná Bolt Tower, Gong, Galerii Gong, Velký svět techniky, U6, Hornické muzeum, Heligonku, HopJump, Lezeckou stěnu, NZM, Fajnu Dilnu, Futureum a Dětský svět. SpaceBuzz, Zámek Vítkovice, Ateliéry Hlubina, Vilka Hlubina ani Trojhalí Karolina v něm nejsou.
- **Dopad:** Buď se prostory k pronájmu zadají ručně na stránce (a rozejdou se s Areálem), nebo se Areál rozšíří o objekty, které nejsou návštěvnickými atrakcemi. Souvisí s body 19 v sekci 01 a 12 v sekci 02.
- **Návrh:** Rozhodnout společně se seznamem objektů areálu: buď prostory brát z Areálu s příznakem „k pronájmu“, nebo je vést jen jako obsah této stránky.
- **Zdroj:** `FE: rentalVenues · Admin: mockVenues.ts`
- **Rozhoduje se v:** 00/18 — Landek Park: web s ním pracuje, administrace ho nezná · možnosti: Doplnit chybějící objekty / Zúžit seznam na webu / Obojí / K diskusi

### Přebývá v administraci

#### 04/13 — Otevírací doba stránky

- **Na webu:** Otevírací doba je jedna věta uvnitř jedné ze tří kontaktních karet („Po – pá 08:00 do 16:00 hod.“), ne samostatná sekce.
- **V administraci:** Model stránky má rozpis po jednotlivých dnech a přepínač, jestli se má na webu zobrazit. V editaci stránky se needituje.
- **Dopad:** Rozpis po dnech je jinde (u budov) správný, tady ale web chce jednu větu — a to u konkrétní kontaktní karty, ne u stránky.
- **Návrh:** Otevírací dobu u stránky zrušit — patří ke konkrétní kontaktní kartě v obsahu stránky, ne ke stránce jako celku.
- **Zdroj:** `Admin: page openingHours / showOpeningHours`
- **Rozhoduje se v:** 00/50 — Stránka: dvě nastavení, která tam nepatří · možnosti: Odebrat ze stránky / Ponechat jak je / K diskusi

#### 04/14 — Měřicí kódy a cookies u stránky

- **Na webu:** Web s nimi na úrovni jednotlivé stránky nepracuje.
- **V administraci:** Model stránky má vlastní měřicí kódy a seznam použitých cookies. V editaci nejsou.
- **Dopad:** Vypadá to na globální nastavení webu, ne na nastavení per stránka.
- **Návrh:** Přesunout do globálního nastavení, nebo z modelu stránky odstranit.
- **Zdroj:** `Admin: page jsCodes / usedCookies`
- **Rozhoduje se v:** 00/50 — Stránka: dvě nastavení, která tam nepatří · možnosti: Odebrat ze stránky / Ponechat jak je / K diskusi

## 05 — E-shop — výpis produktů

Výpis produktů. Detail produktu na webu neexistuje a interně ještě není rozhodnuto, jestli vznikne, nebo jestli zůstane jen výpis a nákup půjde rovnou do košíku v Colosseu — to je bod 6 a určuje osud dalších tří.

### Chybí v administraci

#### 05/01 — Perex produktu (popis na kartu)

- **Na webu:** Každá karta má dvouřádkový popis — „Dárkový poukaz do Velkého světa techniky, nominál 500 Kč. Platnost 12 měsíců.“ Je to jediný text, který u produktu na webu je.
- **V administraci:** Model pole pro popis má a seznam produktů podle něj filtruje i hlásí „chybí popis“ — ale v editaci produktu k němu není žádný editor. Je tam jen záložka „Obsah“ s blokovým editorem.
- **Dopad:** Nejzávažnější bod sekce. Colosseum popisy neeviduje, takže tenhle text musí vzniknout v administraci — a nemá kde. Zároveň je nekonzistentní, že seznam kontroluje pole, které nejde vyplnit.
- **Návrh:** Přidat do základních informací produktu pole „Perex“ (dva řádky, vícejazyčné) a napojit na něj kontrolu „chybí popis“ v seznamu.
- **Zdroj:** `FE: perex na kartě · Admin: hasDescription() bez editoru`
- **Rozhoduje se v:** 00/03 — Produkt: popis na kartě nejde napsat · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 05/02 — Sleva a původní cena

- **Na webu:** Produkt „Placka s otvírákem“ má badge „Sleva“ a přeškrtnutou původní cenu — 35 Kč vedle 50 Kč.
- **V administraci:** Admin zná jen cenu z Colossea. Akční cenu ani příznak slevy nemá.
- **Dopad:** Sleva se na webu nedá zapnout. Souvisí s bodem 9 — web dnes slevu obchází kategorií „Výprodej“.
- **Návrh:** Doplnit k produktu akční cenu a příznak slevy (nebo potvrdit, že akční cenu bude posílat Colosseum).
- **Zdroj:** `FE: onSale + originalPrice · Admin: jen price z Colossea`
- **Rozhoduje se v:** 00/32 — Sleva u produktu se nedá zapnout · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 05/03 — Nadpis a úvodní text výpisu

- **Na webu:** Nad výpisem nadřazený popisek „Suvenýry, vouchery, merch“, nadpis „E-shop“ a odstavec o doručení poštou a vyzvednutí v informačním centru u brány Gong.
- **V administraci:** Needitovatelné.
- **Dopad:** Informace o doručení a vyzvednutí je obchodně důležitá a redakce ji nemůže změnit.
- **Návrh:** Řešit společně s ostatními úvodními texty výpisů (viz stejný nález v sekcích 01 a 03) — jedno místo pro nadpis, nadřazený popisek a perex výpisu.
- **Zdroj:** `FE: hlavička /eshop · Admin: chybí`
- **Rozhoduje se v:** 00/33 — Texty kolem výpisu e-shopu · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

#### 05/04 — Blok „Hledáte vstupenku?“

- **Na webu:** Pod výpisem nadpis „Voucher z eshopu je dárek“, vysvětlující odstavec a dvě dlaždice — Prohlídky a Kalendář akcí.
- **V administraci:** Needitovatelné.
- **Dopad:** Pátý výskyt téhož bloku (body 9 v sekci 01, 4 v sekci 03, 9 v sekci 04). Tady navíc rozlišuje voucher od vstupenky, což je častý dotaz zákazníků.
- **Návrh:** Vyřešit společně s ostatními výpisy — viz průřezové rozhodnutí 00/01.
- **Zdroj:** `FE: blok pod výpisem · Admin: chybí`
- **Rozhoduje se v:** 00/33 — Texty kolem výpisu e-shopu · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

#### 05/05 — Pořadí kategorií a produktů na webu

- **Na webu:** Pevné pořadí kategorií (Vouchery, Suvenýry, Magnetky, Pro děti, Knihy, DOV, Žertoviny, Výprodej) i produktů uvnitř nich — ani abecedně, ani podle ceny.
- **V administraci:** Kategorie pořadí nemají vůbec. U produktů je jen řazení seznamu v administraci (nejnověji importované / A–Z / cena vzestupně / sestupně), které se webu netýká.
- **Dopad:** Redakce nemůže vypíchnout, co se má prodávat první — u e-shopu jde o výdělek.
- **Návrh:** Doplnit přeskládání kategorií i produktů (přetažením) a rozhodnout, jestli má web nabízet i řazení návštěvníkovi.
- **Zdroj:** `Admin: sortOptions je jen filtr seznamu`
- **Rozhoduje se v:** 00/34 — Pořadí kategorií a produktů na webu · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

### Rozpor k rozhodnutí

#### 05/06 — Bude detail produktu?

- **Na webu:** Detail produktu neexistuje. Karta nikam nevede, veškerý obsah je na kartě a tlačítko „Koupit“ má mířit rovnou do košíku.
- **V administraci:** Administrace je postavená, jako by detail existoval: produkt má slug, SEO titulek i popisek, formátovaný popis a celou záložku „Obsah“ s blokovým editorem.
- **Dopad:** Jádro celé sekce — rozhodnutí určuje, co se stane s body 12 a 13, a jestli má produkt vůbec vlastní URL.
- **Návrh:** Rozhodnout jednou pro celý modul. Bez detailu stačí perex na kartu (bod 1) a odkaz do košíku; s detailem má smysl slug, SEO i blokový obsah.
- **Zdroj:** `FE: karta bez odkazu · Admin: slug, meta, contentBlocks`
- **Rozhoduje se v:** 00/35 — Bude detail produktu? · možnosti: Bez detailu — jen výpis a košík / Detail produktu vznikne / K diskusi

#### 05/07 — Typ zboží vs. kategorie

- **Na webu:** Web zná jen kategorie. Typ zboží nikde nezobrazuje.
- **V administraci:** Produkt má typ z číselníku Colossea (Zboží / Voucher / Publikace / Suvenýr) a k tomu vlastní členění do kategorií. Tři kategorie se s typy překrývají — Vouchery, Knihy, Suvenýry.
- **Dopad:** Dvě taxonomie nad stejnými produkty. Redakce bude řadit dvakrát a web z toho použije jednu.
- **Návrh:** Nechat typ jen jako technickou informaci z Colossea (rozhoduje o chování košíku: zboží vs. voucher) a pro web používat výhradně kategorie.
- **Zdroj:** `Admin: PRODUCT_TYPE_META + ProductCategory`
- **Rozhoduje se v:** 00/36 — Kategorie a typy zboží: tři nesrovnalosti naráz · možnosti: Sjednotit podle webu / Ponechat jak je / K diskusi

#### 05/08 — Jedna kategorie, nebo víc?

- **Na webu:** Produkt má jednu kategorii — počty ve filtru (3+3+3+3+2+1+2+1) se sčítají přesně na 18, tedy na počet produktů.
- **V administraci:** Produkt lze zařadit do více kategorií.
- **Dopad:** Při více kategoriích se počty ve filtru rozejdou s počtem produktů a „Vše 18“ přestane platit.
- **Návrh:** Rozhodnout: buď jedna kategorie na produkt, nebo web upravit tak, aby počty s vícenásobným zařazením počítal.
- **Zdroj:** `FE: categoryId (jeden) · Admin: categoryIds (více)`
- **Rozhoduje se v:** 00/36 — Kategorie a typy zboží: tři nesrovnalosti naráz · možnosti: Sjednotit podle webu / Ponechat jak je / K diskusi

#### 05/09 — Seznam kategorií se rozchází

- **Na webu:** Osm kategorií: Vouchery, Suvenýry, Magnetky, Pro děti, Knihy, DOV, Žertoviny, Výprodej.
- **V administraci:** Čtyři: Suvenýry, Knihy a publikace, Dárkové vouchery, Textil. Navíc „Výprodej“ je na webu kategorie, zatímco sleva má být příznak u produktu (bod 2) — jedna věc řešená dvěma způsoby.
- **Dopad:** Filtr na webu by ukazoval jiné členění, než jaké redakce v administraci vidí. A produkt ve slevě by musel být přeřazen do jiné kategorie, čímž zmizí z té původní.
- **Návrh:** Sjednotit seznam kategorií podle webu a „Výprodej“ nahradit příznakem slevy z bodu 2 (web pak slevové produkty vyfiltruje sám).
- **Zdroj:** `FE: 8 kategorií · Admin: MOCK_PRODUCT_CATEGORIES (4)`
- **Rozhoduje se v:** 00/36 — Kategorie a typy zboží: tři nesrovnalosti naráz · možnosti: Sjednotit podle webu / Ponechat jak je / K diskusi

#### 05/10 — Množství kusů a košík

- **Na webu:** Karta má počítadlo kusů (1 až 20) a tlačítko „Koupit“ — nákup zatím není napojený.
- **V administraci:** Produkt má jeden pevný „Odkaz do košíku (Colosseum)“ s náhledem tlačítka.
- **Dopad:** Není jasné, jak se do pevného odkazu dostane počet kusů. Zároveň je otázka, jestli má počítadlo na kartě smysl, když neexistuje detail produktu.
- **Návrh:** Vyjasnit s Colosseem, jak se předává množství (parametr v odkazu vs. API), a podle toho počítadlo na kartě nechat, nebo odebrat.
- **Zdroj:** `FE: stepper 1–20 + Koupit · Admin: product-cart_url`
- **Rozhoduje se v:** 00/37 — Počet kusů a odkaz do košíku · možnosti: Množství předávat do košíku / Počítadlo z karty odebrat / K diskusi

### Přebývá v administraci

#### 05/11 — Připojené fotogalerie u produktu

- **Na webu:** Karta ukazuje jen vlastní fotky produktu — karusel jedné až čtyř fotek.
- **V administraci:** Kromě vlastních fotek lze k produktu připojit i galerie z modulu Galerie.
- **Dopad:** Propojení se na webu nikde neprojeví. Stejný typ nálezu jako u akcí.
- **Návrh:** Odebrat, nebo potvrdit, k čemu má u produktu sloužit.
- **Zdroj:** `Admin: product galleryIds`
- **Rozhoduje se v:** 00/38 — E-shop: dvě nevyužitá místa · možnosti: Odebrat obojí / Doplnit na web / Ponechat jak je / K diskusi

#### 05/12 — Záložka „Obsah“ (blokový editor)

- **Na webu:** Produkt nemá detail, kde by se blokový obsah vykreslil.
- **V administraci:** Produkt má celou záložku „Obsah“ s blokovým editorem.
- **Dopad:** Navázáno na bod 6. Bez detailu je editor mrtvý — a navíc dnes suplu­je chybějící perex z bodu 1.
- **Návrh:** Bez detailu produktu zrušit a nahradit polem „Perex“ (bod 1).
- **Zdroj:** `Admin: ProductEdit.vue → záložka Obsah`
- **Rozhoduje se v:** 00/35 — Bude detail produktu? · možnosti: Bez detailu — jen výpis a košík / Detail produktu vznikne / K diskusi

#### 05/13 — Slug a SEO produktu

- **Na webu:** Produkt nemá vlastní URL, takže ani vlastní titulek a popisek pro vyhledávače.
- **V administraci:** Produkt má slug (vícejazyčný) a v modelu SEO titulek i popisek.
- **Dopad:** Navázáno na bod 6 — bez detailu jsou obě pole zbytečná.
- **Návrh:** Odebrat spolu s rozhodnutím u bodu 6, nebo ponechat, pokud detail vznikne.
- **Zdroj:** `Admin: product slug, metaTitle, metaDescription`
- **Rozhoduje se v:** 00/35 — Bude detail produktu? · možnosti: Bez detailu — jen výpis a košík / Detail produktu vznikne / K diskusi

#### 05/14 — Popis a náhledový obrázek kategorie

- **Na webu:** Kategorie je jen filtrovací chip s počtem produktů. Vlastní stránku, popis ani obrázek nemá.
- **V administraci:** Kategorie má formátovaný popis (editovatelný) a náhledový obrázek (jen v modelu, bez editace).
- **Dopad:** Přesně stejný nález jako u sekcí galerie (body 5 a 12 v sekci 03) — rozhodnout u obou modulů stejně.
- **Návrh:** Sjednotit s rozhodnutím u sekcí galerie: buď kategorie i sekce dostanou vlastní stránku, nebo z nich zmizí popis a obrázek.
- **Zdroj:** `Admin: ProductCategory description / image`
- **Rozhoduje se v:** 00/38 — E-shop: dvě nevyužitá místa · možnosti: Odebrat obojí / Doplnit na web / Ponechat jak je / K diskusi

## 06 — Prohlídky

Výpis prohlídek a detail prohlídky. Největší sekce revize — modul má správně vyřešené napojení na Colosseum, ale kartě prohlídky chybí většina údajů, které web na ní ukazuje.

### Chybí v administraci

#### 06/01 — Typ prohlídky

- **Na webu:** Badge na každé kartě i v detailu: S průvodcem, Celodenní, Zážitkový program, Kombinovaný, Tábor & kroužek. Podle typu se dá i filtrovat.
- **V administraci:** Žádné takové pole u prohlídky není.
- **Dopad:** Typ je první věc, kterou návštěvník na kartě vidí, a rozhoduje i o chování tlačítka (vybrat termín vs. koupit vstupenku). Redakce ho nemá jak nastavit.
- **Návrh:** Doplnit číselník „Typ prohlídky“ s hodnotami z webu a vyjasnit vztah ke skupinám — viz bod 13.
- **Zdroj:** `FE: tour.type · Admin: chybí`
- **Rozhoduje se v:** 00/01 — Karta prohlídky: chybí typ, náročnost a jazyky · možnosti: Doplnit všechna čtyři pole / Doplnit jen typ a náročnost / Nedoplňovat / K diskusi

#### 06/02 — Náročnost a bezbariérovost

- **Na webu:** Každá karta i detail má badge „Schody / Vyhlídka“ nebo „Bezbariérové“. Je to zároveň položka ve filtru štítků.
- **V administraci:** Žádné pole. Bezbariérovost je jen u budovy v modulu Areál (a tam se na webu naopak nezobrazuje — viz bod 13 v sekci 02).
- **Dopad:** Pro návštěvníky s omezenou pohyblivostí i pro rodiny s kočárkem je to klíčová informace a nejde ji zadat.
- **Návrh:** Doplnit k prohlídce volbu náročnosti (schody / bezbariérové) a rozhodnout společně s bodem 13 v sekci 02, kde bezbariérovost patří.
- **Zdroj:** `FE: tour.difficulty · Admin: chybí`
- **Rozhoduje se v:** 00/01 — Karta prohlídky: chybí typ, náročnost a jazyky · možnosti: Doplnit všechna čtyři pole / Doplnit jen typ a náročnost / Nedoplňovat / K diskusi

#### 06/03 — Jazyky prohlídky

- **Na webu:** V detailu badge „CZ / EN“ a v souhrnu řádek „jazyky CZ / EN“.
- **V administraci:** Žádné pole. Pozor: jazykové mutace obsahu (publikace po jazycích) jsou jiná věc — tady jde o jazyk, ve kterém průvodce mluví.
- **Dopad:** Zahraniční návštěvník nezjistí, jestli je prohlídka i v angličtině.
- **Návrh:** Doplnit k prohlídce výběr jazyků výkladu (nezávisle na jazykových mutacích webu).
- **Zdroj:** `FE: tour.languages · Admin: chybí`
- **Rozhoduje se v:** 00/01 — Karta prohlídky: chybí typ, náročnost a jazyky · možnosti: Doplnit všechna čtyři pole / Doplnit jen typ a náročnost / Nedoplňovat / K diskusi

#### 06/04 — Místo srazu

- **Na webu:** V souhrnu detailu „místo srazu Vysoká pec č. 1“ a u některých prohlídek poznámka „Prosíme, dorazte 10 minut před začátkem.“
- **V administraci:** Admin má jen vazbu na objekty areálu (kde prohlídka probíhá). Konkrétní místo srazu ani poznámku k příchodu nemá.
- **Dopad:** Objekt areálu není totéž co místo srazu — u „Cesty uhlí“ se sráží v Gongu, i když prohlídka vede vysokopecním závodem a koksovnou.
- **Návrh:** Doplnit pole „Místo srazu“ (text) a „Poznámka k příchodu“ k prohlídce.
- **Zdroj:** `FE: meetingPoint + meetingNote · Admin: jen areaIds`
- **Rozhoduje se v:** 00/01 — Karta prohlídky: chybí typ, náročnost a jazyky · možnosti: Doplnit všechna čtyři pole / Doplnit jen typ a náročnost / Nedoplňovat / K diskusi

#### 06/05 — Omezení a doporučené vybavení

- **Na webu:** Dva seznamy u prohlídky: omezení („Max. 17 osob ve skupině“, „Děti do 15 let pouze s dospělým“) a vybavení („Doporučujeme pevnou obuv“, „Audio průvodce v EN zdarma“).
- **V administraci:** Žádná z obou skupin nemá pole.
- **Dopad:** Jde o informace, které řeší reklamace a bezpečnost — musí být u konkrétní prohlídky, ne jen v obecném bloku pro celou stránku.
- **Návrh:** Doplnit dva opakovatelné seznamy odrážek („Omezení“, „Vybavení a doporučení“) po vzoru už existujícího „Co vás čeká“.
- **Zdroj:** `FE: restrictions + equipment · Admin: chybí`
- **Rozhoduje se v:** 00/07 — Prohlídka: omezení, vybavení a místo srazu · možnosti: Doplnit do adminu / Nedoplňovat / K diskusi

#### 06/06 — Příznak „Momentálně nedostupné“

- **Na webu:** Prohlídky Vítkovického zámku zůstávají ve výpisu, ale karta zešedne, dostane badge „Momentálně nedostupné“ a tlačítko nekliká.
- **V administraci:** K dispozici je jen zveřejněno / nezveřejněno — tím by prohlídka z výpisu úplně zmizela.
- **Dopad:** Rozdíl mezi „dočasně neprodáváme“ a „na webu vůbec není“ je podstatný: nedostupná prohlídka má zůstat vidět, aby lidé věděli, že existuje.
- **Návrh:** Doplnit třetí stav „Dočasně nedostupné“ (zůstane ve výpisu, bez možnosti nákupu) s volitelnou poznámkou.
- **Zdroj:** `FE: tour.unavailable · Admin: jen published`
- **Rozhoduje se v:** 00/08 — Dostupnost prohlídky: nedostupná a bez termínů · možnosti: Doplnit oba příznaky / Doplnit jen nedostupnost / Nedoplňovat / K diskusi

#### 06/07 — Nedatovaná prohlídka a platnost vstupenky

- **Na webu:** Celodenní vstupy a balíčky nemají termíny — místo časů ukazují „Vstup kdykoli · platnost 30 dnů“ a tlačítko „Koupit vstupenku“ místo „Vybrat termín a koupit“.
- **V administraci:** Modul je postavený na termínech z Colossea. Příznak nedatované prohlídky ani platnost vstupenky nemá.
- **Dopad:** Jde o devět z dvaceti šesti prohlídek (celodenní vstupy, kombinované balíčky, 4vstupenky, kroužky a tábory) — tedy třetinu nabídky.
- **Návrh:** Doplnit příznak „bez termínů (vstup kdykoli)“ a pole „platnost vstupenky“; podle příznaku se mění i text tlačítka.
- **Zdroj:** `FE: tour.undated · Admin: chybí`
- **Rozhoduje se v:** 00/08 — Dostupnost prohlídky: nedostupná a bez termínů · možnosti: Doplnit oba příznaky / Doplnit jen nedostupnost / Nedoplňovat / K diskusi

#### 06/08 — Blok „Praktické informace“

- **Na webu:** Pod výpisem tři karty: Srazová místa (čtyři páry trasa → místo plus poznámka o příchodu), Oblečení a bezpečnost (tři odrážky) a Storno a platnost (tři odrážky o vázanosti na termín, platnosti poukazů a storno lhůtě 24 h).
- **V administraci:** Needitovatelné.
- **Dopad:** Obsahuje storno podmínky, tedy informaci s právním dopadem — a redakce ji nemůže změnit.
- **Návrh:** Buď jako editovatelný blok stránky výpisu, nebo (u srazových míst) generovat ze samotných prohlídek podle bodu 4.
- **Zdroj:** `FE: blok pod výpisem · Admin: chybí`
- **Rozhoduje se v:** 00/09 — Texty kolem výpisu prohlídek · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

#### 06/09 — Nadřazený popisek a nadpis skupiny

- **Na webu:** Každá skupina má dvojici textů — nadřazený popisek „Prohlídky areálu DOV“ a nadpis „Komentované okruhy“ (s typograficky zvýrazněným koncem).
- **V administraci:** Kategorie prohlídek má jen jeden název.
- **Dopad:** Stejný nález jako u budov (bod 2 v sekci 02) a stránek (bod 6 v sekci 04) — prvek se opakuje na celém webu.
- **Návrh:** Doplnit ke kategorii nepovinný nadřazený popisek a rozhodnout jednotně o zvýrazněné části nadpisu.
- **Zdroj:** `FE: group eyebrow + title + tail`
- **Rozhoduje se v:** 00/10 — Kategorie prohlídek: nadpisy a nevyužitý obsah · možnosti: Doplnit popisek, popis a fotky odebrat / Doplnit popisek, popis nechat / Nedoplňovat / K diskusi

#### 06/10 — Nadpis a úvodní text výpisu + blok „Kam dál“

- **Na webu:** Hlavička výpisu („Dolní Vítkovice“ / „Prohlídky a vstupenky“) a na konci blok „Co ještě u nás najdete“ s odstavcem a dvěma dlaždicemi.
- **V administraci:** Needitovatelné.
- **Dopad:** Čtvrtý výpis se stejným problémem (01/9, 03/4, 05/4). Jedno rozhodnutí v Přehledu vyřeší všechny.
- **Návrh:** Blok „Rozcestník“ do knihovny bloků + jedno místo pro úvodní texty výpisů.
- **Zdroj:** `FE: hlavička + blok Kam dál · Admin: chybí`
- **Rozhoduje se v:** 00/09 — Texty kolem výpisu prohlídek · možnosti: Texty v nastavení modulu / Výpis dostane stránku v modulu Stránky / Nechat natvrdo v kódu / K diskusi

### Rozpor k rozhodnutí

#### 06/11 — Odkud se bere cena a cenové kategorie?

- **Na webu:** Každá karta ukazuje cenu („cena od 220 Kč“) a u jedné prohlídky je plná tabulka šesti kategorií s poznámkami: Dospělí 295 Kč, Snížené 210 Kč (děti 6–15, studenti do 26, senioři 65+), Rodinné 800 Kč (2 dospělí + 2 děti do 15), Děti do 5 let zdarma, ZTP/P + doprovod zdarma, Školní skupiny na dotaz.
- **V administraci:** U prohlídky není žádné pole s cenou. Administrace k tomu píše, že aktuální cena i nákup probíhají v Colosseu.
- **Dopad:** Ceny samotné Colosseum poslat umí, ale poznámky u kategorií jsou marketingový text — je potřeba potvrdit, jestli je Colosseum eviduje, nebo se musí psát v CMS.
- **Návrh:** Ověřit s Colosseem rozsah dat u cen. Co Colosseum neposílá (popisky kategorií), doplnit jako editovatelný seznam u prohlídky.
- **Zdroj:** `FE: price + priceTiers · Admin: bez pole s cenou`
- **Rozhoduje se v:** 00/02 — Cena prohlídky: odkud se má brát · možnosti: Vše z Colossea / Ceny z Colossea, popisky v CMS / Vše v CMS / K diskusi

#### 06/12 — Kategorie vs. skupiny — tři skupiny chybí

- **Na webu:** Šest skupin: Prohlídky areálu DOV, Hornické muzeum Landek Park, Vítkovický zámek, Expozice a herny, Zvýhodněné balíčky, Kroužky/dílny & tábory.
- **V administraci:** Tři kategorie: Dolní Vítkovice, Hornické muzeum Landek Park, Vítkovický zámek. Expozice a herny, Zvýhodněné balíčky ani Kroužky a tábory v administraci nejsou.
- **Dopad:** V chybějících třech skupinách je deset z dvaceti šesti prohlídek — tedy celodenní vstupy, kombinované balíčky, 4vstupenky, kroužky, dílny a tábory. Ty by dnes neměly kam patřit.
- **Návrh:** Doplnit chybějící kategorie podle webu a potvrdit jejich pořadí ve výpisu.
- **Zdroj:** `FE: 6 skupin · Admin: MOCK_CATEGORIES (3)`
- **Rozhoduje se v:** 00/11 — Tři kategorie proti šesti skupinám na webu · možnosti: Doplnit podle webu / Sjednotit nově / K diskusi

#### 06/13 — Filtr „Typ prohlídky“ ukazuje skupiny, ne typy

- **Na webu:** Filtr pojmenovaný „Typ prohlídky“ nabízí DOV & Pece, Landek Park, Svět techniky & U6, Vítkovický zámek, Balíčky & 4vstupenky, Kroužky & Tábory — to jsou skupiny. Skutečný typ (S průvodcem) je schovaný jako jedna hodnota ve filtru „Štítky“.
- **V administraci:** Admin zná jen kategorie a slovo „typ“ nepoužívá.
- **Dopad:** Dvě různé věci pod jedním jménem. Bez sjednocení si je admin a web budou vysvětlovat každý jinak a vývojáři to postaví podle jednoho z nich.
- **Návrh:** Sjednotit terminologii: skupina (kategorie ve výpisu) vs. typ prohlídky (badge na kartě) a filtry na webu pojmenovat podle toho.
- **Zdroj:** `FE: filtr groups vs. tour.type`
- **Rozhoduje se v:** 00/12 — Filtry u prohlídek: štítky, které nikdo nezadává · možnosti: Doplnit štítky a přejmenovat filtry / Nechat odvozené / K diskusi

#### 06/14 — Štítky se odvozují, nezadávají

- **Na webu:** Filtr „Štítky“ má pět hodnot, které web dopočítává z jiných polí: S průvodcem z typu, Schody a Bezbariérové z náročnosti, Zdarma z toho, že v ceně je slovo „zdarma“, a Pro děti z toho, že se v názvu, perexu nebo odrážkách vyskytne „dět“.
- **V administraci:** Prohlídka žádné štítky nemá.
- **Dopad:** Odvozování „Pro děti“ podle výskytu slova v textu je nespolehlivé — prohlídka pro děti bez toho slova ve filtru chybí a naopak.
- **Návrh:** Doporučení: odvozovat jen to, co je odvoditelné bezpečně (typ, náročnost, cena), a „Pro děti“ nahradit ručním štítkem u prohlídky.
- **Zdroj:** `FE: derived tags · Admin: bez štítků`
- **Rozhoduje se v:** 00/12 — Filtry u prohlídek: štítky, které nikdo nezadává · možnosti: Doplnit štítky a přejmenovat filtry / Nechat odvozené / K diskusi

#### 06/15 — Detail prohlídky: pevné sekce vs. bloky

- **Na webu:** Detail je pevný a strohý: perex → „Co vás čeká“ → souhrn (délka, místo srazu, cena od, jazyky) → tlačítko. Nic víc.
- **V administraci:** Kromě perexu a odrážek nabízí richtext popis a celou záložku „Obsah“ s blokovým editorem.
- **Dopad:** Zastřešuje body 16 a 17. Buď web detail rozšíří, nebo administrace přebytečné editory zruší.
- **Návrh:** Doporučení: držet pevnou stavbu detailu a doplnit chybějící pole z bodů 1–7 místo volných bloků.
- **Zdroj:** `Admin: description + contentBlocks · FE: pevný detail`
- **Rozhoduje se v:** 00/13 — Detail prohlídky: co admin nabízí a web nezobrazuje · možnosti: Držet pevný detail — přebytky odebrat / Rozšířit web o bloky a galerii / K diskusi

### Přebývá v administraci

#### 06/16 — Richtext popis a blokový obsah prohlídky

- **Na webu:** Web zobrazuje jen perex a odrážky „Co vás čeká“. Formátovaný popis ani blokový obsah nevykresluje.
- **V administraci:** Model má formátovaný popis (v editaci k němu žádný editor není) a k tomu celou záložku „Obsah“ s bloky.
- **Dopad:** Mrtvé pole plus editor, který nemá kde skončit. Navázáno na bod 15.
- **Návrh:** Odebrat spolu s rozhodnutím u bodu 15.
- **Zdroj:** `Admin: tour.description bez UI, contentBlocks`
- **Rozhoduje se v:** 00/13 — Detail prohlídky: co admin nabízí a web nezobrazuje · možnosti: Držet pevný detail — přebytky odebrat / Rozšířit web o bloky a galerii / K diskusi

#### 06/17 — Galerie prohlídky a připojené galerie

- **Na webu:** Prohlídka má na kartě i v detailu jednu fotku. Galerie se nikde nezobrazuje.
- **V administraci:** Prohlídka má vlastní fotogalerii i možnost připojit galerie z modulu Galerie.
- **Dopad:** Stejný nález jako u produktů (bod 11 v sekci 05) a akcí. Nabízí se sjednotit napříč moduly.
- **Návrh:** Buď detail prohlídky doplnit galerií, nebo ponechat jen jednu hlavní fotku.
- **Zdroj:** `Admin: tour photos + galleryIds`
- **Rozhoduje se v:** 00/13 — Detail prohlídky: co admin nabízí a web nezobrazuje · možnosti: Držet pevný detail — přebytky odebrat / Rozšířit web o bloky a galerii / K diskusi

#### 06/18 — Kontaktní e-mail a poznámka k platbě

- **Na webu:** Web je u prohlídky nezobrazuje. Platba a storno jsou řešené obecným blokem pro celou stránku výpisu (bod 8).
- **V administraci:** Prohlídka má kontaktní e-mail a poznámku k platbě.
- **Dopad:** Buď se u prohlídky zobrazovat mají (a web s tím nepočítá), nebo patří do obecného bloku.
- **Návrh:** Rozhodnout: doplnit na detail prohlídky, nebo přesunout do bloku „Praktické informace“ z bodu 8.
- **Zdroj:** `Admin: tour-contact_email, tour-payment`
- **Rozhoduje se v:** 00/13 — Detail prohlídky: co admin nabízí a web nezobrazuje · možnosti: Držet pevný detail — přebytky odebrat / Rozšířit web o bloky a galerii / K diskusi

#### 06/19 — „Kdy prohlídky začínají“ (volný text)

- **Na webu:** Web ukazuje skutečné termíny z Colossea („Dnes volno“ + časy, „Dnes zavřeno“) a u nedatovaných „Vstup kdykoli“. Volný text nikde.
- **V administraci:** Prohlídka má vícejazyčné textové pole „Kdy prohlídky začínají“.
- **Dopad:** Riziko rozporu: ručně psaný text („Denně v 10, 12, 14 a 16“) může tvrdit něco jiného než termíny z Colossea.
- **Návrh:** Zrušit a spolehnout se na termíny z Colossea; případnou výjimku řešit polem z bodu 7 (platnost / vstup kdykoli).
- **Zdroj:** `Admin: tour-schedule`
- **Rozhoduje se v:** 00/13 — Detail prohlídky: co admin nabízí a web nezobrazuje · možnosti: Držet pevný detail — přebytky odebrat / Rozšířit web o bloky a galerii / K diskusi

#### 06/20 — Popis a fotky kategorie prohlídek

- **Na webu:** Skupina na webu ukazuje jen dva nadpisy. Popis, fotky ani hlavní obrázek kategorie se nepoužijí.
- **V administraci:** Kategorie má formátovaný popis, vlastní fotogalerii, připojené galerie a hlavní obrázek.
- **Dopad:** Čtvrtý výskyt téhož vzoru (body 5 a 12 v sekci 03, bod 14 v sekci 05) — sekce a kategorie jsou v administraci vybavené jako stránky, ale web je používá jen jako záhlaví nebo filtr.
- **Návrh:** Rozhodnout jednotně pro galerie, produkty i prohlídky: buď kategorie dostanou vlastní stránku, nebo z nich zmizí popis a fotky.
- **Zdroj:** `Admin: TourCategory description / photos / image`
- **Rozhoduje se v:** 00/10 — Kategorie prohlídek: nadpisy a nevyužitý obsah · možnosti: Doplnit popisek, popis a fotky odebrat / Doplnit popisek, popis nechat / Nedoplňovat / K diskusi
