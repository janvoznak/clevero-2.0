<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import CreatableSelect from '@/components/ui/CreatableSelect.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_FAQ,
  FAQ_CATEGORIES,
  registerFaqCategory,
  faqState,
  FAQ_STATE_META,
  blankFaqItem,
  type FaqItem,
} from '@/data/mockFaq'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_FAQ.find((f) => f.id === props.id))
function clone(): FaqItem {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as FaqItem
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.question), c.publishedLangs)
    return c
  }
  return blankFaqItem()
}
const form = reactive<FaqItem>(clone())
const activeLang = ref<LangCode>('cs')

/* Kategorie (výběr s možností vytvořit novou přímo tady). */
const categoryOptions = computed(() =>
  FAQ_CATEGORIES.map((c) => ({ value: c.label, label: c.label })),
)
function onCreateCategory(label: string) {
  registerFaqCategory(label) // model už nastaví CreatableSelect
}

function langFilled(code: LangCode): boolean {
  return form.question[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))
const state = computed(() => faqState(form))

/* ---------- Publikování per jazyk ----------
   Stav dotazu (PublishCard) řídí, ZDA je dotaz živý; tyto přepínače řídí,
   KTERÉ jazykové mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.question), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.question, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.question), code)
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof FaqItem)[] = ['question', 'answer']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'faq-list' })
}
function onDuplicate() {
  router.push({ name: 'faq-new' })
}

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

        <LangBar
          v-model="activeLang"
          :filled="filledLangs"
          :published="liveLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />

        <div class="h-6 w-px bg-steel-200" />
        <DetailActions
          :name="form.question.cs"
          entity="dotaz"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="onDuplicate"
          @delete="router.push({ name: 'faq-list' })"
        />
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
            <MlFieldHeader label="Otázka" :lang="activeLang" tag="faq-question" required @translate="translateField('question')" />
            <input
              v-model="form.question[activeLang]"
              type="text"
              placeholder="Např. Musím si koupit vstupenku předem?"
              class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <!-- Odpověď -->
          <div>
            <MlFieldHeader label="Odpověď" :lang="activeLang" tag="faq-answer" :overlay="false" @translate="translateField('answer')" />
            <p class="mb-2 text-[11.5px] text-steel-500">
              Napiš odpověď vlastními slovy — klidně jen v bodech. DOVík ji dole přepíše do souvislých vět.
            </p>
            <RichTextEditor v-model="form.answer[activeLang]" ai="dovik" />
          </div>

          <!-- Zařazení (dříve v pravém railu) -->
          <div class="mt-5">
            <label class="mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                Kategorie
                <HelpTip text="Pořadí dotazu ve své kategorii nastavíš přetažením ve výpisu FAQ." />
              </span>
              <span class="field-tag">faq-category</span>
            </label>
            <CreatableSelect
              v-model="form.category"
              :options="categoryOptions"
              placeholder="Vyberte nebo napište kategorii…"
              create-noun="kategorii"
              @create="onCreateCategory"
            />
          </div>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Zveřejnění -->
        <PublishCard
          :published="form.published"
          :langs="publishRows"
          updated-by="Martin Kučera"
          @toggle-lang="onToggleLang"
        />
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
