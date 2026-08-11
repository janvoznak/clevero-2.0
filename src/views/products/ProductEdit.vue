<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import FormSection from '@/components/admin/FormSection.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import GalleryField from '@/components/admin/GalleryField.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, SOURCE_LANG, defaultContentBlocks } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PRODUCTS,
  PRODUCT_TYPE_META,
  AVAILABILITY_META,
  availability,
  displayName,
  stockLabel,
  fmtPrice,
  fmtDateTime,
  categoryOptionsList,
  type Product,
} from '@/data/mockProducts'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const categoryItems = categoryOptionsList()

const isNew = computed(() => !props.id)
const source = computed(() => MOCK_PRODUCTS.find((p) => p.id === props.id))
const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): Product {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as Product
    c.galleryIds = c.galleryIds ?? []
    c.slug = c.slug ?? empty()
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    return c
  }
  // Fallback (produkty se zakládají jen importem z Colossea — needitovatelné napojení).
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
    galleryIds: [],
    slug: empty(),
    contentBlocks: defaultContentBlocks(),
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
/** Napojení na Colosseum je vždy; koupit lze jen dostupný (neprodaný) produkt. */
const purchasable = computed(() => availability(form) !== 'soldout')

/** Sekce detailu jako záložky (jiná vizuální rovina než jazykové mutace). */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'box' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'commerce', label: 'Napojení a prodej', icon: 'integration' },
  { value: 'gallery', label: 'Fotogalerie', icon: 'gallery' },
]

