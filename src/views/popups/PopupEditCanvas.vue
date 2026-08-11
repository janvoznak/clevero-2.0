<script setup lang="ts">
/**
 * Pop-up editor — VERZE 2 „Plátno" (WYSIWYG, AI-first).
 * Místo formulářových polí se okno tvoří přímo v náhledu: uživatel píše do okna,
 * mění vzhled/fotku/pozici/velikost na místě a hned vidí výsledek. AI pomáhá
 * napříč tvorbou (návrh celého okna z promptu, nadpisy, fotka, motivy, tipy,
 * překlad). Prototyp: veškerá AI je předstíraná (ref + setTimeout), bez modelu.
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import AiPanel from '@/components/admin/AiPanel.vue'
import CanvasEditable from '@/components/admin/popup/CanvasEditable.vue'
import EditorVersionSwitch from '@/components/admin/popup/EditorVersionSwitch.vue'
import PopupPositionPicker from '@/components/admin/popup/PopupPositionPicker.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_POPUPS,
  popupState,
  POPUP_STATE_META,
  POPUP_POSITION_LABELS,
  PREDEFINED_TEMPLATES,
} from '@/data/mockPopups'
import type { PopupItem, PopupPosition } from '@/data/mockPopups'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_POPUPS.find((p) => p.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): PopupItem {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  return {
    id: 'nové',
    title: empty(),
    titleUrl: '',
    text: empty(),
    image: null,
    position: 'center',
    widthPercent: 30,
    from: null,
    to: null,
    enabled: true,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '',
    // Nové okno: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
  }
}

const form = reactive<PopupItem>(clone())
const activeLang = ref<LangCode>('cs')
const state = computed(() => popupState(form))

/* Proxy na ML pole v aktivním jazyce — v-model na komponentě (CanvasEditable)
   nesnese indexovaný cíl přímo, proto přes computed. */
const titleML = computed({
  get: () => form.title[activeLang.value],
  set: (v: string) => (form.title[activeLang.value] = v),
})
const textML = computed({
  get: () => form.text[activeLang.value],
  set: (v: string) => (form.text[activeLang.value] = v),
})

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/* ============================================================
   Vzhled (motiv) — lokální stav plátna (prototyp, neukládá se do modelu).
   AI navrhuje motivy; uživatel klikne a okno se obarví.
   ============================================================ */
interface CanvasTheme {
  id: string
  name: string
  recommended?: boolean
  swatch: string
  card: string
  sub: string
  accent: string
  accentText: string
  /** Barva „eyebrow" popisku a tečky nad nadpisem. */
  kicker: string
  kickerDot: string
}
const THEMES: CanvasTheme[] = [
  {
    id: 'light',
    name: 'Světlá',
    swatch: 'bg-white ring-1 ring-steel-200',
    card: 'bg-white text-graphite-900',
    sub: 'text-steel-600',
    accent: 'bg-brand-500 hover:bg-brand-600',
    accentText: 'text-white',
    kicker: 'text-brand-600',
    kickerDot: 'bg-brand-500',
  },
  {
    id: 'terracotta',
    name: 'Terakota',
    recommended: true,
    swatch: 'bg-gradient-to-br from-brand-500 to-brand-700',
    card: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
    sub: 'text-white/80',
    accent: 'bg-white hover:bg-white/90',
    accentText: 'text-brand-700',
    kicker: 'text-white/85',
    kickerDot: 'bg-white',
  },
  {
    id: 'dark',
    name: 'Tmavá',
    swatch: 'bg-graphite-900',
    card: 'bg-graphite-900 text-white',
    sub: 'text-steel-300',
    accent: 'bg-brand-500 hover:bg-brand-600',
    accentText: 'text-white',
    kicker: 'text-brand-400',
    kickerDot: 'bg-brand-400',
  },
  {
    id: 'soft',
    name: 'Jemná',
    swatch: 'bg-steel-100 ring-1 ring-steel-200',
    card: 'bg-steel-50 text-graphite-900 ring-1 ring-steel-200',
    sub: 'text-steel-600',
    accent: 'bg-graphite-900 hover:bg-graphite-800',
    accentText: 'text-white',
    kicker: 'text-brand-600',
    kickerDot: 'bg-brand-500',
  },
]
const activeThemeId = ref('light')
const theme = computed(() => THEMES.find((t) => t.id === activeThemeId.value) ?? THEMES[0])

