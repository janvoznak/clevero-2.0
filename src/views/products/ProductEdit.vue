<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent, PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PRODUCTS,
  COLOSSEUM_CATALOG,
  PRODUCT_TYPE_META,
  AVAILABILITY_META,
  availability,
  displayName,
  stockLabel,
  fmtPrice,
  fmtDateTime,
  isPaired,
  categoryOptionsList,
  type Product,
  type ColosseumGood,
} from '@/data/mockProducts'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const categoryItems = categoryOptionsList()

const isNew = computed(() => !props.id)
const source = computed(() => MOCK_PRODUCTS.find((p) => p.id === props.id))
const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): Product {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  // Nový produkt zakládaný ručně v CMS — nespárovaný (ID doplní párování s Colosseem).
  return {
    id: 'nový',
    type: 'goods',
    colosseumId: '',
    name: '',
    price: 0,
    stock: 0,
    colosseumImage: '',
    importedAt: '2026-08-06T09:00',
    syncedAt: '',
    nameOverride: empty(),
    description: empty(),
    gallery: [],
    categoryIds: [],
    cartUrl: '',
    metaTitle: empty(),
    metaDescription: empty(),
    published: false,
  }
}

const form = reactive<Product>(clone())
const activeLang = ref<LangCode>('cs')
const typeMeta = computed(() => PRODUCT_TYPE_META[form.type])
const isVoucher = computed(() => form.type === 'voucher')
/** Je produkt spárovaný s Colosseem přes ID? */
const paired = computed(() => isPaired(form))
/** Koupit lze jen spárovaný a dostupný produkt. */
const purchasable = computed(() => paired.value && availability(form) !== 'soldout')

/** Sekce detailu jako záložky (jiná vizuální rovina než jazykové mutace). */
const activeSection = ref('content')
const sections = [
  { value: 'content', label: 'Obsah', icon: 'box' },
  { value: 'gallery', label: 'Fotogalerie', icon: 'gallery' },
  { value: 'seo', label: 'Marketing (SEO)', icon: 'search' },
]

/** Zobrazený název pro danou mutaci (override, jinak Colosseum název u CZ). */
function nameFor(code: LangCode): string {
  return form.nameOverride[code].trim() || (code === SOURCE_LANG ? form.name : '')
}
/** Indikátor vyplněnosti mutace (podle popisu — hlavní webový obsah). */
function langFilled(code: LangCode): boolean {
  return form.description[code].replace(/<[^>]+>/g, '').trim().length > 0
}

/* ---------- Colosseum synchronizace (prototyp — jen toast) ---------- */
const toast = ref('')
const syncing = ref(false)
function syncOne() {
  if (syncing.value) return
  syncing.value = true
  window.setTimeout(() => {
    syncing.value = false
    toast.value = 'Dostupnost a cena aktualizovány z Colossea.'
    window.setTimeout(() => (toast.value = ''), 3000)
  }, 1200)
}

/* ---------- Ruční párování s Colosseem dle ID (prototyp) ----------
   Operátor vybere z katalogu Colossea položku (hledá dle ID/názvu) a spáruje.
   Spárováním se do produktu doplní cena, sklad, název a obrázek z Colossea. */
const NOW_ISO = '2026-08-05T12:00'
const pairOpen = ref(false)
const pairSearch = ref('')
const catalogFiltered = computed(() => {
  const q = pairSearch.value.trim().toLowerCase()
  return COLOSSEUM_CATALOG.filter(
    (g) => !q || g.colosseumId.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
  )
})
function pairWith(g: ColosseumGood) {
  form.colosseumId = g.colosseumId
  form.name = g.name
  form.type = g.type
  form.price = g.price
  form.stock = g.stock
  form.colosseumImage = g.image
  form.syncedAt = NOW_ISO
  if (!form.importedAt) form.importedAt = NOW_ISO
  pairOpen.value = false
  pairSearch.value = ''
  toast.value = `Spárováno s Colosseem — ${g.colosseumId}`
  window.setTimeout(() => (toast.value = ''), 3000)
}
function unpair() {
  form.colosseumId = ''
  form.price = 0
  form.stock = 0
  form.syncedAt = ''
  toast.value = 'Párování s Colosseem zrušeno — cena a dostupnost se nenačítají.'
  window.setTimeout(() => (toast.value = ''), 3000)
}