/** Zobrazený název pro danou mutaci (override, jinak Colosseum název u CZ). */
function nameFor(code: LangCode): string {
  return form.nameOverride[code].trim() || (code === SOURCE_LANG ? form.name : '')
}
/** Indikátor vyplněnosti mutace (podle popisu — hlavní webový obsah). */
function langFilled(code: LangCode): boolean {
  return form.description[code].replace(/<[^>]+>/g, '').trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- URL slug (prototyp) — automaticky z názvu, dokud ho klient
   neupraví ručně. Titulek a meta se odvozují automaticky. ---------- */
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = empty()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(
  () => ({
    cs: nameFor('cs') || form.name,
    en: nameFor('en') || form.name,
    de: nameFor('de') || form.name,
    pl: nameFor('pl') || form.name,
  }),
  () => (form.slug ??= empty()),
)

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof Product)[] = ['nameOverride']
const { translating, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'products-list' })
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
        <LangBar
          v-model="activeLang"
          :filled="filledLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />

        <div class="h-6 w-px bg-steel-200" />
        <DetailActions
          :name="form.nameOverride.cs || form.name"
          entity="produkt"
          :is-edit="true"
          :can-duplicate="false"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @delete="router.push({ name: 'products-list' })"
        />
      </div>

      <!-- Language switcher (mobil) -->
      <div class="px-8 pb-3 lg:hidden">
        <LangBar v-model="activeLang" :filled="filledLangs" :translating="translating" @translate="translateLang" />
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
              <!-- Sekce: Základní informace -->
              <TabsContent value="basic" class="outline-none">
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
                    <MlFieldHeader label="Název pro web" :lang="activeLang" tag="product-name_override" :required="isNew" @translate="translateField('nameOverride')" />
                    <input
                      v-model="form.nameOverride[activeLang]"
                      type="text"
                      :placeholder="activeLang === 'cs' ? (form.name || 'Název produktu') : 'Přeložený název pro tuto mutaci'"
                      class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <p class="mt-1 text-[11.5px] text-steel-500">Prázdné = na webu se použije název z Colossea.</p>
                  </div>

                  <SlugField
                    v-model="slugText"
                    :tag="`product-url · ${activeLang.toUpperCase()}`"
                    @edit="markManual(activeLang)"
                  />

                </div>
              </TabsContent>

              <!-- Sekce: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Sekce: Napojení a prodej (dříve v pravém railu) -->
              <TabsContent value="commerce" class="outline-none">
                <div class="space-y-5">
                  <!-- Data z Colossea (vždy napojeno, jen ke čtení) -->
                  <section class="overflow-hidden rounded-lg border border-brand-500/30 bg-white ring-1 ring-brand-500/5">
                    <header class="flex items-center gap-3 border-b border-brand-500/15 bg-brand-50/60 px-5 py-3.5">
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-500/15 text-brand-600"><Icon name="integration" :size="17" /></span>
                      <div class="min-w-0 flex-1">
                        <h2 class="font-display text-[15px] font-700 tracking-tight text-graphite-900">Napojení na Colosseum</h2>
                        <p class="text-[11.5px] text-steel-500">Cena a dostupnost se načítají automaticky — needitovatelné.</p>
                      </div>
                      <span class="hidden items-center gap-1 rounded bg-forge-500/10 px-1.5 py-0.5 font-mono text-[10px] font-600 text-forge-600 sm:inline-flex">
                        <Icon name="check" :size="10" />napojeno
                      </span>
                    </header>
                    <div class="space-y-3 p-5">
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
                          <Icon name="x" :size="15" /> Vyprodáno — nelze koupit
                        </span>
                      </div>

                      <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
                        <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                        <span v-if="purchasable">
                          {{ isVoucher ? 'Přidání voucheru do košíku' : 'Přidání do košíku' }} i nákup se odbaví v Colosseu — web jen odkazuje.
                        </span>
                        <span v-else>
                          Dostupnost se načítá z Colossea. Vyprodané zboží (0 ks) se na webu nezobrazuje a nejde koupit.
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
                      item-route-name="product-category-edit"
                      create-route-name="product-category-new"
                      create-label="Nová kategorie produktů"
                    />
                    <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="layers" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      Členění se spravuje v CMS (nepřebírá se z Colossea). Kategorie upravíte v sekci Produkty → Kategorie.
                    </p>
                  </FormSection>
                </div>
              </TabsContent>

              <!-- Sekce: Fotogalerie (CMS) -->
              <TabsContent value="gallery" class="outline-none">
                <!-- Obrázek z Colossea (read-only referenční) -->
                <div v-if="form.colosseumImage" class="mb-5 flex items-center gap-3 rounded-md border border-steel-200 bg-steel-50 p-3">
                  <span class="h-16 w-20 shrink-0 overflow-hidden rounded bg-steel-100">
                    <img :src="form.colosseumImage" alt="" class="h-full w-full object-cover" />
                  </span>
                  <div class="min-w-0">
                    <p class="flex items-center gap-1.5 field-tag"><Icon name="integration" :size="12" class="text-brand-500" /> Obrázek z Colossea</p>
                    <p class="mt-0.5 text-[12px] text-steel-500">Zobrazí se, dokud nepřidáte vlastní hlavní fotku.</p>
                  </div>
                </div>
                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.gallery"
                  link-tag="product-gallery_ids"
                  photos-tag="product-gallery"
                />
              </TabsContent>

            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail: zobrazení na webu (řídí dostupnost, ne ruční publikace) -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Zobrazení na webu" icon="eye" tag="product-visibility">
          <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
            <span class="text-[12.5px] font-500 text-steel-600">Stav</span>
            <span v-if="purchasable" class="inline-flex items-center gap-1.5 rounded-full bg-forge-500/10 px-2.5 py-1 text-[11.5px] font-600 text-forge-600">
              <span class="h-1.5 w-1.5 rounded-full bg-forge-500" /> Zobrazeno
            </span>
            <span v-else class="inline-flex items-center gap-1.5 rounded-full bg-steel-200 px-2.5 py-1 text-[11.5px] font-600 text-steel-500">
              <span class="h-1.5 w-1.5 rounded-full bg-steel-400" /> Skryto (vyprodáno)
            </span>
          </div>
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            Viditelnost řídí dostupnost z Colossea — vyprodaný produkt se na webu nezobrazuje. Bez ručního publikování.
          </p>
        </FormSection>
      </aside>
    </div>
  </div>
</template>
