<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import AiPanel from '@/components/admin/AiPanel.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_FAQ,
  FAQ_CATEGORY_OPTIONS,
  faqState,
  FAQ_STATE_META,
  blankFaqItem,
  type FaqItem,
} from '@/data/mockFaq'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_FAQ.find((f) => f.id === props.id))
function clone(): FaqItem {
  const s = source.value
  return s ? JSON.parse(JSON.stringify(s)) : blankFaqItem()
}
const form = reactive<FaqItem>(clone())
const activeLang = ref<LangCode>('cs')

function langFilled(code: LangCode): boolean {
  return form.question[code].trim().length > 0
}
const state = computed(() => faqState(form))

/* ---------- AI: příprava odpovědi z otázky (prototyp — žádná reálná AI) ----------
   Z otázky v aktivní mutaci připraví koncept odpovědi. V ostrém CMS by tu
   volal jazykový model; tady je jen simulovaný stav + zástupný text. */
const answering = ref(false)
const toast = ref('')
const questionReady = computed(() => form.question[activeLang.value].trim().length > 0)

function draftAnswer(question: string): string {
  const q = question.trim().replace(/\s+/g, ' ')
  return (
    `<p>Děkujeme za dotaz. <em>(Návrh připravený AI — zkontrolujte a upravte podle skutečnosti.)</em></p>` +
    `<p>Stručná odpověď na „${q}": ano, rádi poradíme. Doporučujeme sledovat aktuální informace u konkrétní ` +
    `atraktivity nebo prohlídky, protože se mohou lišit podle sezóny.</p>` +
    `<p>Pokud budete potřebovat víc detailů, ozvěte se nám — rádi pomůžeme.</p>`
  )
}
function generateAnswer() {
  if (answering.value || !questionReady.value) return
  answering.value = true
  const l = activeLang.value
  window.setTimeout(() => {
    form.answer[l] = draftAnswer(form.question[l])
    answering.value = false
    toast.value = `Návrh odpovědi připraven (${l.toUpperCase()}) — zkontrolujte a upravte`
    window.setTimeout(() => (toast.value = ''), 3200)
  }, 1200)
}

/* ---------- AI překlad (prototyp) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const mlFields: (keyof FaqItem)[] = ['question', 'answer']
const sourceReady = computed(() => form.question[SOURCE_LANG].trim().length > 0)
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

/** Prostý text odpovědi pro webový náhled. */
const answerPlain = computed(() => form.answer[activeLang.value].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="router.push({ name: 'faq-list' })">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">faq</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/faq/${form.id}/edit` : '/admin/faq/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.question.cs || 'Bez otázky' : 'Nový dotaz' }}
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
        <AppButton variant="secondary" @click="router.push({ name: 'faq-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit dotaz' }}
        </AppButton>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <div class="rounded-lg border border-steel-200 bg-white p-5">
          <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
            Otázka i odpověď existují samostatně v každé jazykové mutaci.
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
          </p>

          <!-- Otázka -->
          <div class="mb-5">
            <label class="mb-1.5 flex items-center justify-between">
              <span class="text-[13px] font-600 text-graphite-800">Otázka <span class="text-brand-500">*</span></span>
              <span class="field-tag">faq-question · {{ activeLang.toUpperCase() }}</span>
            </label>
            <input
              v-model="form.question[activeLang]"
              type="text"
              placeholder="Např. Musím si koupit vstupenku předem?"
              class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <!-- AI: příprava odpovědi z otázky (sjednocený AI blok) -->
          <AiPanel
            title="Připravit odpověď s AI"
            hint="Z otázky navrhne koncept odpovědi, který upravíte."
            :default-open="true"
            class="mb-5"
          >
            <div class="rounded-md border border-steel-200 bg-white px-3 py-2.5">
              <p class="field-tag mb-1">Otázka ({{ activeLang.toUpperCase() }})</p>
              <p class="text-[13px] text-graphite-800" :class="!questionReady && 'italic text-steel-400'">
                {{ form.question[activeLang] || 'Nejdřív napište otázku výše…' }}
              </p>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <AppButton variant="primary" size="sm" :disabled="answering || !questionReady" @click="generateAnswer">
                <Icon name="sparkles" :size="15" :class="answering && 'animate-pulse'" />
                {{ answering ? 'Připravuji odpověď…' : form.answer[activeLang] ? 'Přegenerovat odpověď' : 'Navrhnout odpověď' }}
              </AppButton>
              <span class="text-[11.5px] text-steel-500">Vloží se do pole „Odpověď" — pak upravte podle skutečnosti.</span>
            </div>
          </AiPanel>

          <!-- Odpověď -->
          <div>
            <label class="mb-1.5 flex items-center justify-between">
              <span class="text-[13px] font-600 text-graphite-800">Odpověď</span>
              <span class="field-tag">faq-answer · {{ activeLang.toUpperCase() }}</span>
            </label>
            <RichTextEditor v-model="form.answer[activeLang]" />
          </div>

          <!-- Náhled na webu (akordeon) -->
          <div class="mt-6 rounded-md border border-steel-200 bg-steel-50 p-4">
            <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="eye" :size="13" /> Náhled na webu</p>
            <div class="rounded-md bg-white p-3 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <p class="text-[14px] font-600 text-graphite-900">{{ form.question[activeLang] || 'Otázka se zobrazí zde' }}</p>
                <Icon name="chevronDown" :size="16" class="shrink-0 text-steel-400" />
              </div>
              <p class="mt-2 border-t border-steel-100 pt-2 text-[13px] leading-relaxed text-steel-600">
                {{ answerPlain || 'Odpověď se zobrazí zde…' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Zveřejnění -->
        <FormSection title="Zveřejnění" icon="eye" tag="faq-published">
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Aktuální stav</span>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600" :class="[FAQ_STATE_META[state].bg, FAQ_STATE_META[state].text]">
                <span class="h-1.5 w-1.5 rounded-full" :class="FAQ_STATE_META[state].dot" />
                {{ FAQ_STATE_META[state].label }}
              </span>
            </div>
            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.published" label="Zveřejnit na webu" aria-label="Zveřejnit na webu" />
            </div>
          </div>
        </FormSection>

        <!-- Kategorie -->
        <FormSection title="Kategorie" icon="layers" tag="faq-category">
          <AppSelect v-model="form.category" :options="FAQ_CATEGORY_OPTIONS" placeholder="Vyberte kategorii…" />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="layers" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            Kategorie seskupuje dotazy na webu do tematických sekcí.
          </p>
        </FormSection>

        <!-- Pořadí -->
        <FormSection title="Pořadí" icon="filter" tag="faq-order">
          <input
            v-model.number="form.order"
            type="number"
            min="1"
            class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
          />
          <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">Nižší číslo = dotaz výš ve své kategorii.</p>
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
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte českou verzi — z ní se překládá.</span>
            </p>
          </div>
        </FormSection>
      </aside>
    </div>

    <!-- Toast (potvrzení AI akce) -->
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
