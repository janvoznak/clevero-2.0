# Rozhodnutí revize administrace DOV

Zadání pro přepis prototypu administrace a pro vývojáře. Vychází z revize
[`nalezy.md`](nalezy.md) (94 nálezů, revize 4. 9. 2026) a z rozhodnutí odklepnutých
v revizním přehledu (49 rozhodnutí, 4.–8. 9. 2026).

- **Podklad:** `nalezy.md` — podrobný rozpis nálezů 01/01–06/20 (na webu / v administraci / dopad / návrh).
- **Revizní přehled:** <https://claude.ai/code/artifact/b969cac7-0991-4427-b6d3-850e56df82ed>
- **Odkazy v textu:** `d5` = rozhodnutí 00/05 revizního přehledu (viz část E).
- **Stav:** 49/49 rozhodnuto, pokryto všech 94 nálezů. Otevřené a odložené body jsou v části D.

Části: **A** průřezová pravidla · **B** co se v prototypu mění · **C** co se nemění
· **D** otevřené a odložené · **E** tabulka rozhodnutí → nálezy.

---

## A. Průřezová pravidla

Tato pravidla vysvětlují většinu jednotlivých rozhodnutí. Při nejasnosti u konkrétního
pole rozhoduje pravidlo, ne dohad.

**A1 — Dlouhý obsah řeší content builder, ne vlastní pole.**
Dlouhé texty, strukturované sekce a bloky se do modelu nepřidávají jako pole; redakce
je poskládá v content builderu. Platí pro dlouhý popis a nadpisy sekcí u budovy, omezení
a vybavení u prohlídky, lineup, harmonogram, info karty a FAQ u akce, bloky stránky
Pronájem a přebytkový blokový editor u prohlídky.
*(d5, d7, d13, d21, d50)*

**A2 — Texty kolem výpisů zůstávají natvrdo v kódu.**
Nadpisy, úvodní texty a rozcestníky nad a pod výpisy se do administrace nezavádějí —
u prohlídek, akcí, e-shopu i galerie shodně. Žádné „nastavení modulu“ ani stránka výpisu
v modulu Stránky se nezakládá.
*(d9, d25, d33, d39)*

**A3 — SEO se jen odvozuje, SEO záložka nebude.**
Žádný modul nedostane SEO sekci. Titulek a popisek pro vyhledávače a sdílení se odvozují
z názvu a perexu, **bez** možnosti přepsat je v administraci.
*(d24 → nálezy 01/07, 03/13, 04/07)*

**A4 — Štítky se řeší per modul, společný číselník nebude.**
Prohlídky dostanou ruční štítky, u albumů štítky zůstávají (na webu se vykreslí jako
odznak), u budovy zůstávají nevyužité. Nesjednocuje se.
*(d12, d19, d45)*

**A5 — Pořadí se řeší per modul.**
V galerii se pořadí sekcí i alb mění drag & drop, v e-shopu se pořadí kategorií
a produktů neřeší. Nesjednocuje se.
*(d40, d34)*

**A6 — Co řeší Colosseum a co jsou mock data, není nález administrace.**
Typy a kategorie zboží, počty produktů, předávání množství do košíku, sada sekcí galerie
a seznam objektů areálu se v prototypu neřeší — data v adminu jsou zatím fiktivní
a obsah přichází z API.
*(d36, d37, d42, d46, d18)*

**A7 — Obsah záložek budovy je v Areálu, ne v modulu Stránky.**
Záložky drží budova jako `pageTabs` per objekt. Vazba na modul Stránky jde z modelu ven.
V repu tím zůstal nepoužitý soubor `src/components/admin/PageGroupBar.vue` (sdílený pás
„Přidružené stránky“ byl z Areálu odstraněn commitem `c60945c`, 12. 8. 2026) — při přepisu
smazat.
*(d17, d6)*

**A8 — Nová záložka i nová stránka je vždy content builder.**
Když redakce přidá záložku budovy nebo stránku, jejím obsahem je content builder. Žádné
typové varianty obsahu se nezavádějí; automatické výpisy (prohlídky, galerie, akce) jsou
zvlášť — viz B/02 a d15.
*(d6)*

---

## B. Co se v prototypu mění

Úkoly k zapracování. V hranaté závorce je bod revize, v kulaté rozhodnutí.