/** Barvy textu okna: na fotce světlé (přes tmavý přechod), jinak dle motivu. */
const overlay = computed(() =>
  form.image
    ? { eyebrow: 'text-white/85', dot: 'bg-white', title: 'text-white', body: 'text-white/90', secondary: 'text-white/75' }
    : { eyebrow: theme.value.kicker, dot: theme.value.kickerDot, title: '', body: theme.value.sub, secondary: theme.value.sub },
)

/* ============================================================
   Rozměr a poloha okna na plátně (mini-viewport).
   Šířka = % šířky obrazovky (responzivně); výška se řídí obsahem okna.
   ============================================================ */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
const boxWpct = computed(() => clamp(form.widthPercent, 14, 100))

const POS_ALIGN: Record<PopupPosition, string> = {
  'top-left': 'items-start justify-start',
  'top-center': 'items-start justify-center',
  'top-right': 'items-start justify-end',
  'middle-left': 'items-center justify-start',
  center: 'items-center justify-center',
  'middle-right': 'items-center justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-center': 'items-end justify-center',
  'bottom-right': 'items-end justify-end',
}

const sizeLabel = computed(() => `${form.widthPercent} % šířky`)

/* Resize tažením za pravý okraj okna — mění jen šířku (v %). Výška je dle obsahu. */
const pageRef = ref<HTMLElement>()
const resizing = ref(false)
function startResize(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  const rect = pageRef.value?.getBoundingClientRect()
  if (!rect) return
  const sx = e.clientX
  const startW = form.widthPercent
  resizing.value = true
  function move(ev: PointerEvent) {
    const dxFrac = (ev.clientX - sx) / rect!.width
    form.widthPercent = clamp(Math.round(startW + dxFrac * 100), 12, 100)
  }
  function up() {
    resizing.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

/* ============================================================
   Obrázek (prototyp — výběr z galerie / „vygenerování" AI).
   ============================================================ */
const GALLERY = ['/images/g1.jpg', '/images/g3.jpg', '/images/g5.jpg', '/images/g8.jpg', '/images/g11.jpg']
let galleryIdx = 0
function pickFromGallery() {
  form.image = GALLERY[galleryIdx % GALLERY.length]
  galleryIdx++
}
const generatingImage = ref(false)
function generateImage() {
  if (generatingImage.value) return
  generatingImage.value = true
  window.setTimeout(() => {
    form.image = GALLERY[(galleryIdx++) % GALLERY.length]
    generatingImage.value = false
    fireToast('AI navrhla obrázek podle obsahu okna')
  }, 1400)
}

/* ============================================================
   AI Composer — hlavní vstup: z popisu vytvoří celé okno.
   ============================================================ */
const aiPrompt = ref('')
const aiComposing = ref(false)

function cap(s: string): string {
  const t = s.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}
function draftTitle(prompt: string): string {
  const first = prompt.split(/[.!?\n]/)[0].trim()
  return cap(first.length > 56 ? first.slice(0, 53) + '…' : first)
}

function aiCompose() {
  const p = aiPrompt.value.trim()
  if (!p || aiComposing.value) return
  aiComposing.value = true
  window.setTimeout(() => {
    form.title[activeLang.value] = draftTitle(p)
    form.text[activeLang.value] = `<p>${cap(p)}</p><p>Nenechte si to ujít — počet míst je omezený.</p>`
    // Heuristika: podle obsahu zvol polohu, velikost a motiv.
    if (/oznám|změn|uzáv|otevírac|doba|provoz/i.test(p)) {
      form.position = 'top-center'
      form.widthPercent = 100
      form.popupFrame = false
      activeThemeId.value = 'soft'
    } else if (/sleva|prodej|balíč|vstupenk|nabídk|akce|kupón/i.test(p)) {
      form.position = 'bottom-right'
      form.widthPercent = 34
      form.popupFrame = true
      activeThemeId.value = 'terracotta'
    } else {
      form.position = 'center'
      form.widthPercent = 42
      form.popupFrame = true
      activeThemeId.value = 'light'
    }
    if (!form.titleUrl) form.titleUrl = '/aktuality'
    if (!form.image) form.image = GALLERY[(galleryIdx++) % GALLERY.length]
    activeLang.value = SOURCE_LANG
    aiComposing.value = false
    fireToast('AI vytvořila návrh okna — dolaďte ho přímo na plátně')
  }, 1800)
}

/** Inspirace = předdefinované šablony jako startovní prompty. */
function useInspiration(tplId: string) {
  const tpl = PREDEFINED_TEMPLATES.find((t) => t.id === tplId)
  if (!tpl) return
  aiPrompt.value = plainText(tpl.apply.text) || tpl.name
}

/* ============================================================
   AI návrhy nadpisu (Popover se 3 variantami).
   ============================================================ */
const titleIdeas = computed(() => {
  const base = form.title[activeLang.value].trim() || plainText(form.text[activeLang.value]).slice(0, 40) || 'Novinka v Dolních Vítkovicích'
  return [cap(base), `Právě teď: ${cap(base)}`, `${cap(base)} — nenechte si ujít`]
})
function applyTitle(t: string) {
  form.title[activeLang.value] = t
  fireToast('Nadpis nahrazen návrhem AI')
}

/* ============================================================
   AI úpravy textu (návrh / zkrácení / tón).
   ============================================================ */
const aiTextWorking = ref(false)
function aiText(kind: 'draft' | 'shorten' | 'tone') {
  if (aiTextWorking.value) return
  aiTextWorking.value = true
  window.setTimeout(() => {
    const cur = plainText(form.text[activeLang.value])
    if (kind === 'draft' || !cur) {
      form.text[activeLang.value] =
        '<p>Zveme vás do areálu Dolních Vítkovic. Připravili jsme program pro celou rodinu.</p><p>Rezervujte si vstup online a využijte zvýhodněné vstupné.</p>'
    } else if (kind === 'shorten') {
      const short = cur.split(/[.!?]/)[0].trim()
      form.text[activeLang.value] = `<p>${short}.</p>`
    } else {
      form.text[activeLang.value] = `<p>Budeme moc rádi, když se k nám vypravíte. ${cur}</p>`
    }
    aiTextWorking.value = false
    fireToast(
      kind === 'shorten' ? 'Text zkrácen' : kind === 'tone' ? 'Text v přátelštějším tónu' : 'Text navržen AI',
    )
  }, 1200)
}

/* ============================================================
   AI překlad (stejný vzor jako klasický editor).
   ============================================================ */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const field of ['title', 'text'] as const) {
      const val = form[field] as ML
      const src = val[SOURCE_LANG]
      for (const t of targetLangs) if (src) val[t.code] = src
    }
    translating.value = false
    fireToast(`Přeloženo z CZ do ${targetLangs.map((l) => l.code.toUpperCase()).join(', ')}`)
  }, 1500)
}

