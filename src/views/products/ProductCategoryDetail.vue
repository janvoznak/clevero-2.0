<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PRODUCT_CATEGORIES,
  blankProductCategory,
  productsForCategory,
  displayName,
  fmtPrice,
  type ProductCategory,
} from '@/data/mockProducts'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_PRODUCT_CATEGORIES.find((c) => c.id === props.id))
function clone(): ProductCategory {
  const s = source.value
  return s ? JSON.parse(JSON.stringify(s)) : blankProductCategory()
}
const form = reactive<ProductCategory>(clone())
const activeLang = ref<LangCode>('cs')

const activeSection = ref('info')
const sections = [
  { value: 'info', label: 'Základní informace', icon: 'page' },
  { value: 'products', label: 'Produkty v členění', icon: 'box' },
]
function langFilled(code: LangCode): boolean {
  return form.name[code].trim().length > 0
}

const products = computed(() => (isEdit.value ? productsForCategory(props.id!) : []))

/* ---------- AI překlad (prototyp) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const sourceReady = computed(() => form.name[SOURCE_LANG].trim().length > 0)
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const f of ['name', 'description'] as const) {
      const val = form[f] as ML
      const src = val[SOURCE_LANG]
      for (const t of targetLangs) if (src) val[t.code] = src
    }
    translating.value = false
    toast.value = `Přeloženo z CZ do ${targetLangs.map((l) => l.code.toUpperCase()).join(', ')}`
    window.setTimeout(() => (toast.value = ''), 3000)
  }, 1400)
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2000)
}
function goProduct(id: string) {
  router.push({ name: 'product-edit', params: { id } })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="router.push({ name: 'product-categories-list' })">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">product-category</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/product-categories/${form.id}` : '/admin/product-categories/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.name.cs || 'Bez názvu' : 'Nová kategorie' }}
          </h1>
        </div>
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger v-for="l in LANGS" :key="l.code" :value="l.code" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm">
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="router.push({ name: 'product-categories-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit kategorii' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce kategorie">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
                <span v-if="s.value === 'products' && isEdit" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">{{ products.length }}</span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="info" class="space-y-4 outline-none">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Název kategorie <span class="text-brand-500">*</span></span>
                    <span class="field-tag">category-name · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input v-model="form.name[activeLang]" type="text" placeholder="Např. Suvenýry" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Popis kategorie</span>
                    <span class="field-tag">category-description · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <RichTextEditor v-model="form.description[activeLang]" />
                </div>
              </TabsContent>

              <!-- Sekce: Produkty v členění (read-only přehled) -->
              <TabsContent value="products" class="outline-none">
                <div v-if="!isEdit" class="rounded-md bg-steel-50 px-4 py-6 text-center text-[13px] text-steel-500">
                  Nejdřív kategorii uložte, poté do ní zařadíte produkty (v detailu produktu).
                </div>
                <template v-else>
                  <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                    Zařazení se nastavuje v detailu produktu (pole Členění). Tady je jen přehled.
                    <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">read-only</span>
                  </p>
                  <div class="overflow-hidden rounded-lg border border-steel-200">
                    <table class="w-full border-collapse text-left">
                      <thead>
                        <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
                          <th class="px-3 py-2.5 font-600">Produkt</th>
                          <th class="w-28 px-2 py-2.5 text-right font-600">Cena</th>
                          <th class="w-24 px-2 py-2.5 font-600">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="p in products" :key="p.id" class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60">
                          <td class="px-3 py-2.5 align-middle">
                            <button class="flex items-center gap-2.5 text-left" @click="goProduct(p.id)">
                              <span class="h-8 w-11 shrink-0 overflow-hidden rounded bg-steel-100"><img v-if="p.gallery[0] || p.colosseumImage" :src="p.gallery[0]?.src || p.colosseumImage" alt="" class="h-full w-full object-cover" /></span>
                              <span class="block truncate text-[13.5px] font-600 text-graphite-900 group-hover:text-brand-600">{{ displayName(p) }}</span>
                            </button>
                          </td>
                          <td class="px-2 py-2.5 text-right align-middle text-[13px] font-700 text-graphite-900 tabular-nums">{{ fmtPrice(p.price) }}</td>
                          <td class="px-2 py-2.5 align-middle">
                            <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-600" :class="p.published ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-500'">
                              <span class="h-1.5 w-1.5 rounded-full" :class="p.published ? 'bg-forge-500' : 'bg-steel-300'" />
                              {{ p.published ? 'Web' : 'Skryto' }}
                            </span>
                          </td>
                        </tr>
                        <tr v-if="products.length === 0">
                          <td colspan="3" class="px-3 py-8 text-center text-[13px] text-steel-500">V tomto členění zatím není žádný produkt.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" updated-by="Jana Svobodová" />

        <FormSection title="Zveřejnění" icon="eye" tag="category-published">
          <AppSwitch v-model="form.published" label="Zobrazit členění na webu" hint="Skryté členění se ve výpisu e-shopu nezobrazí." />
        </FormSection>

        <FormSection title="Obrázek kategorie" icon="image">
          <div class="flex items-center gap-4">
            <span class="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-steel-100">
              <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
              <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="20" /></span>
            </span>
            <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="15" /> Nahrát</button>
          </div>
        </FormSection>

        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li v-for="l in LANGS" :key="l.code" class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors" :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'">
              <button class="flex items-center gap-2.5 text-left" @click="activeLang = l.code"><span>{{ l.flag }}</span><span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span></button>
              <span class="inline-flex items-center gap-1.5 font-mono text-[10.5px]" :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'"><span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />{{ langFilled(l.code) ? 'vyplněno' : 'prázdné' }}</span>
            </li>
          </ul>
          <div class="mt-4 border-t border-steel-100 pt-4">
            <AppButton variant="primary" size="sm" class="w-full" :disabled="translating || !sourceReady" @click="translateAll">
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
          </div>
        </FormSection>
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"><Icon name="sparkles" :size="16" class="text-brand-400" />{{ toast }}</div>
    </Transition>
  </div>
</template>