### B/01 — Kalendář akcí
- Doplnit možnost napsat si vlastní **typ akce** nad číselník. [01/17] *(d26)*
- Doplnit možnost zadat **vlastní věkovou hodnotu** nad číselník. [01/05] *(d22)*
- Doplnit k akci přepínač **„obsazuje objekt“** do záložky Termín a místo — mechanismus
  i hlášení na dashboardu už existují, chybí jen editor. [01/15] *(d31)*
- **Zdrojem termínů a akcí pro web je modul Kalendář akcí.** [01/18] *(d27)*
- Práce na webu, ne v adminu: tlačítko se mění podle **režimu prodeje** — koupit vstupenku
  / externí odkaz na pořadatele / vstupenky na místě / bez tlačítka. U akcí zdarma nesmí
  web nabízet nákup. [01/14] *(d30)*

### B/02 — Areál (detail budovy)
- Doplnit **správu záložek budovy**: přidat, přejmenovat, přeskládat, smazat, externí odkaz.
  Dnes se `pageTabs` jen vykreslují z dat (`src/views/area/AreaEdit.vue`), redakce s nimi
  nic neudělá. Obsahem nové záložky je content builder. [02/06, 02/10] *(d6, A8)*
- Záložka **Prohlídky** není psaný text, ale **automatický výpis** z modulu Prohlídky —
  na záložce se nezadává nic. [02/09] *(d15)*
- **Poznámka k provozu** (`AreaEdit.vue`, pole „Poznámka k provozu (na web)“) se na webu
  zobrazí v **horní informační liště**. [02/16] *(d20)* — **k dořešení:** informační lišta
  je od 8. 9. samostatný podmodul s vlastním ručně psaným textem (B/03b). Je potřeba
  rozhodnout, jestli poznámka u budovy do téhož pruhu propadá automaticky (a co má
  přednost, když je vyplněné obojí), nebo se ukazuje jen na stránce budovy.
- Vazbu na modul Stránky z modelu odstranit, smazat `PageGroupBar.vue`. [02/11] *(d17, A7)*

### B/03 — Galerie
- Doplnit k albumu **perex** (jeden až dva řádky, vícejazyčný) a **zrušit záložku Obsah
  s blokovým editorem** — perex ji nahrazuje. [03/01, 03/11] *(d4, d45)*
- **Počet fotek** u albumu doplňovat **automaticky**, ne ručně. *(d45)*
- Smazat pole **„Datum pořízení / konání“** (`src/views/galleries/GalleryEdit.vue:220`).
  [03/09] *(d45)*
- **Sekce galerie = jen filtr**: odebrat popis a náhledový obrázek
  (`GallerySectionDetail.vue`), **publikaci po jazycích ponechat**. [03/05, 03/12] *(d41)*
- **Pořadí sekcí i alb** měnit drag & drop. [03/03] *(d40)*
- Doplnit u albumu **volitelnou vazbu na akci** — vazbu vlastní album. [03/08] *(d44)*
- Štítky albumu zůstávají; na webu se vykreslí jako **odznak** na kartě. [03/10] *(d45, A4)*

### B/04 — Stránky
- Doplnit nepovinné pole pro popisek nad nadpisem, v administraci pojmenované
  **„Menší nadpis“** — u stránky i u bloků s nadpisem. [04/06] *(d48)*

### B/05 — E-shop
- Doplnit k produktu **perex** a napojit na něj kontrolu „chybí popis“, kterou seznam
  produktů už používá. [05/01] *(d3)*
- **Odebrat „Připojené galerie“ u produktu** (`src/views/products/ProductEdit.vue:385`,
  `GalleryField`). [05/11] *(d38)*
- **Detail produktu bude** — adresa i blokový obsah u produktu mají smysl (SEO ne, viz A3).
  [05/06, 05/12, 05/13] *(d35)*
- Popis a náhledový obrázek kategorie **zatím ponechat**. [05/14] *(d38)*

### B/06 — Prohlídky
- Doplnit k prohlídce **typ prohlídky** a **náročnost** (schody / bezbariérové). Jazyky
  výkladu a místo srazu se nedoplňují. [06/01, 06/02] *(d1, d7)*
- Doplnit dva příznaky dostupnosti: **„Dočasně nedostupné“** (zůstane ve výpisu, bez
  nákupu) a **„bez termínů“** s polem platnosti vstupenky. Devět z dvaceti šesti prohlídek
  dnes žádný termín nemá. [06/06, 06/07] *(d8)*
- Doplnit prohlídce **ruční štítky** (minimálně „Pro děti“ a „Zdarma“) a filtry na webu
  pojmenovat podle toho, co skutečně filtrují. [06/13, 06/14] *(d12)*