/* ============================================================
   Kontextové tipy od AI (reagují na aktuální stav okna).
   ============================================================ */
const aiTips = computed(() => {
  const t: string[] = []
  const title = form.title[activeLang.value]
  if (!title) t.push('Začněte výstižným nadpisem — nebo si nechte navrhnout celé okno od AI.')
  else if (title.length > 60) t.push('Nadpis je dlouhý; kratší (do ~50 znaků) zaujme víc.')
  if (!form.image) t.push('Fotka zvýší pozornost — vyberte z galerie nebo ji nechte vygenerovat.')
  if (!plainText(form.text[activeLang.value])) t.push('Přidejte 1–2 věty a jasnou výzvu k akci.')
  if (form.position !== 'center' && boxWpct.value > 62)
    t.push('Velké okno v rohu působí těžkopádně — zmenšete ho, nebo zvolte střed.')
  if (!t.length) t.push('Vypadá skvěle. Doplňte jazykové mutace přes AI překlad v pravém panelu.')
  return t.slice(0, 3)
})

/* ---------- Ukládání (prototyp — jen lokální stav) ---------- */
const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveAndBack() {
  router.push({ name: 'popups-list' })
}

/* ---------- Toast ---------- */
const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3000)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          aria-label="Zpět"
          @click="router.push({ name: 'popups-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">popup</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/popups/${form.id}/canvas` : '/admin/popups/new · plátno' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nové pop-up okno' }}
          </h1>
        </div>

        <EditorVersionSwitch :id="props.id" class="hidden md:inline-flex" />

        <!-- Jazykový přepínač -->
        <TabsRoot
          :model-value="activeLang"
          class="hidden lg:block"
          @update:model-value="(v) => (activeLang = v as LangCode)"
        >
          <TabsList
            class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1"
            aria-label="Jazyková mutace"
          >
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>
              {{ l.code.toUpperCase() }}
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'"
              />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit a zůstat' }}
        </AppButton>
        <AppButton variant="primary" @click="saveAndBack">
          <Icon name="check" :size="16" />
          Uložit a zpět
        </AppButton>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: název + AI composer + toolbar + živé plátno -->
      <div class="min-w-0 space-y-5">
        <!-- Název (jediné klasické pole) -->
        <div>
          <label class="mb-1.5 flex items-center justify-between">
            <span class="text-[13px] font-600 text-graphite-800">Název záznamu <span class="text-brand-500">*</span></span>
            <span class="field-tag">popup-title · {{ activeLang.toUpperCase() }}</span>
          </label>
          <input
            v-model="form.title[activeLang]"
            type="text"
            placeholder="Interní název pop-up okna"
            class="h-12 w-full rounded-lg border border-steel-200 px-4 text-[16px] font-600 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          />
          <p class="mt-1 text-[11.5px] text-steel-500">
            Nadpis se zároveň propisuje do okna níže — můžete ho upravit i přímo na plátně.
          </p>
        </div>

        <!-- AI Composer (sjednocený AI blok) -->
        <AiPanel title="Vytvořit okno s AI" badge="AI-first" hint="Popiš, co chceš oznámit, a AI vytvoří celé okno.">
          <textarea
            v-model="aiPrompt"
            rows="2"
            placeholder="Popište, co chcete návštěvníkům oznámit — např. Noční prohlídky dolu Hlubina, omezená kapacita, odkaz na rezervaci."
            class="w-full resize-none rounded-lg border border-steel-200 bg-white px-3.5 py-2.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          />
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <AppButton variant="primary" size="sm" :disabled="!aiPrompt.trim() || aiComposing" @click="aiCompose">
              <Icon name="sparkles" :size="15" :class="aiComposing && 'animate-pulse'" />
              {{ aiComposing ? 'Tvořím okno…' : 'Vytvořit pop-up' }}
            </AppButton>
            <span class="text-[11.5px] text-steel-500">nebo začněte z inspirace:</span>
            <button
              v-for="tpl in PREDEFINED_TEMPLATES"
              :key="tpl.id"
              class="rounded-full border border-steel-200 bg-white px-2.5 py-1 text-[11.5px] font-500 text-graphite-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              @click="useInspiration(tpl.id)"
            >
              {{ tpl.category }}
            </button>
          </div>
        </AiPanel>

        <!-- Toolbar plátna: motivy + rámeček + poloha + velikost -->
        <div class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-steel-200 bg-white px-4 py-3">
          <!-- Motivy (AI vzhledy) -->
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-600 uppercase tracking-wide text-steel-500">Vzhled</span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="t in THEMES"
                :key="t.id"
                :title="t.name + (t.recommended ? ' · doporučeno AI' : '')"
                :aria-label="t.name"
                class="relative h-7 w-7 rounded-md outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-500/40"
                :class="[t.swatch, activeThemeId === t.id ? 'ring-2 ring-brand-500 ring-offset-1' : '']"
                @click="activeThemeId = t.id"
              >
                <span
                  v-if="t.recommended"
                  class="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-brand-500 text-white"
                >
                  <Icon name="sparkles" :size="9" />
                </span>
              </button>
            </div>
          </div>

          <div class="h-6 w-px bg-steel-200" />

          <!-- Rámeček -->
          <AppSwitch v-model="form.popupFrame" label="Rámeček" aria-label="Zobrazit rámeček okna" />

          <div class="h-6 w-px bg-steel-200" />

          <!-- Poloha (Popover s 3×3 pickerem) -->
          <PopoverRoot>
            <PopoverTrigger
              class="inline-flex items-center gap-1.5 rounded-md border border-steel-200 px-2.5 py-1.5 text-[12.5px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50"
            >
              <Icon name="layout" :size="15" class="text-steel-500" />
              {{ POPUP_POSITION_LABELS[form.position] }}
              <Icon name="chevronDown" :size="14" class="text-steel-400" />
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                :side-offset="6"
                class="z-50 w-64 rounded-lg border border-steel-200 bg-white p-3 shadow-xl outline-none"
              >
                <PopupPositionPicker v-model="form.position" />
                <PopoverArrow class="fill-white" />
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>

          <div class="ml-auto flex items-center gap-2">
            <Icon name="resize" :size="14" class="text-steel-400" />
            <span class="rounded bg-graphite-900 px-2 py-1 font-mono text-[11px] tabular-nums text-white">{{ sizeLabel }}</span>
          </div>
        </div>

        <!-- ŽIVÉ PLÁTNO -->
        <div class="overflow-hidden rounded-xl border border-steel-300 bg-steel-200/50 shadow-inner">
          <!-- Faux prohlížeč -->
          <div class="flex items-center gap-2 border-b border-steel-300 bg-steel-100 px-4 py-2">
            <span class="h-2.5 w-2.5 rounded-full bg-danger-500/60" />
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span class="h-2.5 w-2.5 rounded-full bg-forge-500/60" />
            <span class="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-center font-mono text-[11px] text-steel-500">
              dolnivitkovice.cz
            </span>
            <span class="text-[10.5px] font-600 uppercase tracking-wide text-steel-400">Živý náhled</span>
          </div>

          <!-- Plocha stránky s dim overlayem a oknem -->
          <div ref="pageRef" class="relative h-[560px] overflow-hidden bg-steel-50">
            <!-- Skeleton reálného webu za oknem (jen kulisa pro kontext) -->
            <div class="pointer-events-none absolute inset-0 select-none" aria-hidden="true">
              <!-- Navigace webu -->
              <div class="flex items-center justify-between border-b border-steel-200 bg-white px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="h-6 w-6 rounded-md bg-brand-500/80" />
                  <span class="h-3 w-28 rounded bg-steel-300" />
                </div>
                <div class="hidden items-center gap-5 sm:flex">
                  <span class="h-2.5 w-14 rounded bg-steel-200" />
                  <span class="h-2.5 w-16 rounded bg-steel-200" />
                  <span class="h-2.5 w-12 rounded bg-steel-200" />
                  <span class="h-7 w-20 rounded-md bg-steel-300" />
                </div>
              </div>
              <!-- Hero webu -->
              <div class="px-6 pt-10">
                <span class="block h-3 w-24 rounded bg-brand-500/40" />
                <span class="mt-4 block h-7 w-2/3 rounded bg-steel-300" />
                <span class="mt-3 block h-7 w-1/2 rounded bg-steel-300" />
                <span class="mt-5 block h-3 w-3/5 rounded bg-steel-200" />
                <span class="mt-2 block h-3 w-2/5 rounded bg-steel-200" />
                <span class="mt-6 block h-9 w-36 rounded-md bg-steel-300" />
              </div>
              <!-- Kartičky webu -->
              <div class="mt-10 grid grid-cols-3 gap-4 px-6">
                <div v-for="n in 3" :key="n" class="rounded-xl border border-steel-200 bg-white p-3">
                  <span class="block h-20 w-full rounded-lg bg-steel-200" />
                  <span class="mt-3 block h-2.5 w-3/4 rounded bg-steel-200" />
                  <span class="mt-2 block h-2.5 w-1/2 rounded bg-steel-100" />
                </div>
              </div>
            </div>

            <!-- Ztmavení stránky pod oknem -->
            <div class="absolute inset-0 bg-graphite-950/55 backdrop-blur-[1px]" />

            <div :class="['absolute inset-0 flex p-5 sm:p-8', POS_ALIGN[form.position]]">
              <!-- Samotné pop-up okno -->
              <div
                class="group/popup relative flex min-h-0 flex-col overflow-hidden rounded-2xl transition-shadow"
                :class="[
                  theme.card,
                  form.popupFrame ? 'shadow-2xl ring-1 ring-black/5' : 'shadow-lg',
                  resizing ? 'outline outline-2 outline-brand-500' : '',
                ]"
                :style="{ width: boxWpct + '%', maxHeight: '92%' }"
              >
                <!-- Celoplošný obrázek jako pozadí okna + tmavý přechod pro čitelnost textu -->
                <template v-if="form.image">
                  <img :src="form.image" alt="" class="absolute inset-0 h-full w-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/15" />
                </template>

                <!-- Reálné zavírací tlačítko okna -->
                <span
                  class="absolute right-3 top-3 z-20 grid h-7 w-7 place-items-center rounded-full backdrop-blur-sm"
                  :class="form.image ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-black/5 text-current/50 hover:bg-black/10'"
                  aria-hidden="true"
                >
                  <Icon name="x" :size="14" />
                </span>

                <!-- Obsah okna přes obrázek (dole zarovnaný) -->
                <div
                  class="scroll-thin relative z-10 flex min-h-0 flex-1 flex-col overflow-auto p-6 sm:p-7"
                  :class="form.image ? 'justify-end' : 'justify-start'"
                >
                  <!-- Eyebrow (kontext / značka) -->
                  <div :class="['mb-2.5 flex items-center gap-2 text-[11px] font-700 uppercase tracking-[0.14em]', overlay.eyebrow]">
                    <span :class="['h-1.5 w-1.5 rounded-full', overlay.dot]" />
                    Dolní Vítkovice
                  </div>

                  <!-- Nadpis (inline editace) -->
                  <CanvasEditable
                    v-model="titleML"
                    mode="text"
                    :reset-key="activeLang"
                    placeholder="Napište nadpis okna…"
                    :class="['font-display text-[22px] font-800 leading-[1.15] tracking-tight', overlay.title]"
                  />

                  <!-- Text (inline editace) -->
                  <CanvasEditable
                    v-model="textML"
                    mode="html"
                    :reset-key="activeLang"
                    placeholder="Napište text okna…"
                    :class="['mt-2.5 text-[14px] leading-relaxed', overlay.body]"
                  />

                  <!-- CTA + sekundární „Teď ne" (reálné akce pop-upu) -->
                  <div class="mt-5 flex items-center gap-4">
                    <PopoverRoot>
                      <PopoverTrigger
                        :class="['inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-700 shadow-lg outline-none transition-all hover:-translate-y-px hover:shadow-xl', theme.accent, theme.accentText]"
                      >
                        Zjistit více
                        <Icon name="chevronRight" :size="16" />
                      </PopoverTrigger>
                      <PopoverPortal>
                        <PopoverContent
                          :side-offset="6"
                          align="start"
                          class="z-50 w-72 rounded-lg border border-steel-200 bg-white p-3 text-graphite-900 shadow-xl outline-none"
                        >
                          <p class="mb-1.5 text-[12px] font-600 text-graphite-800">Cíl tlačítka</p>
                          <div class="relative">
                            <Icon name="link" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
                            <input
                              v-model="form.titleUrl"
                              type="text"
                              placeholder="/aktuality/… nebo https://…"
                              class="h-9 w-full rounded-md border border-steel-200 pl-8 pr-2 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                          <div class="mt-2.5">
                            <AppSwitch v-model="form.newWindow" label="Otevřít v novém okně" aria-label="Otevřít v novém okně" />
                          </div>
                          <PopoverArrow class="fill-white" />
                        </PopoverContent>
                      </PopoverPortal>
                    </PopoverRoot>
                    <span :class="['text-[13px] font-500 opacity-80', overlay.secondary]">Teď ne, děkuji</span>
                  </div>
                </div>

                <!-- Plovoucí editační lišta (jen na hover; není součástí okna) -->
                <div
                  class="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-2 opacity-0 transition-opacity group-hover/popup:opacity-100"
                >
                  <div
                    class="pointer-events-auto flex items-center gap-0.5 rounded-full bg-graphite-900/92 px-1.5 py-1 text-white shadow-xl ring-1 ring-white/10 backdrop-blur"
                  >
                    <!-- Nadpis -->
                    <PopoverRoot>
                      <PopoverTrigger
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-600 text-white/90 outline-none transition-colors hover:bg-white/15"
                      >
                        <Icon name="sparkles" :size="13" /> Nadpis
                      </PopoverTrigger>
                      <PopoverPortal>
                        <PopoverContent
                          :side-offset="8"
                          class="z-50 w-72 rounded-lg border border-steel-200 bg-white p-2 text-graphite-900 shadow-xl outline-none"
                        >
                          <p class="px-2 py-1.5 text-[11px] font-600 uppercase tracking-wide text-steel-500">Návrhy nadpisu</p>
                          <PopoverClose
                            v-for="(idea, i) in titleIdeas"
                            :key="i"
                            class="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-[13px] text-graphite-800 outline-none transition-colors hover:bg-brand-50"
                            @click="applyTitle(idea)"
                          >
                            <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                            {{ idea }}
                          </PopoverClose>
                          <PopoverArrow class="fill-white" />
                        </PopoverContent>
                      </PopoverPortal>
                    </PopoverRoot>

                    <span class="mx-0.5 h-4 w-px bg-white/15" />

                    <!-- Text -->
                    <PopoverRoot>
                      <PopoverTrigger
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-600 text-white/90 outline-none transition-colors hover:bg-white/15"
                      >
                        <Icon name="sparkles" :size="13" :class="aiTextWorking && 'animate-pulse'" /> Text
                      </PopoverTrigger>
                      <PopoverPortal>
                        <PopoverContent
                          :side-offset="8"
                          class="z-50 w-52 rounded-lg border border-steel-200 bg-white p-1.5 text-graphite-900 shadow-xl outline-none"
                        >
                          <PopoverClose
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-brand-50"
                            @click="aiText('draft')"
                          >
                            <Icon name="sparkles" :size="14" class="text-brand-500" /> Napsat návrh
                          </PopoverClose>
                          <PopoverClose
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-brand-50"
                            @click="aiText('shorten')"
                          >
                            <Icon name="quote" :size="14" class="text-brand-500" /> Zkrátit
                          </PopoverClose>
                          <PopoverClose
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-brand-50"
                            @click="aiText('tone')"
                          >
                            <Icon name="user" :size="14" class="text-brand-500" /> Přátelštější tón
                          </PopoverClose>
                          <PopoverArrow class="fill-white" />
                        </PopoverContent>
                      </PopoverPortal>
                    </PopoverRoot>

                    <span class="mx-0.5 h-4 w-px bg-white/15" />

                    <!-- Fotka -->
                    <PopoverRoot>
                      <PopoverTrigger
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-600 text-white/90 outline-none transition-colors hover:bg-white/15"
                      >
                        <Icon name="image" :size="13" :class="generatingImage && 'animate-pulse'" /> Fotka
                      </PopoverTrigger>
                      <PopoverPortal>
                        <PopoverContent
                          :side-offset="8"
                          class="z-50 w-52 rounded-lg border border-steel-200 bg-white p-1.5 text-graphite-900 shadow-xl outline-none"
                        >
                          <PopoverClose
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-brand-50"
                            @click="pickFromGallery"
                          >
                            <Icon name="gallery" :size="14" class="text-brand-500" /> Vybrat z galerie
                          </PopoverClose>
                          <PopoverClose
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors hover:bg-brand-50"
                            @click="generateImage"
                          >
                            <Icon name="sparkles" :size="14" class="text-brand-500" /> Vygenerovat fotku
                          </PopoverClose>
                          <PopoverClose
                            v-if="form.image"
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-danger-600 outline-none transition-colors hover:bg-danger-500/10"
                            @click="form.image = null"
                          >
                            <Icon name="trash" :size="14" /> Odebrat fotku
                          </PopoverClose>
                          <PopoverArrow class="fill-white" />
                        </PopoverContent>
                      </PopoverPortal>
                    </PopoverRoot>
                  </div>
                </div>

                <!-- Resize handle — jen šířka (pravý okraj); výška je dle obsahu -->
                <button
                  type="button"
                  class="absolute right-0 top-1/2 z-10 grid h-10 w-3.5 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded-l-md bg-brand-500 text-white opacity-0 shadow-sm outline-none transition-opacity hover:bg-brand-600 group-hover/popup:opacity-100 focus-visible:opacity-100"
                  aria-label="Změnit šířku okna tažením"
                  @pointerdown="startResize"
                >
                  <Icon name="resize" :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- AI tipy pod plátnem -->
        <div class="rounded-lg border border-steel-200 bg-white px-4 py-3">
          <p class="mb-2 flex items-center gap-1.5 text-[11px] font-700 uppercase tracking-wide text-steel-500">
            <Icon name="sparkles" :size="13" class="text-brand-500" /> Tipy od AI
          </p>
          <ul class="space-y-1.5">
            <li v-for="(tip, i) in aiTips" :key="i" class="flex items-start gap-2 text-[12.5px] leading-relaxed text-graphite-700">
              <Icon name="check" :size="14" class="mt-0.5 shrink-0 text-forge-500" />
              {{ tip }}
            </li>
          </ul>
        </div>
      </div>

      <!-- PRAVÝ rail (zachován z klasického editoru) -->
      <aside class="space-y-5 xl:sticky xl:top-[84px] xl:self-start">
        <!-- Přepínač verzí pro <md, kde se do headeru nevešel -->
        <div class="md:hidden"><EditorVersionSwitch :id="props.id" /></div>

        <!-- Zobrazování -->
        <FormSection title="Zobrazování" icon="calendar" tag="popup-from / popup-to">
          <div class="space-y-4">
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Aktuální stav</span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[POPUP_STATE_META[state].bg, POPUP_STATE_META[state].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="POPUP_STATE_META[state].dot" />
                {{ POPUP_STATE_META[state].label }}
              </span>
            </div>

            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.enabled" label="Zobrazovat" hint="Okno je aktivní" aria-label="Zobrazovat" />
              <span class="field-tag">popup-enabled</span>
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Od</span>
                <span class="field-tag">popup-from</span>
              </label>
              <input
                v-model="form.from"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Do</span>
                <span class="field-tag">popup-to</span>
              </label>
              <input
                v-model="form.to"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Platnost blokace (dny)</span>
                <span class="field-tag">popup-cookie_expiration</span>
              </label>
              <input
                v-model.number="form.cookieExpiration"
                type="number"
                min="0"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
              <p class="mt-1 text-[11.5px] leading-relaxed text-steel-500">
                Po zavření se okno návštěvníkovi znovu nezobrazí po tento počet dní.
              </p>
            </div>
          </div>
        </FormSection>

        <!-- Náhled na webu (prototyp — mrtvý odkaz) -->
        <FormSection title="Náhled" icon="eye">
          <a
            href="#"
            target="_blank"
            class="flex w-full items-center justify-center gap-2 rounded-md border border-steel-200 bg-white px-4 py-2.5 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 hover:text-graphite-900 focus-visible:ring-4 focus-visible:ring-brand-500/15"
            @click.prevent="fireToast('Náhled na webu je v prototypu jen ilustrační')"
          >
            <Icon name="eye" :size="16" /> Náhled na webu
          </a>
          <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">
            Otevře náhled pop-up okna na webu v novém okně.
          </p>
        </FormSection>

        <!-- Jazykové mutace + AI překlad -->
        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li
              v-for="l in LANGS"
              :key="l.code"
              class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors"
              :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'"
            >
              <button class="flex items-center gap-2.5 text-left" @click="activeLang = l.code">
                <span>{{ l.flag }}</span>
                <span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span>
              </button>
              <span
                class="inline-flex items-center gap-1.5 font-mono text-[10.5px]"
                :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ langFilled(l.code) ? 'vyplněno' : 'prázdné' }}
              </span>
            </li>
          </ul>

          <div class="mt-4 border-t border-steel-100 pt-4">
            <AppButton
              variant="primary"
              size="sm"
              class="w-full"
              :disabled="translating || !sourceReady"
              @click="translateAll"
            >
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL (nadpis a text) ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte český nadpis — z něj se překládá.</span>
            </p>
          </div>
        </FormSection>
      </aside>
    </div>

    <!-- Toast -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"
      >
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