/* ---------- SEO auto-generování (prototyp) ---------- */
const generating = ref(false)
function autoGenerate() {
  generating.value = true
  const l = activeLang.value
  window.setTimeout(() => {
    const title = nameFor(l) || form.name
    const plain = form.description[l].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    form.metaTitle[l] = `${title} | E-shop Dolní Vítkovice`.slice(0, 60)
    form.metaDescription[l] = (plain || title).slice(0, 155)
    generating.value = false
  }, 550)
}
const metaTitleLen = computed(() => form.metaTitle[activeLang.value].length)
const metaDescLen = computed(() => form.metaDescription[activeLang.value].length)

/* ---------- AI překlad (prototyp — žádná reálná AI) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const mlFields: (keyof Product)[] = ['nameOverride', 'description', 'metaTitle', 'metaDescription']
const sourceReady = computed(
  () => form.nameOverride.cs.trim().length > 0 || form.description.cs.replace(/<[^>]+>/g, '').trim().length > 0,
)
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    // Colosseum název doplníme do CZ override, aby bylo z čeho překládat.
    if (!form.nameOverride.cs.trim()) form.nameOverride.cs = form.name
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

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'products-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">product</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isNew ? '/admin/products/new' : `/admin/products/${form.id}/edit` }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isNew ? 'Nový produkt' : (displayName(form) || 'Bez názvu') }}
          </h1>
        </div>

        <!-- Language switcher (globální) — Reka Tabs -->
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" :title="langFilled(l.code) ? 'Vyplněno' : 'Prázdné'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="router.push({ name: 'products-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? (isNew ? 'Vytvořeno' : 'Uloženo') : (isNew ? 'Vytvořit produkt' : 'Uložit produkt') }}
        </AppButton>
      </div>

      <!-- Language switcher (mobil) -->
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
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: CMS obsah v záložkách sekcí -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce produktu">
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
              <!-- Sekce: Obsah (CMS) -->
              <TabsContent value="content" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Název a popis pro web. Colosseum tato pole neeviduje — spravují se tady.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
                  <!-- Název z Colossea (read-only referenční) — jen u spárovaného produktu -->
                  <div v-if="form.name" class="flex items-center gap-3 rounded-md border border-steel-200 bg-steel-50 px-3.5 py-2.5">
                    <Icon name="integration" :size="16" class="shrink-0 text-brand-500" />
                    <div class="min-w-0 flex-1">
                      <p class="field-tag">Název v Colosseu (jen čtení)</p>
                      <p class="truncate text-[13.5px] font-600 text-graphite-800">{{ form.name }}</p>
                    </div>
                  </div>

                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Název pro web <span v-if="isNew" class="text-brand-500">*</span></span>
                      <span class="field-tag">product-name_override · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input
                      v-model="form.nameOverride[activeLang]"
                      type="text"
                      :placeholder="activeLang === 'cs' ? (form.name || 'Název produktu') : 'Přeložený název pro tuto mutaci'"
                      class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <p class="mt-1 text-[11.5px] text-steel-500">Prázdné = na webu se použije název z Colossea.</p>
                  </div>

                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Popis produktu</span>
                      <span class="field-tag">product-description · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <RichTextEditor v-model="form.description[activeLang]" />
                  </div>
                </div>
              </TabsContent>

              <!-- Sekce: Fotogalerie (CMS) -->
              <TabsContent value="gallery" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Colosseum má u produktu jen jeden obrázek. Další fotky pro web přidáte tady.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">product-gallery</span>
                </p>
                <!-- Obrázek z Colossea (read-only referenční) -->
                <div v-if="form.colosseumImage" class="mb-4 flex items-center gap-3 rounded-md border border-steel-200 bg-steel-50 p-3">
                  <span class="h-16 w-20 shrink-0 overflow-hidden rounded bg-steel-100">
                    <img :src="form.colosseumImage" alt="" class="h-full w-full object-cover" />
                  </span>
                  <div class="min-w-0">
                    <p class="flex items-center gap-1.5 field-tag"><Icon name="integration" :size="12" class="text-brand-500" /> Obrázek z Colossea</p>
                    <p class="mt-0.5 text-[12px] text-steel-500">Zobrazí se, dokud nepřidáte vlastní hlavní fotku.</p>
                  </div>
                </div>
                <GalleryManager v-model="form.gallery" />
              </TabsContent>

              <!-- Sekce: Marketing (SEO) -->
              <TabsContent value="seo" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Meta údaje pro vyhledávače — samostatně pro každý jazyk.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
                  <div class="flex items-center justify-between rounded-md border border-brand-500/20 bg-brand-50 px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <Icon name="sparkles" :size="18" class="text-brand-500" />
                      <div>
                        <p class="text-[13px] font-600 text-graphite-800">Automatické vygenerování</p>
                        <p class="text-[11.5px] text-steel-500">Titulek a popis z názvu a popisu ({{ activeLang.toUpperCase() }})</p>
                      </div>
                    </div>
                    <AppButton variant="primary" size="sm" :disabled="generating" @click="autoGenerate">
                      <Icon name="sparkles" :size="15" :class="generating && 'animate-pulse'" />
                      {{ generating ? 'Generuji…' : 'Vygenerovat' }}
                    </AppButton>
                  </div>

                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Titulek stránky</span>
                      <span class="field-tag">product-meta_title · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input
                      v-model="form.metaTitle[activeLang]"
                      type="text"
                      placeholder="Meta title ve výsledcích vyhledávání"
                      class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <div class="mt-1 flex justify-end">
                      <span class="font-mono text-[10.5px]" :class="metaTitleLen > 60 ? 'text-danger-500' : 'text-steel-400'">{{ metaTitleLen }} / 60</span>
                    </div>
                  </div>

                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Meta description</span>
                      <span class="field-tag">product-meta_description · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <textarea
                      v-model="form.metaDescription[activeLang]"
                      rows="2"
                      placeholder="Meta popis produktu"
                      class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <div class="mt-1 flex justify-end">
                      <span class="font-mono text-[10.5px]" :class="metaDescLen > 155 ? 'text-danger-500' : 'text-steel-400'">{{ metaDescLen }} / 155</span>
                    </div>
                  </div>

                  <!-- SERP preview -->
                  <div class="rounded-md border border-steel-200 bg-steel-50 p-4">
                    <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="globe" :size="13" /> Náhled ve vyhledávači</p>
                    <div class="rounded bg-white p-3 shadow-sm">
                      <p class="text-[12px] text-forge-600">dolnivitkovice.cz › eshop</p>
                      <p class="mt-0.5 text-[16px] font-500 text-[#1a0dab]">
                        {{ form.metaTitle[activeLang] || nameFor(activeLang) || form.name || 'Titulek stránky' }}
                      </p>
                      <p class="mt-0.5 text-[12.5px] leading-snug text-steel-600">
                        {{ form.metaDescription[activeLang] || 'Meta popis se zobrazí zde…' }}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" updated-by="Jana Svobodová" />

        <!-- Data z Colossea (read-only) -->
        <section class="overflow-hidden rounded-lg border border-brand-500/30 bg-white ring-1 ring-brand-500/5">
          <header class="flex items-center gap-3 border-b border-brand-500/15 bg-brand-50/60 px-5 py-3.5">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-500/15 text-brand-600"><Icon name="integration" :size="17" /></span>
            <div class="min-w-0 flex-1">
              <h2 class="font-display text-[15px] font-700 tracking-tight text-graphite-900">Napojení na Colosseum</h2>
              <p class="text-[11.5px]" :class="paired ? 'text-steel-500' : 'text-amber-600'">
                {{ paired ? 'Cena a dostupnost — načítáno automaticky' : 'Zatím nespárováno' }}
              </p>
            </div>
            <span
              class="hidden items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-600 sm:inline-flex"
              :class="paired ? 'bg-forge-500/10 text-forge-600' : 'bg-amber-500/10 text-amber-600'"
            >
              <Icon v-if="paired" name="check" :size="10" />{{ paired ? 'spárováno' : 'nespárováno' }}
            </span>
          </header>
          <div class="space-y-3 p-5">
            <!-- Spárováno: read-only data z Colossea -->
            <template v-if="paired">
              <div class="flex items-center gap-3">
                <span class="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-steel-100">
                  <img v-if="form.colosseumImage" :src="form.colosseumImage" alt="" class="h-full w-full object-cover" />
                  <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="18" /></span>
                </span>
                <dl class="min-w-0 flex-1 space-y-1 text-[12.5px]">
                  <div class="flex items-center justify-between gap-2">
                    <dt class="text-steel-500">Typ</dt>
                    <dd class="inline-flex items-center gap-1 font-600 text-graphite-800"><Icon :name="typeMeta.icon" :size="13" /> {{ typeMeta.label }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <dt class="text-steel-500">Colosseum ID</dt>
                    <dd class="font-mono text-[11.5px] text-graphite-700">{{ form.colosseumId }}</dd>
                  </div>
                </dl>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-md bg-steel-50 px-3 py-2">
                  <p class="field-tag">Cena</p>
                  <p class="mt-0.5 font-display text-[18px] font-700 text-graphite-900 tabular-nums">{{ fmtPrice(form.price) }}</p>
                </div>
                <div class="rounded-md bg-steel-50 px-3 py-2">
                  <p class="field-tag">Sklad</p>
                  <p class="mt-1 flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-600" :class="[AVAILABILITY_META[availability(form)].bg, AVAILABILITY_META[availability(form)].text]">
                      <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(form)].dot" />
                      {{ stockLabel(form) }}
                    </span>
                  </p>
                </div>
              </div>

              <dl class="space-y-1.5 border-t border-steel-100 pt-3 text-[12px]">
                <div class="flex items-center justify-between gap-2">
                  <dt class="flex items-center gap-1.5 text-steel-500"><Icon name="plus" :size="12" class="text-steel-400" /> Importováno</dt>
                  <dd class="font-mono text-[11px] text-steel-600 tabular-nums">{{ fmtDateTime(form.importedAt) }}</dd>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <dt class="flex items-center gap-1.5 text-steel-500"><Icon name="sync" :size="12" class="text-steel-400" /> Synchronizováno</dt>
                  <dd class="font-mono text-[11px] text-steel-600 tabular-nums">{{ form.syncedAt ? fmtDateTime(form.syncedAt) : '—' }}</dd>
                </div>
              </dl>
            </template>

            <!-- Nespárováno: upozornění + výzva ke spárování -->
            <div v-else class="rounded-md border border-amber-500/30 bg-amber-50/60 px-3 py-2.5">
              <p class="flex items-start gap-1.5 text-[12px] leading-relaxed text-amber-700">
                <Icon name="bell" :size="14" class="mt-0.5 shrink-0" />
                Produkt zatím není spárovaný s Colosseem. Bez párování se nenačítá cena ani dostupnost a na webu ho nelze koupit.
              </p>
            </div>

            <!-- Ovládání párování (společný picker přes katalog Colossea) -->
            <div class="flex gap-2">
              <AppButton v-if="paired" variant="secondary" size="sm" class="flex-1" :disabled="syncing" @click="syncOne">
                <Icon name="sync" :size="15" :class="syncing && 'animate-spin'" />
                {{ syncing ? 'Synchronizuji…' : 'Synchronizovat' }}
              </AppButton>
              <PopoverRoot v-model:open="pairOpen">
                <PopoverTrigger as-child>
                  <AppButton :variant="paired ? 'ghost' : 'primary'" size="sm" :class="paired ? '' : 'flex-1'">
                    <Icon name="integration" :size="15" />
                    {{ paired ? 'Změnit' : 'Spárovat s Colosseem' }}
                  </AppButton>
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent align="end" :side-offset="6" class="z-50 w-[300px] rounded-xl border border-steel-200 bg-white p-2 shadow-2xl">
                    <p class="px-1 pb-1.5 pt-0.5 field-tag">Vybrat zboží z Colossea</p>
                    <div class="relative mb-1.5">
                      <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
                      <input
                        v-model="pairSearch"
                        type="text"
                        placeholder="Hledat dle ID nebo názvu…"
                        class="h-8 w-full rounded-md border border-steel-200 pl-8 pr-2 text-[13px] focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div class="scroll-thin max-h-64 overflow-y-auto">
                      <button
                        v-for="g in catalogFiltered"
                        :key="g.colosseumId"
                        type="button"
                        class="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-steel-100"
                        @click="pairWith(g)"
                      >
                        <span class="h-8 w-11 shrink-0 overflow-hidden rounded bg-steel-100"><img :src="g.image" alt="" class="h-full w-full object-cover" /></span>
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-[13px] text-graphite-800">{{ g.name }}</span>
                          <span class="block truncate font-mono text-[10.5px] text-steel-500">{{ g.colosseumId }} · {{ fmtPrice(g.price) }} · {{ g.stock }} ks</span>
                        </span>
                        <Icon v-if="g.colosseumId === form.colosseumId" name="check" :size="16" class="shrink-0 text-brand-500" />
                      </button>
                      <p v-if="!catalogFiltered.length" class="px-2 py-3 text-center text-[12.5px] text-steel-400">Nic nenalezeno.</p>
                    </div>
                  </PopoverContent>
                </PopoverPortal>
              </PopoverRoot>
            </div>

            <button
              v-if="paired"
              class="w-full text-[11.5px] font-500 text-steel-400 transition-colors hover:text-danger-600"
              @click="unpair"
            >
              Zrušit párování s Colosseem
            </button>
            <p v-else class="text-[11.5px] leading-relaxed text-steel-500">
              Vyberte položku z Colossea podle ID nebo názvu — cena, sklad i obrázek se doplní automaticky.
            </p>
          </div>
        </section>

        <!-- Prodej (košík → Colosseum) -->
        <FormSection title="Prodej" icon="cart" tag="product-cart_url">
          <div class="space-y-3">
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Odkaz do košíku (Colosseum)</label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  v-model="form.cartUrl"
                  type="url"
                  placeholder="https://websale.colosseum.eu/…"
                  class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[12.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Náhled tlačítka na webu — zohledňuje dostupnost z Colossea -->
            <div class="rounded-md border border-steel-200 bg-steel-50 p-3">
              <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="eye" :size="13" /> Náhled tlačítka na webu</p>
              <span
                v-if="purchasable"
                class="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-[13px] font-700 text-white"
              >
                <Icon :name="isVoucher ? 'tag' : 'cart'" :size="15" />
                {{ isVoucher ? 'Koupit voucher' : 'Přidat do košíku' }}
              </span>
              <span
                v-else
                class="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-steel-200 px-4 py-2 text-[13px] font-700 text-steel-500"
              >
                <Icon name="x" :size="15" /> {{ paired ? 'Vyprodáno — nelze koupit' : 'Nespárováno — nelze koupit' }}
              </span>
            </div>

            <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="purchasable">
                {{ isVoucher ? 'Přidání voucheru do košíku' : 'Přidání do košíku' }} i nákup se odbaví v Colosseu — web jen odkazuje.
              </span>
              <span v-else-if="!paired">
                Produkt není spárovaný s Colosseem — bez ID se nenačítá cena ani dostupnost a nejde koupit.
              </span>
              <span v-else>
                Dostupnost se načítá z Colossea. Vyprodané zboží (0 ks) na webu koupit nelze — tlačítko „do košíku“ se skryje.
              </span>
            </p>
          </div>
        </FormSection>

        <!-- Členění (kategorie produktů — CMS taxonomie) -->
        <FormSection title="Členění" icon="layers" tag="product-category_ids">
          <RelationPicker
            v-model="form.categoryIds"
            :items="categoryItems"
            add-label="Přidat do členění"
            empty-label="Zatím bez členění."
            search-placeholder="Hledat kategorii…"
            icon="layers"
          />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="layers" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            Členění se spravuje v CMS (nepřebírá se z Colossea). Kategorie upravíte v sekci Produkty → Kategorie.
          </p>
        </FormSection>

        <!-- Jazykové mutace přehled -->
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
              <span class="inline-flex items-center gap-1.5 font-mono text-[10.5px]" :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'">
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
              <span v-if="sourceReady">Vyplní název a popis v EN, DE, PL z české verze.</span>
              <span v-else>Nejdřív vyplňte český název nebo popis — z něj se překládá.</span>
            </p>
          </div>
        </FormSection>

        <!-- Obsah přehled -->
        <FormSection title="Obsah" icon="reference">
          <dl class="space-y-2.5 text-[13px]">
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="image" :size="15" /> Fotografie</dt>
              <dd class="font-mono font-600 text-graphite-800">{{ form.gallery.length }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="box" :size="15" /> Popis (CZ)</dt>
              <dd class="font-mono font-600" :class="langFilled('cs') ? 'text-forge-600' : 'text-amber-600'">
                {{ langFilled('cs') ? 'vyplněn' : 'chybí' }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="layers" :size="15" /> Členění</dt>
              <dd class="font-mono font-600 text-graphite-800">{{ form.categoryIds.length }}</dd>
            </div>
          </dl>
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
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
