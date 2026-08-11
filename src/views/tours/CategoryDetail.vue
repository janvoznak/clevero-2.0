<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import {
  MOCK_CATEGORIES,
  toursForCategory,
  blankCategory,
  availability,
  AVAILABILITY_META,
  upcomingSlots,
  freeSeats,
  type TourCategory,
  type Tour,
} from '@/data/mockTours'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_CATEGORIES.find((c) => c.id === props.id))
function clone(): TourCategory {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as TourCategory
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.name), c.publishedLangs)
    return c
  }
  return blankCategory()
}
const form = reactive<TourCategory>(clone())
const activeLang = ref<LangCode>('cs')

/** Sekce detailu kategorie (podtržené záložky). */
const activeSection = ref('info')
const sections = [
  { value: 'info', label: 'Základní informace', icon: 'page' },
  { value: 'tours', label: 'Prohlídky v kategorii', icon: 'ticket' },
]
function langFilled(code: LangCode): boolean {
  return form.name[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Stav kategorie (PublishCard) řídí, KDY je živá; tyto přepínače řídí,
   KTERÉ mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.name), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.name, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.name), code)
}

const tours = computed(() => (isEdit.value ? toursForCategory(props.id!) : []))

/* ---------- AI překlad ---------- */
const mlFields: (keyof TourCategory)[] = ['name', 'description']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2000)
}

/* ---------- Prohlídky v kategorii ---------- */
function goNewTour() {
  router.push({ name: 'tour-new', query: { category: props.id } })
}
function goTour(id: string) {
  router.push({ name: 'tour-edit', params: { id } })
}
const tourActions = [
  { key: 'edit', label: 'Editovat prohlídku', icon: 'edit' },
  { key: 'delete', label: 'Smazat prohlídku', icon: 'trash', danger: true },
]
function onTourAction(key: string, t: Tour) {
  if (key === 'edit') goTour(t.id)
  // delete v prototypu neřešíme na této obrazovce
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="router.push({ name: 'tours-list' })">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tour-category</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/tours/category/${form.id}` : '/admin/tours/category/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.name.cs || 'Bez názvu' : 'Nová kategorie' }}
          </h1>
        </div>
        <LangBar
          v-model="activeLang"
          :filled="filledLangs"
          :published="liveLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />
        <div class="h-6 w-px bg-steel-200" />
        <CardActionsMenu
          v-if="isEdit"
          :name="form.name.cs"
          entity="kategorii"
          @delete="router.push({ name: 'tours-list' })"
        />
        <AppButton variant="secondary" @click="router.push({ name: 'tours-list' })">Zrušit</AppButton>
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
                <span v-if="s.value === 'tours' && isEdit" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">{{ tours.length }}</span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="info" class="space-y-4 outline-none">
                <div>
                  <MlFieldHeader label="Název kategorie" :lang="activeLang" tag="category-name" required @translate="translateField('name')" />
                  <input v-model="form.name[activeLang]" type="text" placeholder="Např. Dolní Vítkovice" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <MlFieldHeader label="Popis kategorie" :lang="activeLang" tag="category-description" @translate="translateField('description')" />
                  <RichTextEditor v-model="form.description[activeLang]" />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Obrázek kategorie</span>
                    <span class="field-tag">category-image</span>
                  </label>
                  <div class="flex items-center gap-4">
                    <span class="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                      <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
                      <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="20" /></span>
                    </span>
                    <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="15" /> Nahrát</button>
                  </div>
                </div>
              </TabsContent>

              <!-- Sekce: Prohlídky v kategorii -->
              <TabsContent value="tours" class="outline-none">
                <div v-if="!isEdit" class="rounded-md bg-steel-50 px-4 py-6 text-center text-[13px] text-steel-500">
                  Nejdřív kategorii uložte, poté do ní přidáte prohlídky.
                </div>
                <template v-else>
                  <div class="mb-3 flex justify-end">
                    <AppButton variant="primary" size="sm" @click="goNewTour"><Icon name="plus" :size="15" /> Nová prohlídka</AppButton>
                  </div>
                  <div class="overflow-hidden rounded-lg border border-steel-200">
                    <table class="w-full border-collapse text-left">
                      <thead>
                        <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
                          <th class="px-3 py-2.5 font-600">Prohlídka</th>
                          <th class="w-32 px-2 py-2.5 font-600">Dostupnost</th>
                          <th class="w-28 px-2 py-2.5 font-600">Volná místa</th>
                          <th class="w-12 px-2 py-2.5 text-right font-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="t in tours" :key="t.id" class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60">
                          <td class="px-3 py-2.5 align-middle">
                            <button class="flex items-center gap-2.5 text-left" @click="goTour(t.id)">
                              <span class="h-8 w-11 shrink-0 overflow-hidden rounded bg-steel-100"><img v-if="t.image" :src="t.image" alt="" class="h-full w-full object-cover" /></span>
                              <span class="min-w-0">
                                <span class="block truncate text-[13.5px] font-600 text-graphite-900 group-hover:text-brand-600">{{ t.title.cs }}</span>
                                <span v-if="!t.published" class="text-[11px] text-steel-400">Koncept</span>
                              </span>
                            </button>
                          </td>
                          <td class="px-2 py-2.5 align-middle">
                            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600" :class="[AVAILABILITY_META[availability(t)].bg, AVAILABILITY_META[availability(t)].text]">
                              <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(t)].dot" />
                              {{ AVAILABILITY_META[availability(t)].label }}
                            </span>
                          </td>
                          <td class="px-2 py-2.5 align-middle text-[13px] text-graphite-700">
                            <span v-if="upcomingSlots(t).length" class="tabular-nums">{{ freeSeats(t) }} <span class="text-steel-400">/ nejbližší termíny</span></span>
                            <span v-else class="text-steel-300">—</span>
                          </td>
                          <td class="px-2 py-2.5 text-right align-middle">
                            <div class="flex justify-end"><RowActionsMenu :actions="tourActions" label="Akce s prohlídkou" @select="(key) => onTourAction(key, t)" /></div>
                          </td>
                        </tr>
                        <tr v-if="tours.length === 0">
                          <td colspan="4" class="px-3 py-8 text-center text-[13px] text-steel-500">Zatím žádné prohlídky. Přidejte první.</td>
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
        <PublishCard :published="form.published" :langs="publishRows" updated-by="Jana Svobodová" @toggle-lang="onToggleLang" />
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"><Icon name="sparkles" :size="16" class="text-brand-400" />{{ toast }}</div>
    </Transition>
  </div>
</template>
