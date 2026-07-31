<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  CheckboxRoot,
  CheckboxIndicator,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import AttachmentsManager from '@/components/admin/AttachmentsManager.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PAGES,
  pageState,
  PAGE_STATE_META,
  PAGE_SECTIONS,
  slugPath,
  parentOptions,
  DYNAMIC_FORM_OPTIONS,
  INQUIRY_OPTIONS,
  CONTACT_OPTIONS,
  COOKIE_CATEGORIES,
} from '@/data/mockPages'
import type { PageItem, InquiryFormType, ContactFormType } from '@/data/mockPages'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_PAGES.find((p) => p.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): PageItem {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  const parentId = typeof route.query.parent === 'string' ? route.query.parent : null
  const parent = parentId ? MOCK_PAGES.find((p) => p.id === parentId) : null
  const qs = route.query.section
  const sectionFromQuery = qs === 'menu' || qs === 'other' || qs === 'client' ? qs : null
  return {
    id: 'nová',
    section: parent?.section ?? sectionFromQuery ?? 'menu',
    parentId,
    title: empty(),
    slug: empty(),
    perex: empty(),
    text: empty(),
    allowMenu: false,
    allowFooter: '0',
    allowHp: false,
    priority: 0,
    enabled: true,
    dynamicFormId: '',
    inquiryFormType: 'none',
    contactForm: 'none',
    contactFormText: empty(),
    metaTitle: empty(),
    metaDescription: empty(),
    metaKeywords: empty(),
    canonicalUrl: empty(),
    allowIndexing: true,
    gallery: [],
    attachments: [],
    jsCodes: '',
    usedCookies: [],
  }
}

const form = reactive<PageItem>(clone())
const activeLang = ref<LangCode>('cs')
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'forms', label: 'Formuláře', icon: 'reference' },
  { value: 'seo', label: 'Marketing & SEO', icon: 'search' },
  { value: 'media', label: 'Obrázky & Přílohy', icon: 'gallery' },
  { value: 'codes', label: 'Měřící kódy', icon: 'code' },
]

/* ---------- Proxy pro typované selecty ---------- */
const parentValue = computed({
  get: () => form.parentId ?? '',
  set: (v: string) => (form.parentId = v || null),
})
const inquiryValue = computed({
  get: () => form.inquiryFormType,
  set: (v: string) => (form.inquiryFormType = v as InquiryFormType),
})
const contactValue = computed({
  get: () => form.contactForm,
  set: (v: string) => (form.contactForm = v as ContactFormType),
})
/** Nadřazená stránka jen z téže sekce, do které stránka patří. */
const parentOpts = computed(() =>
  parentOptions(
    MOCK_PAGES.filter((p) => p.section === form.section),
    props.id,
  ),
)
const sectionLabel = computed(() => PAGE_SECTIONS.find((s) => s.key === form.section)?.label ?? '')

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const state = computed(() => pageState(form))

/* Hierarchická URL náhled (dle rodiče z mock stromu + vlastní slug). */
const urlPreview = computed(() => {
  const slug = form.slug[activeLang.value] || form.slug.cs || 'slug'
  if (!form.parentId) return '/' + slug
  const parent = MOCK_PAGES.find((p) => p.id === form.parentId)
  return parent ? `${slugPath(MOCK_PAGES, parent)}/${slug}` : '/' + slug
})

/* ---------- Slug + SEO auto-generování (prototyp) ---------- */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
function generateSlug() {
  const l = activeLang.value
  form.slug[l] = slugify(form.title[l] || 'stranka')
}
const generating = ref(false)
function autoGenerateSeo() {
  generating.value = true
  const l = activeLang.value
  window.setTimeout(() => {
    const title = form.title[l] || 'Stránka'
    const plain = form.text[l].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    form.metaTitle[l] = `${title} | Dolní Vítkovice`.slice(0, 60)
    form.metaDescription[l] = (form.perex[l] || plain || title).slice(0, 160)
    const words = (title + ' ' + plain)
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
    form.metaKeywords[l] = Array.from(new Set(words)).slice(0, 6).join(', ')
    generating.value = false
  }, 550)
}
const metaTitleLen = computed(() => form.metaTitle[activeLang.value].length)
const metaDescLen = computed(() => form.metaDescription[activeLang.value].length)