---

### B/07 — Stav zapracování

Zapracováno v prototypu (8. 9. 2026), typová kontrola i build čisté:

| Modul | Hotovo |
|---|---|
| Prohlídky | typ + náročnost, příznaky dostupnosti (dočasně nedostupné, bez termínů + platnost), ruční štítky; odvozený stav dostupnosti oba příznaky respektuje i ve výpisu |
| Areál | správa záložek (přidat, přejmenovat, přeskládat, smazat, typ), výchozí sada podle webu, automatický výpis prohlídek, poznámka k provozu do info lišty, `mainPageId` a `PageGroupBar.vue` odstraněny |
| Galerie | perex u albumu, záložka Obsah zrušena, datum pořízení smazáno, sekce jen filtr, drag & drop pořadí, vazba na akci |
| Stránky | pole „Menší nadpis" u stránky i u bloků s nadpisem (`ContentBuilder`, náhled v `GraphicPattern`) |
| E-shop | perex + kontrola „chybí popis", připojené galerie odebrány |
| Průřezově | mrtvá SEO pole odstraněna z modelu (viz níže) |
| Kalendář akcí | vlastní typ akce i věková hodnota (nová `SelectWithCustom`), přepínač „obsazuje objekt", alba z akce jen zrcadlo |

Nezapracované z části B: nic. Práce na webu (mimo prototyp administrace): tlačítko podle
režimu prodeje [01/14], zobrazení poznámky k provozu v info liště [02/16], odznaky štítků
u albumů [03/10], přejmenování filtrů u prohlídek [06/13].

**Mrtvá SEO pole odstraněna z modelu.** Nález 03/13 je označil za mrtvá (žádný modul
je needitoval) a rozhodnutí 00/24 je uzavřelo bez možnosti přepsat, takže z modelu zmizely:
`metaTitle`, `metaDescription`, `metaKeywords` a `ogImage` u aktualit, albumů, produktů
a stránek, plus `canonicalUrl` u stránek. Obrázek pro sdílení u aktuality (náhled
příspěvku na Facebook) se teď odvozuje z hlavní fotky galerie.

Odstraněno i pole `page.allowIndexing` (přepínač indexování stránky) — ovládání
v administraci nemělo, takže bylo mrtvé stejně jako ostatní. Model stránky tím SEO
neřeší vůbec.

---

## C. Co se nemění

Vědomá rozhodnutí „nedoplňovat“ a „ponechat“. Nálezy tím nejsou vyvráceny, jen se
neřeší — u těch s dopadem je dopad uvedený.

| Bod | Rozhodnutí | Dopad, se kterým se počítá |
|---|---|---|
| 02/03, 02/04, 02/07, 02/08 | Hlavička budovy se nedoplňuje *(d14)* | Obrázek hlavičky, tlačítko na vstupenky, zvýrazněná část názvu a souhrn otevírací doby zůstávají mimo dosah redakce |
| 01/01–01/04, 01/20 | Lineup, harmonogram, info karty a FAQ přes content builder *(d21, A1)* | Harmonogram nebude strukturovaný — nejde řadit podle času ani filtrovat po scénách |
| 06/05 | Omezení, vybavení a místo srazu přes content builder *(d7, A1)* | Informace se nedostanou na kartu prohlídky, jen do textu detailu |
| 02/01, 02/02 | Dlouhý text a nadpisy sekcí u budovy přes content builder *(d5, A1)* | — |
| 06/09, 06/20 | Kategorie prohlídek zůstává jak je *(d10)* | Nadřazený popisek u kategorie nebude; „Menší nadpis“ z d48 se na 06/09 nevztahuje |
| 06/12 | Sadu kategorií prohlídek si určí redakce *(d11)* | Není nález administrace |
| 02/05 | Popisky dlaždic „Kam dál“ *(d16)* | Dlaždice jsou jen navigace na záložky |
| 02/13–02/15, 02/17 | Bezbariérovost, štítky, silueta, barva a dashboard u budovy zůstávají *(d19)* | Bezbariérovost a štítky u budovy zůstanou nevyužité |
| 01/06 | Související prohlídky u akce zůstanou statické *(d23)* | Vazba se needituje |
| 05/02 | Sleva u produktu se nezavádí *(d32)* | Sleva se dál obchází kategorií „Výprodej“, produkt tím zmizí z původní kategorie |
| 05/05 | Pořadí kategorií a produktů v e-shopu *(d34, A5)* | Redakce nevypíchne, co se má prodávat první |
| 05/07–05/09, 05/10 | Typy, kategorie, počty a množství do košíku řeší API *(d36, d37, A6)* | — |
| 03/07 | Obě cesty k fotkám u budovy zůstávají *(d43)* | Beze změny — `GalleryField` v Areálu už umí obojí: připojit album z modulu Galerie i nahrát fotky přímo u budovy; náhledovka se bere z galerie |
| 03/06 | Sada sekcí galerie *(d42, A6)* | Data v adminu jsou mock |
| 04/01 | Stránka Pronájem prostor se v prototypu nezakládá *(d46)* | Chybí referenční příklad členité stránky z bloků |
| 04/05, 04/10, 04/11 | Formuláře se přizpůsobí při výrobě administrace *(d47)* | — |
| 04/08 | Umístění stránky v menu a patičce *(d49)* | Řeší modul Patička |
| 04/13, 04/14 | Otevírací doba a měřicí kódy u stránky *(d50)* | Bloky budou v content builderu stránky Pronájem |
| 01/07, 03/13, 04/07 | SEO záložka nebude *(d24, A3)* | Titulek a popisek nejde přepsat, odvozují se |
| 01/09, 06/08, 06/10, 03/02, 03/04, 05/03, 05/04 | Texty kolem výpisů natvrdo v kódu *(A2)* | Storno podmínky, srazová místa a informace o doručení nemůže redakce změnit |

