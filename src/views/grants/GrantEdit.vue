<script setup lang="ts">
/**
 * Detail dotačního projektu.
 *
 * Krátký formulář schválně: web u projektu ukazuje jen název, termín,
 * registrační číslo a anotaci. Vlastní stránku projekt nemá, takže tu není URL,
 * SEO ani obsah po blocích — povinně zveřejňované údaje se nedají „vylepšit".
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FormSection from '@/components/admin/FormSection.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { filledLangsOf, publishedLangsOf, publishLangRows, toggleLangPublish } from '@/utils/langPublish'
import {
  MOCK_GRANTS,
  blankGrant,
  providerOptions,
  provider,
  GRANT_PHASE_OPTIONS,
  GRANT_PHASE_META,
  phaseMismatch,
  termLabel,
  type GrantProject,
  type GrantPhase,
} from '@/data/mockGrants'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_GRANTS.find((g) => g.id === props.id))
function clone(): GrantProject {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as GrantProject
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  const c = blankGrant()
  c.publishedLangs = LANGS.map((l) => l.code)
  return c
}
const form = reactive<GrantProject>(clone())
const activeLang = ref<LangCode>('cs')
const filledLangs = computed(() => LANGS.filter((l) => form.title[l.code].trim()).map((l) => l.code))

/* ---------- Publikace per jazyk ---------- */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}
const publishStatus = computed({
  get: () => (form.published ? 'published' : 'draft') as 'draft' | 'published' | 'scheduled',
  set: (v: string) => (form.published = v !== 'draft'),
})

/* ---------- Pole ---------- */
const phaseModel = computed({
  get: () => form.phase,
  set: (v: string) => (form.phase = v as GrantPhase),
})
const dateTo = computed({
  get: () => form.to ?? '',
  set: (v: string) => (form.to = v || null),
})
const providerSelect = providerOptions()
const linkedProvider = computed(() => provider(form.providerId))

/* ---------- AI překlad mutací ---------- */
const mlFields: (keyof GrantProject)[] = ['title', 'annotation']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'grants-list' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky hlavička -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'grants-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">grant</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/grants/${form.id}/edit` : '/admin/grants/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nový dotační projekt' }}
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
          :name="form.title.cs"
          entity="projekt"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="router.push({ name: 'grant-new' })"
          @delete="router.push({ name: 'grants-list' })"
        />
      </div>
    </div>

    <!-- Dvousloupcové tělo -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0 space-y-5">
        <FormSection title="Údaje o projektu" icon="grant" tag="grant-basic">
          <div class="space-y-4">
            <div>
              <MlFieldHeader
                label="Název projektu"
                :lang="activeLang"
                tag="grant-title"
                required
                hint="Přesně tak, jak je uvedený v rozhodnutí o poskytnutí dotace."
                @translate="translateField('title')"
              />
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Např. Podpora turistických areálů v roce 2026"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                    Poskytovatel dotace
                    <HelpTip text="Určuje, do které skupiny projekt na webu spadne a jaké logo se u něj ukáže. Loga se spravují v „Poskytovatelé a loga“." />
                  </span>
                  <span class="field-tag">grant-provider_id</span>
                </label>
                <AppSelect v-model="form.providerId" :options="providerSelect" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Registrační číslo *</span>
                  <span class="field-tag">grant-reg_number</span>
                </label>
                <input
                  v-model="form.regNumber"
                  type="text"
                  placeholder="Např. 00116/2026/RRC"
                  class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[12.5px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Termín řešení od *</span>
                  <span class="field-tag">grant-from</span>
                </label>
                <input
                  v-model="form.from"
                  type="date"
                  class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Termín řešení do</span>
                  <span class="field-tag">grant-to</span>
                </label>
                <input
                  v-model="dateTo"
                  type="date"
                  class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                />
                <p class="mt-1.5 text-[11.5px] text-steel-500">Prázdné = zatím neukončeno.</p>
              </div>
            </div>

            <div>
              <MlFieldHeader
                label="Anotace projektu"
                :lang="activeLang"
                tag="grant-annotation"
                hint="Odstavec pod názvem — obsah a cíle projektu. Na webu se zobrazuje celý, nezkracuje se."
                @translate="translateField('annotation')"
              />
              <textarea
                v-model="form.annotation[activeLang]"
                rows="4"
                placeholder="Čeho se projekt týká a co je jeho cílem."
                class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] leading-relaxed text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </FormSection>

        <!-- Náhled záznamu tak, jak ho ukáže web -->
        <FormSection
          title="Náhled na webu"
          icon="monitor"
          tag="grant-preview"
          hint="Takhle projekt vypadá ve výpisu — bez vlastní stránky, bez příloh."
        >
          <div class="rounded-md border border-steel-200 p-4">
            <div class="mb-3 flex items-center gap-3 border-b border-steel-100 pb-3">
              <span class="grid h-10 w-16 shrink-0 place-items-center rounded bg-steel-100 text-[10px] font-600 uppercase tracking-wider text-steel-400">
                logo
              </span>
              <span class="text-[12.5px] font-600 text-graphite-800">{{ linkedProvider?.name ?? 'Bez poskytovatele' }}</span>
            </div>
            <p class="text-[15px] font-700 text-graphite-900">
              {{ form.title[activeLang] || form.title.cs || 'Název projektu' }}
            </p>
            <p class="mt-1 font-mono text-[11.5px] text-steel-500">
              Termín řešení: {{ termLabel(form) }}<template v-if="form.regNumber"> · registrační číslo {{ form.regNumber }}</template>
            </p>
            <p class="mt-2 text-[13px] leading-relaxed text-steel-600">
              {{ form.annotation[activeLang] || form.annotation.cs || 'Anotace projektu…' }}
            </p>
          </div>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection
          title="Fáze projektu"
          icon="layers"
          tag="grant-phase"
          hint="Určuje, pod kterou záložkou se projekt na webu objeví. Udržitelnost je právní stav po skončení projektu — z termínu se odvodit nedá, volí se ručně."
        >
          <AppSelect v-model="phaseModel" :options="GRANT_PHASE_OPTIONS" />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :class="GRANT_PHASE_META[form.phase].dot" />
            {{ GRANT_PHASE_META[form.phase].label }}
          </p>
          <p
            v-if="phaseMismatch(form)"
            class="mt-2 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-700"
          >
            <Icon name="clock" :size="13" class="mt-0.5 shrink-0" />
            Termín řešení už skončil, ale projekt je mezi aktuálně čerpanými. Nemá přejít do udržitelnosti?
          </p>
        </FormSection>

        <PublishCard
          v-model:status="publishStatus"
          :langs="publishRows"
          updated-by="Jan Voznak"
          @toggle-lang="onToggleLang"
        />
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
