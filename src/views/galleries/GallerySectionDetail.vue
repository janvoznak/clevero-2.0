<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_SECTIONS,
  galleriesInSection,
  galleryCover,
  galleryCount,
  galleryState,
  GALLERY_STATE_META,
  blankSection,
  type GallerySection,
  type Gallery,
} from '@/data/mockGalleries'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_SECTIONS.find((s) => s.id === props.id))
function clone(): GallerySection {
  const s = source.value
  return s ? JSON.parse(JSON.stringify(s)) : blankSection()
}
const form = reactive<GallerySection>(clone())
const activeLang = ref<LangCode>('cs')

/** Sekce detailu (podtržené záložky). */
const activeSection = ref('info')
const sections = [
  { value: 'info', label: 'Základní informace', icon: 'page' },
  { value: 'galleries', label: 'Galerie v sekci', icon: 'gallery' },
]
function langFilled(code: LangCode): boolean {
  return form.name[code].trim().length > 0
}

const galleries = computed(() => (isEdit.value ? galleriesInSection(props.id!) : []))

/* ---------- AI překlad (prototyp — bez reálné AI) ---------- */
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

/* ---------- Galerie v sekci ---------- */
function goNewGallery() {
  router.push({ name: 'gallery-new', query: { section: props.id } })
}
function goGallery(id: string) {
  router.push({ name: 'gallery-edit', params: { id } })
}
const galleryActions = [
  { key: 'edit', label: 'Editovat galerii', icon: 'edit' },
  { key: 'delete', label: 'Smazat galerii', icon: 'trash', danger: true },
]
function onGalleryAction(key: string, g: Gallery) {
  if (key === 'edit') goGallery(g.id)
  // delete v prototypu na této obrazovce neřešíme
}
function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="router.push({ name: 'galleries-list' })">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">gallery-section</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/galleries/section/${form.id}` : '/admin/galleries/section/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.name.cs || 'Bez názvu' : 'Nová sekce' }}
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
        <AppButton variant="secondary" @click="router.push({ name: 'galleries-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit sekci' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce detailu">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
                <span v-if="s.value === 'galleries' && isEdit" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">{{ galleries.length }}</span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="info" class="space-y-4 outline-none">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Název sekce <span class="text-brand-500">*</span></span>
                    <span class="field-tag">section-name · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input v-model="form.name[activeLang]" type="text" placeholder="Např. Fotografie atraktivit" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Popis sekce</span>
                    <span class="field-tag">section-description · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <RichTextEditor v-model="form.description[activeLang]" />
                </div>
              </TabsContent>

              <!-- Sekce: Galerie v sekci -->
              <TabsContent value="galleries" class="outline-none">
                <div v-if="!isEdit" class="rounded-md bg-steel-50 px-4 py-6 text-center text-[13px] text-steel-500">
                  Nejdřív sekci uložte, poté do ní přidáte galerie.
                </div>
                <template v-else>
                  <div class="mb-3 flex justify-end">
                    <AppButton variant="primary" size="sm" @click="goNewGallery"><Icon name="plus" :size="15" /> Nová galerie</AppButton>
                  </div>
                  <div class="overflow-hidden rounded-lg border border-steel-200">
                    <table class="w-full border-collapse text-left">
                      <thead>
                        <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
                          <th class="px-3 py-2.5 font-600">Galerie</th>
                          <th class="w-24 px-2 py-2.5 font-600">Fotek</th>
                          <th class="w-32 px-2 py-2.5 font-600">Datum</th>
                          <th class="w-28 px-2 py-2.5 font-600">Stav</th>
                          <th class="w-12 px-2 py-2.5 text-right font-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="g in galleries" :key="g.id" class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60">
                          <td class="px-3 py-2.5 align-middle">
                            <button class="flex items-center gap-2.5 text-left" @click="goGallery(g.id)">
                              <span class="grid h-8 w-11 shrink-0 place-items-center overflow-hidden rounded bg-steel-100 text-steel-400">
                                <img v-if="galleryCover(g)" :src="galleryCover(g)" alt="" class="h-full w-full object-cover" />
                                <Icon v-else name="image" :size="14" />
                              </span>
                              <span class="block truncate text-[13.5px] font-600 text-graphite-900 group-hover:text-brand-600">{{ g.name.cs }}</span>
                            </button>
                          </td>
                          <td class="px-2 py-2.5 align-middle text-[13px] text-graphite-700 tabular-nums">{{ galleryCount(g) }}</td>
                          <td class="px-2 py-2.5 align-middle text-[13px] text-graphite-700 tabular-nums">{{ fmtDate(g.date) }}</td>
                          <td class="px-2 py-2.5 align-middle">
                            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600" :class="[GALLERY_STATE_META[galleryState(g)].bg, GALLERY_STATE_META[galleryState(g)].text]">
                              <span class="h-1.5 w-1.5 rounded-full" :class="GALLERY_STATE_META[galleryState(g)].dot" />
                              {{ GALLERY_STATE_META[galleryState(g)].label }}
                            </span>
                          </td>
                          <td class="px-2 py-2.5 text-right align-middle">
                            <div class="flex justify-end"><RowActionsMenu :actions="galleryActions" label="Akce s galerií" @select="(key) => onGalleryAction(key, g)" /></div>
                          </td>
                        </tr>
                        <tr v-if="galleries.length === 0">
                          <td colspan="5" class="px-3 py-8 text-center text-[13px] text-steel-500">Zatím žádné galerie. Přidejte první.</td>
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
        <FormSection title="Zveřejnění" icon="eye">
          <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
            <AppSwitch v-model="form.published" label="Zveřejnit na webu" aria-label="Zveřejnit na webu" />
            <span class="field-tag">section-published</span>
          </div>
        </FormSection>

        <FormSection title="Náhledový obrázek" icon="image" tag="section-cover">
          <div class="flex items-center gap-4">
            <span class="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-steel-100">
              <img v-if="form.cover" :src="form.cover" alt="" class="h-full w-full object-cover" />
              <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="20" /></span>
            </span>
            <!-- prototyp — nahrání je nefunkční vizuální zástupka -->
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