---

## D. Otevřené a odložené body

Zbytek zadání je uzavřený; těchto pět bodů je potřeba dorozhodnout, než se dotčená
místa přepíšou.

1. **01/10–01/13, 01/16 — pět polí u akce, která web nezobrazuje** *(d29)* — výslovně
   ponecháno otevřené. Jde o štítky akcí, podnadpis, čas konce a délku, kapacitu a volná
   místa a propagaci. U každého se rozhodne buď „doplnit na web“, nebo „odebrat z adminu“.
2. **02/12 (a s ním 01/19, 04/12) — seznam objektů areálu** *(d18)* — **odloženo** na
   výrobu administrace a plnění dat. Do té doby web pracuje s objekty, které administrace
   nezná.
3. **06/11 — cena prohlídky** *(d2)* — ceny i cenové kategorie posílá Colosseum, tabulka
   a popisky se skládají v content builderu. Zbývá ověřit, co všechno Colosseum posílá.
4. **06/16–06/19 — přebytky u detailu prohlídky** *(d13)* — blokový editor je content
   builder a zůstává (A1). U richtext popisu, galerie, kontaktního e-mailu a poznámky
   k platbě zbývá potvrdit, jestli se odeberou.
5. **01/08 — zvýrazněná akce ve výpisu** *(d22)* — rozhodnutí pokrylo věkový číselník,
   přepínač „Zvýraznit ve výpisu“ zůstal bez odpovědi.

**Formulace k potvrzení u 01/18** *(d27)*: zapsáno jako „zdrojem termínů a akcí pro web je
modul Kalendář akcí“. Vychází z toho, že prohlídky se do kalendáře **nezadávají ručně
podruhé** — jejich termíny do něj přicházejí z modulu Prohlídky. Pokud prohlídky do
kalendáře akcí patřit nemají vůbec, je to jednovětá oprava zde i v bodu B/01.

---

## E. Tabulka rozhodnutí → nálezy

Číslo rozhodnutí odpovídá reviznímu přehledu (00/01–00/50). Nálezy jsou body z [`nalezy.md`](nalezy.md).

