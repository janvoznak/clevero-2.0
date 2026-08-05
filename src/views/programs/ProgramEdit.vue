<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
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
  return s ? JSON.parse(JSON.stringify(s)) : blankProgram()
}
const form = reactive<Program>(clone())
const activeLang = ref<LangCode>('cs')

const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'education' },
  { value: 'params', label: 'Parametry programu', icon: 'layers' },
]
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}

/* ---------- Parametry (opakovatelné řádky) ---------- */
let paramSeq = 0
function addParam() {
  paramSeq++
  form.params.push({ id: `p-new-${paramSeq}`, name: '', value: '' })
}
function removeParam(i: number) {
  form.params.splice(i, 1)
}

/* ---------- AI překlad (prototyp) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const mlFields: (keyof Program)[] = ['title', 'perex', 'description']
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
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger v-for="l in LANGS" :key="l.code" :value="l.code" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm">
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
        <div class="h-6 w-px bg-steel-200" />
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
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Název programu <span class="text-brand-500">*</span></span>
                      <span class="field-tag">program-title · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input v-model="form.title[activeLang]" type="text" placeholder="Např. Co za to stojí" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Perex</span>
                      <span class="field-tag">program-perex · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <textarea v-model="form.perex[activeLang]" rows="2" placeholder="Krátký výtah zobrazený ve výpisu programů" class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Popis programu</span>
                      <span class="field-tag">program-description · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <RichTextEditor v-model="form.description[activeLang]" />
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
        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="program-tags">
          <TagPicker v-model="form.tags" :options="PROGRAM_TAGS" add-label="Přidat štítek" empty-label="Zatím žádné štítky." color-label="Barva štítku" />
        </FormSection>

        <!-- Rezervace (DOVIS) -->
        <FormSection title="Rezervace (DOVIS)" icon="externalLink" tag="program-reservation">
          <div class="space-y-3">
            <div>
              <label class="mb-1.5 block text-[12.5px] font-600 text-graphite-800">Odkaz na rezervaci</label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input v-model="form.reservationUrl" type="url" placeholder="https://vyuka.dolnivitkovice.cz/…" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-[12.5px] font-600 text-graphite-800">Text tlačítka</label>
              <input v-model="form.reservationLabel" type="text" placeholder="Rezervace" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
            </div>
            <a v-if="form.reservationUrl" :href="form.reservationUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-[12px] font-600 text-brand-600 hover:text-brand-700">
              <Icon name="externalLink" :size="13" /> Otevřít odkaz
            </a>
            <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              Odkaz se generuje v systému <span class="font-600 text-graphite-700">DOVIS</span> a vloží se sem. Na webu se u programu zobrazí jako tlačítko „{{ form.reservationLabel || 'Rezervace' }}".
            </p>
          </div>
        </FormSection>

        <!-- Zařazení -->
        <FormSection title="Stupeň školy" icon="layers" tag="program-categories">
          <TagPicker v-model="form.categories" :options="SCHOOL_LEVELS" add-label="Přidat stupeň" empty-label="Zatím žádný stupeň." color-label="Barva" />
        </FormSection>
        <FormSection title="Ročníky" icon="filter" tag="program-grades">
          <TagPicker v-model="form.grades" :options="GRADES" add-label="Přidat ročník" empty-label="Zatím žádné ročníky." color-label="Barva" />
        </FormSection>
        <FormSection title="Zaměření" icon="reference" tag="program-focus">
          <TagPicker v-model="form.focus" :options="FOCUS_AREAS" add-label="Přidat zaměření" empty-label="Zatím žádné zaměření." color-label="Barva zaměření" />
        </FormSection>

        <!-- Obrázek -->
        <FormSection title="Obrázek programu" icon="image" tag="program-image">
          <div class="flex items-center gap-4">
            <span class="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-steel-100">
              <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
              <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="20" /></span>
            </span>
            <!-- prototyp — nahrání je nefunkční vizuální zástupka -->
            <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="15" /> Nahrát</button>
          </div>
        </FormSection>

        <!-- Jazykové mutace -->
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
