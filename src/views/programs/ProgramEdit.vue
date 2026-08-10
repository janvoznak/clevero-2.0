<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, defaultContentBlocks } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_PROGRAMS, SCHOOL_LEVELS, GRADES, FOCUS_AREAS, PROGRAM_TAGS, blankProgram,
  type Program,
} from '@/data/mockPrograms'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_PROGRAMS.find((p) => p.id === props.id))
function clone(): Program {
  const s = source.value
  const c = s ? (JSON.parse(JSON.stringify(s)) as Program) : blankProgram()
  c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
  return c
}
const form = reactive<Program>(clone())
const activeLang = ref<LangCode>('cs')

const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'education' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'zarazeni', label: 'Zařazení a vazby', icon: 'layers' },
  { value: 'params', label: 'Parametry programu', icon: 'reference' },
]
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Parametry (opakovatelné řádky) ---------- */
let paramSeq = 0
function addParam() {
  paramSeq++
  form.params.push({ id: `p-new-${paramSeq}`, name: '', value: '' })
}
function removeParam(i: number) {
  form.params.splice(i, 1)
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof Program)[] = ['title', 'perex']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="router.push({ name: 'programs-list' })">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">program</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/education/${form.id}/edit` : '/admin/education/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nový program' }}
          </h1>
        </div>
        <LangBar
          v-model="activeLang"
          :filled="filledLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />
        <div class="h-6 w-px bg-steel-200" />
        <CardActionsMenu
          v-if="isEdit"
          :name="form.title.cs"
          entity="program"
          @delete="router.push({ name: 'programs-list' })"
        />
        <AppButton variant="secondary" @click="router.push({ name: 'programs-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit program' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce programu">
              <TabsTrigger v-for="s in sections" :key="s.value" :value="s.value" class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700">
                <Icon :name="s.icon" :size="16" /> {{ s.label }}
                <span v-if="s.value === 'params'" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">{{ form.params.length }}</span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Základní informace -->
              <TabsContent value="basic" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Název, perex a popis existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
                  <div>
                    <MlFieldHeader label="Název programu" :lang="activeLang" tag="program-title" required @translate="translateField('title')" />
                    <input v-model="form.title[activeLang]" type="text" placeholder="Např. Co za to stojí" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <MlFieldHeader label="Perex" :lang="activeLang" tag="program-perex" @translate="translateField('perex')" />
                    <textarea v-model="form.perex[activeLang]" rows="2" placeholder="Krátký výtah zobrazený ve výpisu programů" class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Obrázek programu</span>
                      <span class="field-tag">program-image</span>
                    </label>
                    <div class="flex items-center gap-4">
                      <span class="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                        <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
                        <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="20" /></span>
                      </span>
                      <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="15" /> Nahrát</button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Zařazení -->
              <TabsContent value="zarazeni" class="space-y-5 outline-none">
                <p class="mb-1 text-[12.5px] text-steel-500">Zařazení programu — podle něj se na webu filtruje.</p>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Stupeň školy</span>
                    <span class="field-tag">program-categories</span>
                  </label>
                  <TagPicker v-model="form.categories" :options="SCHOOL_LEVELS" add-label="Přidat stupeň" empty-label="Zatím žádný stupeň." color-label="Barva" />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Ročníky</span>
                    <span class="field-tag">program-grades</span>
                  </label>
                  <TagPicker v-model="form.grades" :options="GRADES" add-label="Přidat ročník" empty-label="Zatím žádné ročníky." color-label="Barva" />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Zaměření</span>
                    <span class="field-tag">program-focus</span>
                  </label>
                  <TagPicker v-model="form.focus" :options="FOCUS_AREAS" add-label="Přidat zaměření" empty-label="Zatím žádné zaměření." color-label="Barva zaměření" />
                </div>

                <!-- Rezervace (DOVIS) — dříve v pravém railu -->
                <div class="rounded-md border border-steel-200 p-4">
                  <p class="mb-3 flex items-center gap-2 text-[13px] font-600 text-graphite-800"><Icon name="externalLink" :size="15" class="text-steel-400" /> Rezervace (DOVIS)</p>
                  <div class="space-y-3">
                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Odkaz na rezervaci</span>
                        <span class="field-tag">program-reservation</span>
                      </label>
                      <div class="relative">
                        <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                        <input v-model="form.reservationUrl" type="url" placeholder="https://vyuka.dolnivitkovice.cz/…" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Text tlačítka</label>
                      <input v-model="form.reservationLabel" type="text" placeholder="Rezervace" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      Odkaz se generuje v systému <span class="font-600 text-graphite-700">DOVIS</span> a vloží se sem. Na webu se u programu zobrazí jako tlačítko „{{ form.reservationLabel || 'Rezervace' }}".
                    </p>
                  </div>
                </div>
              </TabsContent>

              <!-- Parametry programu -->
              <TabsContent value="params" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Dvojice název–hodnota, které se na webu zobrazí jako přehled parametrů (délka, kapacita, cena…).
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">program-params</span>
                </p>
                <div class="overflow-hidden rounded-lg border border-steel-200">
                  <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_40px] gap-2 border-b border-steel-200 bg-steel-50 px-3 py-2 text-[11px] font-600 uppercase tracking-wide text-steel-500">
                    <span>Název</span><span>Hodnota</span><span></span>
                  </div>
                  <div v-for="(p, i) in form.params" :key="p.id" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_40px] items-center gap-2 border-b border-steel-100 px-3 py-2 last:border-0">
                    <input v-model="p.name" type="text" placeholder="Např. Délka programu" class="h-9 w-full rounded-md border border-steel-200 px-2.5 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                    <input v-model="p.value" type="text" placeholder="Např. 90 minut" class="h-9 w-full rounded-md border border-steel-200 px-2.5 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                    <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600" aria-label="Odebrat řádek" @click="removeParam(i)"><Icon name="trash" :size="15" /></button>
                  </div>
                  <div v-if="!form.params.length" class="px-3 py-6 text-center text-[12.5px] text-steel-500">Zatím žádné parametry.</div>
                </div>
                <button type="button" class="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600" @click="addParam"><Icon name="plus" :size="15" /> Přidat řádek</button>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard updated-by="Hana Svrčková" />

        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="program-tags">
          <TagPicker v-model="form.tags" :options="PROGRAM_TAGS" add-label="Přidat štítek" empty-label="Zatím žádné štítky." color-label="Barva štítku" />
        </FormSection>
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"><Icon name="sparkles" :size="16" class="text-brand-400" />{{ toast }}</div>
    </Transition>
  </div>
</template>
