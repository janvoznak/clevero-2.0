<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_EVENTS,
  VENUES,
  EVENT_TYPES,
  venue,
  eventStatus,
  EVENT_STATE_META,
  type DovEvent,
} from '@/data/mockEvents'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_EVENTS.find((e) => e.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
type EventForm = DovEvent & { text: ML }

function clone(): EventForm {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify({ ...s, text: { ...empty(), cs: `<p>${s.summary.cs}</p>` } }))
  return {
    id: 'nová',
    title: empty(),
    venueId: 'areal',
    type: 'Festival',
    from: '',
    to: '',
    time: '',
    summary: empty(),
    image: '',
    published: false,
    text: empty(),
  }
}
const form = reactive<EventForm>(clone())
const activeLang = ref<LangCode>('cs')

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}

const venueOptions = VENUES.map((v) => ({ value: v.id, label: v.label }))
const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }))
const status = computed(() => (form.from && form.to ? eventStatus(form) : null))

/* AI překlad (prototyp) — CZ → EN/DE/PL napříč ML poli. */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)
const mlFields: (keyof EventForm)[] = ['title', 'summary', 'text']
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const f of mlFields) {
      const val = form[f] as ML
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
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'events-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">events</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/events/${form.id}` : '/admin/events/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová akce' }}
          </h1>
        </div>

        <!-- Jazykové mutace -->
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="router.push({ name: 'events-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit akci' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <FormSection title="Základní informace" icon="calendar" hint="Název, shrnutí a popis existují samostatně v každé jazykové mutaci." tag="ML">
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Název akce <span class="text-brand-500">*</span></span>
                <span class="field-tag">event-title · {{ activeLang.toUpperCase() }}</span>
              </label>
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Např. Festival AFROSTRAVA"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Shrnutí</span>
                <span class="field-tag">event-summary · {{ activeLang.toUpperCase() }}</span>
              </label>
              <textarea
                v-model="form.summary[activeLang]"
                rows="2"
                placeholder="Krátký popis akce do výpisu"
                class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Budova / místo</label>
                <AppSelect v-model="form.venueId" :options="venueOptions" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Typ akce</label>
                <AppSelect v-model="form.type" :options="typeOptions" />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Termín OD</label>
                <input v-model="form.from" type="date" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Termín DO</label>
                <input v-model="form.to" type="date" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Čas</label>
                <input v-model="form.time" type="time" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
            <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[12px] text-steel-500">
              <Icon name="calendar" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
              Stejné OD i DO = jednodenní akce. Rozdílné datumy = vícedenní / dlouhodobá akce v kalendáři.
            </p>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Popis</span>
                <span class="field-tag">event-text · {{ activeLang.toUpperCase() }}</span>
              </label>
              <RichTextEditor v-model="form.text[activeLang]" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Obrázek akce" icon="image">
          <div class="flex items-center gap-4">
            <span class="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-steel-100">
              <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
              <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="22" /></span>
            </span>
            <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600">
              <Icon name="upload" :size="16" /> Nahrát obrázek
            </button>
          </div>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Publikace" icon="eye">
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Stav akce</span>
              <span v-if="status" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600" :class="[EVENT_STATE_META[status].bg, EVENT_STATE_META[status].text]">
                <span class="h-1.5 w-1.5 rounded-full" :class="EVENT_STATE_META[status].dot" />
                {{ EVENT_STATE_META[status].label }}
              </span>
              <span v-else class="text-[12px] text-steel-400">doplňte termín</span>
            </div>
            <label class="flex items-center gap-2.5 rounded-md px-1 py-1 text-[13px] text-graphite-800">
              <input v-model="form.published" type="checkbox" class="h-4 w-4 accent-brand-500" />
              Zveřejnit na webu
            </label>
          </div>
        </FormSection>

        <!-- Jazykové mutace + AI překlad -->
        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li v-for="l in LANGS" :key="l.code" class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors" :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'">
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
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte český název — z něj se překládá.</span>
            </p>
          </div>
        </FormSection>

        <FormSection title="Zařazení" icon="filter">
          <dl class="space-y-2.5 text-[13px]">
            <div class="flex items-center justify-between">
              <dt class="text-steel-500">Budova</dt>
              <dd><TagChip :label="venue(form.venueId).label" :color="venue(form.venueId).color" /></dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-steel-500">Typ</dt>
              <dd class="font-600 text-graphite-800">{{ form.type }}</dd>
            </div>
          </dl>
        </FormSection>
      </aside>
    </div>

    <!-- Toast -->
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