/* ---------- Cookies (multiselect přes checkboxy) ---------- */
function toggleCookie(value: string, v: boolean | 'indeterminate') {
  if (v === true) {
    if (!form.usedCookies.includes(value)) form.usedCookies = [...form.usedCookies, value]
  } else {
    form.usedCookies = form.usedCookies.filter((c) => c !== value)
  }
}

/* ---------- Uložení (prototyp) ---------- */
const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveAndClose() {
  router.push({ name: 'pages-list' })
}

/* ---------- AI překlad (prototyp) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const mlFields: (keyof PageItem)[] = [
  'title',
  'slug',
  'perex',
  'text',
  'contactFormText',
  'metaTitle',
  'metaDescription',
  'metaKeywords',
  'canonicalUrl',
]
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const field of mlFields) {
      const val = form[field] as ML
      const src = val[SOURCE_LANG]
      for (const t of targetLangs) if (src) val[t.code] = src
    }
    translating.value = false
    toast.value = `Přeloženo z CZ do ${targetLangs.map((l) => l.code.toUpperCase()).join(', ')}`
    window.setTimeout(() => (toast.value = ''), 3000)
  }, 1500)
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
          @click="router.push({ name: 'pages-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/page/edit/${form.id}` : '/admin/page/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová stránka' }}
          </h1>
        </div>

        <!-- Jazykový přepínač (pilulky) -->
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>
              {{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit a zůstat' }}
        </AppButton>
        <AppButton variant="primary" @click="saveAndClose">
          <Icon name="check" :size="16" /> Uložit a zavřít
        </AppButton>
      </div>

      <!-- Jazykový přepínač (mobil) -->
      <div class="px-8 pb-3 lg:hidden">
        <TabsRoot :model-value="activeLang" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              {{ l.flag }} {{ l.code.toUpperCase() }}
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: sekce v podtržených tabech -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce stránky">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- TAB 1: Základní informace -->
              <TabsContent value="basic" class="space-y-4 outline-none">
                <p class="mb-1 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Nadpis, perex a text existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Nadpis <span class="text-brand-500">*</span></span>
                    <span class="field-tag">page-title · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Hlavní nadpis stránky (H1)"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Perex</span>
                    <span class="field-tag">page-perex · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <textarea
                    v-model="form.perex[activeLang]"
                    rows="2"
                    placeholder="Krátký úvodní text stránky"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Obsah</span>
                    <span class="field-tag">page-text · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <RichTextEditor v-model="form.text[activeLang]" />
                </div>

                <!-- Zařazení a viditelnost -->
                <div class="mt-2 rounded-md border border-steel-200 bg-steel-50/60 p-4">
                  <p class="mb-3 text-[12.5px] font-600 text-graphite-800">Zařazení</p>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Nadřazená stránka</span>
                      <span class="field-tag">page-entityParentId</span>
                    </label>
                    <AppSelect v-model="parentValue" :options="parentOpts" />
                    <p class="mt-1 text-[11px] text-steel-400">
                      Na výběr jsou pouze stránky ze sekce <span class="font-600 text-steel-500">{{ sectionLabel }}</span>.
                    </p>
                  </div>
                  <p class="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="grip" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                    Pořadí a zanoření stránky nastavíte přetažením přímo v seznamu stránek.
                  </p>
                </div>
              </TabsContent>

              <!-- TAB 2: Formuláře -->
              <TabsContent value="forms" class="space-y-4 outline-none">
                <p class="mb-1 flex items-start gap-2 rounded-md bg-steel-50 px-3 py-2 text-[12px] leading-relaxed text-steel-500">
                  <Icon name="reference" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
                  Doporučujeme preferovat vazbu na dynamické formuláře před staršími (legacy) variantami.
                </p>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Dynamický formulář</span>
                    <span class="field-tag">page-dynamicFormEntityId</span>
                  </label>
                  <AppSelect v-model="form.dynamicFormId" :options="DYNAMIC_FORM_OPTIONS" />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Poptávkový formulář <span class="text-steel-400">(legacy)</span></span>
                      <span class="field-tag">page-inquiryFormType</span>
                    </label>
                    <AppSelect v-model="inquiryValue" :options="INQUIRY_OPTIONS" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Kontaktní formulář <span class="text-steel-400">(legacy)</span></span>
                      <span class="field-tag">page-contactForm</span>
                    </label>
                    <AppSelect v-model="contactValue" :options="CONTACT_OPTIONS" />
                  </div>
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Text u formuláře</span>
                    <span class="field-tag">page-contactFormText · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <textarea
                    v-model="form.contactFormText[activeLang]"
                    rows="3"
                    placeholder="Úvodní text zobrazený nad formulářem"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </TabsContent>

              <!-- TAB 3: Marketing & SEO -->
              <TabsContent value="seo" class="space-y-4 outline-none">
                <div class="flex items-center justify-between rounded-md border border-brand-500/20 bg-brand-50 px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <Icon name="sparkles" :size="18" class="text-brand-500" />
                    <div>
                      <p class="text-[13px] font-600 text-graphite-800">Automatické vygenerování</p>
                      <p class="text-[11.5px] text-steel-500">Titulek a popis z nadpisu a obsahu ({{ activeLang.toUpperCase() }})</p>
                    </div>
                  </div>
                  <AppButton variant="primary" size="sm" :disabled="generating" @click="autoGenerateSeo">
                    <Icon name="sparkles" :size="15" :class="generating && 'animate-pulse'" />
                    {{ generating ? 'Generuji…' : 'Vygenerovat' }}
                  </AppButton>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Část URL (slug) <span class="text-brand-500">*</span></span>
                    <span class="field-tag">page-urlPart · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <div class="flex items-stretch gap-2">
                    <input
                      v-model="form.slug[activeLang]"
                      type="text"
                      placeholder="cast-url"
                      class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <AppButton variant="secondary" size="sm" @click="generateSlug">
                      <Icon name="sparkles" :size="14" /> Z nadpisu
                    </AppButton>
                  </div>
                  <p class="mt-1 text-[11px] text-steel-400">Pouze malá písmena bez diakritiky, čísla a pomlčky.</p>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="md:col-span-2">
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">SEO titulek</span>
                      <span class="field-tag">page-meta_title · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input
                      v-model="form.metaTitle[activeLang]"
                      type="text"
                      placeholder="Pokud prázdné, použije se nadpis stránky"
                      class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <div class="mt-1 flex justify-end">
                      <span class="font-mono text-[10.5px]" :class="metaTitleLen > 60 ? 'text-danger-500' : 'text-steel-400'">{{ metaTitleLen }} / 60</span>
                    </div>
                  </div>
                  <div class="md:col-span-2">
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">META description</span>
                      <span class="field-tag">page-meta_description · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <textarea
                      v-model="form.metaDescription[activeLang]"
                      rows="2"
                      placeholder="Popis pro vyhledávače"
                      class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <div class="mt-1 flex justify-end">
                      <span class="font-mono text-[10.5px]" :class="metaDescLen > 160 ? 'text-danger-500' : 'text-steel-400'">{{ metaDescLen }} / 160</span>
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">META keywords</span>
                      <span class="field-tag">page-meta_keywords · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input
                      v-model="form.metaKeywords[activeLang]"
                      type="text"
                      placeholder="klíčová slova oddělená čárkou"
                      class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Kanonická URL</span>
                      <span class="field-tag">page-canonicalUrl · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input
                      v-model="form.canonicalUrl[activeLang]"
                      type="text"
                      placeholder="https://…"
                      class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between rounded-md border border-steel-200 bg-steel-50 px-3 py-2.5">
                  <AppSwitch v-model="form.allowIndexing" label="Povolit indexaci" hint="Při vypnutí se generuje noindex, nofollow" aria-label="Povolit indexaci" />
                  <span class="field-tag">page-allowIndexing</span>
                </div>

                <!-- SERP preview -->
                <div class="rounded-md border border-steel-200 bg-steel-50 p-4">
                  <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="globe" :size="13" /> Náhled ve vyhledávači</p>
                  <div class="rounded bg-white p-3 shadow-sm">
                    <p class="text-[12px] text-forge-600">dolnivitkovice.cz{{ urlPreview }}</p>
                    <p class="mt-0.5 text-[16px] font-500 text-[#1a0dab]">
                      {{ form.metaTitle[activeLang] || form.title[activeLang] || 'Titulek stránky' }}
                    </p>
                    <p class="mt-0.5 text-[12.5px] leading-snug text-steel-600">
                      {{ form.metaDescription[activeLang] || form.perex[activeLang] || 'Meta popis se zobrazí zde…' }}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <!-- TAB 4: Obrázky & Přílohy -->
              <TabsContent value="media" class="space-y-6 outline-none">
                <div>
                  <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                    Galerie obrázků stránky. První obrázek = hlavní.
                    <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page-images</span>
                  </p>
                  <GalleryManager v-model="form.gallery" />
                </div>
                <div>
                  <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                    Přílohy ke stažení — rozlišené dle jazyka.
                    <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page-attachments · ML</span>
                  </p>
                  <AttachmentsManager v-model="form.attachments" :lang="activeLang" />
                </div>
              </TabsContent>

              <!-- TAB 5: Měřící kódy & Cookies -->
              <TabsContent value="codes" class="space-y-4 outline-none">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Vlastní JS kódy</span>
                    <span class="field-tag">page-js_codes</span>
                  </label>
                  <textarea
                    v-model="form.jsCodes"
                    rows="5"
                    spellcheck="false"
                    placeholder="<!-- HTML / JS vkládané do stránky -->"
                    class="w-full resize-y rounded-md border border-steel-200 bg-graphite-950 px-3.5 py-2.5 font-mono text-[12.5px] text-steel-100 placeholder:text-steel-500 focus:border-brand-500 focus:outline-none"
                  />
                  <p class="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600">
                    <Icon name="help" :size="13" /> Vyžaduje oprávnění super-admin. Kódy se blokují dle souhlasu s cookies.
                  </p>
                </div>
                <div>
                  <label class="mb-2 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Použité cookies</span>
                    <span class="field-tag">page-usedCookies[]</span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="c in COOKIE_CATEGORIES"
                      :key="c.value"
                      class="flex cursor-pointer items-center gap-2 rounded-md border border-steel-200 px-3 py-2 text-[13px] transition-colors has-[[data-state=checked]]:border-brand-500 has-[[data-state=checked]]:bg-brand-50"
                    >
                      <CheckboxRoot
                        :model-value="form.usedCookies.includes(c.value)"
                        class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                        @update:model-value="(v) => toggleCookie(c.value, v)"
                      >
                        <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
                      </CheckboxRoot>
                      <span class="font-500 text-graphite-800">{{ c.label }}</span>
                    </label>
                  </div>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <FormSection title="Publikace" icon="globe">
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.enabled" label="Zobrazovat (aktivní)" hint="Hlavní vypínač viditelnosti stránky na webu" aria-label="Zobrazovat" />
              <span class="field-tag">page-enabled</span>
            </div>
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Aktuální stav</span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[PAGE_STATE_META[state].bg, PAGE_STATE_META[state].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="PAGE_STATE_META[state].dot" />
                {{ PAGE_STATE_META[state].label }}
              </span>
            </div>
            <div class="rounded-md border border-steel-200 px-3 py-2.5">
              <p class="mb-0.5 field-tag">Adresa na webu</p>
              <p class="break-all font-mono text-[11.5px] text-graphite-700">/cs{{ urlPreview }}</p>
            </div>
            <a
              href="#"
              target="_blank"
              class="flex w-full items-center justify-center gap-2 rounded-md border border-steel-200 bg-white px-4 py-2 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 hover:text-graphite-900"
              @click.prevent
            >
              <Icon name="eye" :size="16" /> Náhled na webu
            </a>
          </div>
        </FormSection>

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
            <AppButton variant="primary" size="sm" class="w-full" :disabled="translating || !sourceReady" @click="translateAll">
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL ze zdrojové české verze.</span>
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