| # | Modul | Rozhodnutí | Nálezy |
|---|---|---|---|
| 00/01 | Prohlídky | Karta prohlídky: chybí typ, náročnost a jazyky — Doplnit typ prohlídky a náročnost; jazyky výkladu a místo srazu ne | 06/01 · 06/02 · 06/03 · 06/04 |
| 00/02 | Prohlídky | Cena prohlídky: odkud se má brát — Ceny z Colossea, tabulka a popisky v content builderu; rozsah dat od Colossea ověřit | 06/11 |
| 00/03 | E-shop | Produkt: popis na kartě nejde napsat — Doplnit k produktu perex | 05/01 |
| 00/04 | Galerie | Album galerie: popis pod názvem nejde napsat — Doplnit k albumu perex, blokový editor v záložce Obsah zrušit | 03/01 |
| 00/05 | Areál | Budova: dlouhý text „O objektu“ nejde napsat — Nedoplňovat — dlouhý text i nadpisy sekcí přes content builder | 02/01 · 02/02 |
| 00/06 | Areál | Záložky budovy: jiná sada a nejdou spravovat — Doplnit správu záložek budovy; nová záložka = content builder | 02/06 · 02/10 |
| 00/07 | Prohlídky | Prohlídka: omezení, vybavení a místo srazu — Nedoplňovat — omezení, vybavení i místo srazu přes content builder | 06/05 |
| 00/08 | Prohlídky | Dostupnost prohlídky: nedostupná a bez termínů — Doplnit oba příznaky: „Dočasně nedostupné“ a „bez termínů“ s platností vstupenky | 06/06 · 06/07 |
| 00/09 | Prohlídky | Texty kolem výpisu prohlídek — Texty kolem výpisu zůstávají natvrdo v kódu | 06/08 · 06/10 |
| 00/10 | Prohlídky | Kategorie prohlídek: nadpisy a nevyužitý obsah — Nedoplňovat — kategorie prohlídek zůstává jak je, popis i fotky ponechat | 06/09 · 06/20 |
| 00/11 | Prohlídky | Tři kategorie proti šesti skupinám na webu — Neřeší administrace — sadu kategorií si určí redakce | 06/12 |
| 00/12 | Prohlídky | Filtry u prohlídek: štítky, které nikdo nezadává — Doplnit prohlídce ruční štítky, filtry na webu přejmenovat podle toho, co filtrují | 06/13 · 06/14 |
| 00/13 | Prohlídky | Detail prohlídky: co admin nabízí a web nezobrazuje — Blokový editor = content builder, zůstává; rozsah ostatních přebytků potvrdit (viz D/4) | 06/15 · 06/16 · 06/17 · 06/18 · 06/19 |
| 00/14 | Areál | Hlavička budovy: čtyři údaje, které nejdou nastavit — Nedoplňovat — hlavička budovy zůstává bez editace redakcí | 02/03 · 02/04 · 02/07 · 02/08 |
| 00/15 | Areál | Záložka budovy: výpis z modulu, nebo psaný text? — Záložka Prohlídky = automatický výpis z modulu Prohlídky, nic se nepíše | 02/09 |
| 00/16 | Areál | Popisky dlaždic „Kam dál“ u budovy — Nedoplňovat — dlaždice „Kam dál“ jsou jen navigace | 02/05 |
| 00/17 | Areál | Obsah záložek: v Areálu, nebo v modulu Stránky? — Obsah záložek v Areálu (pageTabs per budova), vazba na modul Stránky z modelu ven | 02/11 |
| 00/18 | Areál | Landek Park: web s ním pracuje, administrace ho nezná — Odloženo na výrobu administrace a plnění dat | 02/12 (a s ním 01/19 a 04/12) |
| 00/19 | Areál | Budova: čtyři pole, která web nezobrazuje — Ponechat vše jak je — bezbariérovost, štítky, silueta, barva i dashboard zůstávají | 02/13 · 02/14 · 02/15 · 02/17 |
| 00/20 | Areál | Poznámka k provozu: kde ji web ukáže? — Poznámka k provozu se na webu zobrazí v horní informační liště | 02/16 |
| 00/21 | Kalendář akcí | Detail akce: čtyři sekce, které admin neumí — Nedoplňovat — lineup, harmonogram, info karty i FAQ přes content builder | 01/01 · 01/02 · 01/03 · 01/04 · 01/20 |
| 00/22 | Kalendář akcí | Karta akce: věkové omezení a zvýraznění — Doplnit možnost vlastní věkové hodnoty; zvýraznění ve výpisu (01/08) otevřené | 01/05 · 01/08 |
| 00/23 | Kalendář akcí | Související prohlídky u akce — Nedoplňovat — související prohlídky u akce zůstanou statické | 01/06 |
| 00/24 | Kalendář akcí | SEO: nejde nastavit v žádném modulu — SEO záložka nebude; titulek a popisek se odvozují, bez možnosti přepsat | 01/07 (a s ním 03/13 a 04/07) |
| 00/25 | Kalendář akcí | Texty kolem výpisu akcí — Texty kolem výpisu akcí zůstávají natvrdo v kódu | 01/09 |
| 00/26 | Kalendář akcí | Číselník typů akcí se rozchází — Doplnit možnost napsat si vlastní typ akce | 01/17 |
| 00/27 | Kalendář akcí | Patří prohlídky do kalendáře akcí? — Zdrojem termínů a akcí pro web je modul Kalendář akcí (formulace k potvrzení, viz D) | 01/18 |
| 00/29 | Kalendář akcí | Akce: pět polí, která web nezobrazuje — Otevřeno — rozhodne se u každého pole zvlášť | 01/10 · 01/11 · 01/12 · 01/13 · 01/16 |
| 00/30 | Kalendář akcí | Režimy prodeje vstupenek se na webu neprojeví — Web mění tlačítko podle režimu prodeje (koupit / externí odkaz / na místě / bez) | 01/14 |
| 00/31 | Kalendář akcí | Akce obsazuje budovu: pole bez editoru — Doplnit k akci přepínač „obsazuje objekt“ do Termínu a místa | 01/15 |
| 00/32 | E-shop | Sleva u produktu se nedá zapnout — Nedoplňovat — sleva u produktu se nezavádí | 05/02 |
| 00/33 | E-shop | Texty kolem výpisu e-shopu — Texty kolem výpisu e-shopu zůstávají natvrdo v kódu | 05/03 · 05/04 |
| 00/34 | E-shop | Pořadí kategorií a produktů na webu — Nedoplňovat — pořadí kategorií a produktů v e-shopu se neřeší | 05/05 |
| 00/35 | E-shop | Bude detail produktu? — Detail produktu bude — adresa i blokový obsah mají smysl, SEO ne | 05/06 · 05/12 · 05/13 |
| 00/36 | E-shop | Kategorie a typy zboží: tři nesrovnalosti naráz — Neřešit — typy, kategorie i počty řeší API Colossea, data v adminu jsou mock | 05/07 · 05/08 · 05/09 |
| 00/37 | E-shop | Počet kusů a odkaz do košíku — Nechat jak je — předávání množství do košíku řeší API | 05/10 |
| 00/38 | E-shop | E-shop: dvě nevyužitá místa — Připojené galerie u produktu odebrat, popis a obrázek kategorie zatím ponechat | 05/11 · 05/14 |
| 00/39 | Galerie | Texty kolem výpisu galerie — Texty kolem výpisu galerie zůstávají natvrdo v kódu | 03/02 · 03/04 |
| 00/40 | Galerie | Pořadí sekcí a alb v galerii — Pořadí sekcí i alb v galerii měnit drag & drop | 03/03 |
| 00/41 | Galerie | Sekce galerie: filtr, nebo vlastní stránka? — Sekce = jen filtr: popis a obrázek odebrat, publikaci po jazycích ponechat | 03/05 · 03/12 |
| 00/42 | Galerie | Dvě sekce na webu proti čtyřem v administraci — Neřešit — sekce v adminu jsou mock data | 03/06 |
| 00/43 | Galerie | Tři cesty k fotkám u budovy — Fotky musí být možné přidat i přímo u budovy, nejen výběrem albumu | 03/07 |
| 00/44 | Galerie | Album z akce nemá vazbu na akci — Vazbu vlastní album — doplnit u albumu volitelnou vazbu na akci | 03/08 |
| 00/45 | Galerie | Album: tři pole, která web nezobrazuje — Perex doplnit, počet fotek automaticky, „Datum pořízení“ smazat, štítky = odznak na webu | 03/09 · 03/10 · 03/11 |
| 00/46 | Stránky | Stránka Pronájem prostor v administraci není — Neřešit — stránka Pronájem se v prototypu nezakládá, admin nemá ostrá data | 04/01 |
| 00/47 | Stránky | Formulář: pole, umístění a čtyři paralelní nastavení — Neřešit nyní — formuláře se přizpůsobí při výrobě administrace | 04/05 · 04/10 · 04/11 |
| 00/48 | Stránky | Nadřazený popisek nad nadpisem — Doplnit pole „Menší nadpis“ ke stránce a blokům s nadpisem; kategorie prohlídek ne (platí 00/10) | 04/06 (a s ním 02/02 a 06/09) |
| 00/49 | Stránky | Umístění stránky v menu a v patičce — Neřešit — umístění v patičce řeší modul Patička | 04/08 |
| 00/50 | Stránky | Stránka: dvě nastavení, která tam nepatří — Neřešit — stránka Pronájem dostane content builder, bloky budou v něm | 04/13 · 04/14 |

---

*Vypracováno na základě revizního přehledu z 8. 9. 2026. Změny v rozhodnutích patří sem, ne do `nalezy.md` — ten zůstává popisem stavu k 4. 9. 2026.*
