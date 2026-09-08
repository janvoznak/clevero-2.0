<script setup lang="ts">
/**
 * Detail volné pozice.
 *
 * Formulář zájmu na webu se tu nesestavuje — jeho pole jsou pevná (jméno,
 * kontakt, motivace, CV, motivační dopis), protože z nich žije modul Uchazeči.
 * Redakce rozhoduje jen o tom, jestli se nabízí, a kdo přihlášky dostane.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import SelectWithCustom from '@/components/admin/SelectWithCustom.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, defaultContentBlocks } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import { filledLangsOf, publishedLangsOf, publishLangRows, toggleLangPublish } from '@/utils/langPublish'
import { PLACE_OPTIONS } from '@/data/mockVenues'
import { CMS_USERS } from '@/data/mockUsers'
import {
  MOCK_POSITIONS,
  blankPosition,
  positionState,
  POSITION_STATE_META,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SALARY_UNIT_OPTIONS,
  applicantsForPosition,
  APPLICANT_STATUS_META,
  fmtSubmitted,
  type JobPosition,
} from '@/data/mockCareers'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_POSITIONS.find((p) => p.id === props.id))
function clone(): JobPosition {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as JobPosition
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  const c = blankPosition()
  c.contentBlocks = defaultContentBlocks()
  c.publishedLangs = LANGS.map((l) => l.code)
  return c
}
const form = reactive<JobPosition>(clone())
const activeLang = ref<LangCode>('cs')
const filledLangs = computed(() => LANGS.filter((l) => form.title[l.code].trim()).map((l) => l.code))

/* ---------- URL slug ---------- */
const emptyML = (): ML => ({ cs: '', en: '', de: '', pl: '' })
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = emptyML()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(() => form.title, () => (form.slug ??= emptyML()))

/* ---------- Publikace per jazyk ---------- */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/* ---------- Sekce ---------- */
const activeSection = ref('basic')
const applicants = computed(() => (isEdit.value ? applicantsForPosition(form.id) : []))
const sections = computed(() => [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Popis pozice', icon: 'text' },
  { value: 'hiring', label: 'Nábor', icon: 'user' },
])

/* ---------- Pole ---------- */
const AREA_ANY = '__any__'
const areaOptions = [{ value: AREA_ANY, label: 'Celý areál / dohodou' }, ...PLACE_OPTIONS]
const areaModel = computed({
  get: () => form.areaId || AREA_ANY,
  set: (v: string) => (form.areaId = v === AREA_ANY ? '' : v),
})
const salaryFrom = computed({
  get: () => (form.salaryFrom == null ? '' : String(form.salaryFrom)),
  set: (v: string) => (form.salaryFrom = v.trim() ? Number(v) : null),
})
const salaryTo = computed({
  get: () => (form.salaryTo == null ? '' : String(form.salaryTo)),
  set: (v: string) => (form.salaryTo = v.trim() ? Number(v) : null),
})
const salaryUnitModel = computed({
  get: () => form.salaryUnit,
  set: (v: string) => (form.salaryUnit = v === 'hour' ? 'hour' : 'month'),
})
const startAt = computed({
  get: () => form.startAt ?? '',
  set: (v: string) => (form.startAt = v || null),
})
const deadline = computed({
  get: () => form.deadline ?? '',
  set: (v: string) => (form.deadline = v || null),
})
const contactOptions = CMS_USERS.map((u) => ({ value: u.name, label: u.name }))

/** Stav pozice — pro odznak v railu. */
const state = computed(() => positionState(form))
const stateMeta = computed(() => POSITION_STATE_META[state.value])
/** Uzávěrka už prošla? Web pak formulář nenabídne, i když je nábor zapnutý. */
const deadlinePassed = computed(() => !!form.deadline && form.deadline < '2026-07-28')

/* Zveřejnění řídí PublishCard, uzávěrka je „zobrazovat do" pozice. */
const publishStatus = computed({
  get: () => (form.published ? 'published' : 'draft') as 'draft' | 'published' | 'scheduled',
  set: (v: string) => (form.published = v !== 'draft'),
})

/* ---------- AI překlad mutací ---------- */
const mlFields: (keyof JobPosition)[] = ['title', 'perex']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'positions-list' })
}
watch(
  () => form.acceptsApplications,
  () => {},
)
</script>

<template>
  <div class="pb-16">
    <!-- Sticky hlavička -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'positions-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">position</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/careers/positions/${form.id}/edit` : '/admin/careers/positions/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová pozice' }}
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
          entity="pozici"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="router.push({ name: 'position-new' })"
          @delete="router.push({ name: 'positions-list' })"
        />
      </div>
    </div>

    <!-- Dvousloupcové tělo -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce pozice">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
                <span
                  v-if="s.value === 'hiring' && applicants.length"
                  class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600"
                >
                  {{ applicants.length }}
                </span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Základní informace -->
              <TabsContent value="basic" class="space-y-4 outline-none">
                <div>
                  <MlFieldHeader label="Název pozice" :lang="activeLang" tag="position-title" required @translate="translateField('title')" />
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Průvodce areálem Dolní Vítkovice"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <SlugField v-model="slugText" :tag="`position-url · ${activeLang.toUpperCase()}`" @edit="markManual(activeLang)" />

                <div>
                  <MlFieldHeader label="Perex" :lang="activeLang" tag="position-perex" @translate="translateField('perex')" />
                  <textarea
                    v-model="form.perex[activeLang]"
                    rows="2"
                    placeholder="Jedna dvě věty do výpisu pozic."
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Úsek</span>
                      <span class="field-tag">position-department</span>
                    </label>
                    <SelectWithCustom
                      v-model="form.department"
                      :options="DEPARTMENT_OPTIONS"
                      custom-label="— vlastní úsek…"
                      input-placeholder="Např. Bezpečnost"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Typ úvazku</span>
                      <span class="field-tag">position-employment</span>
                    </label>
                    <AppSelect v-model="form.employment" :options="EMPLOYMENT_OPTIONS" />
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                      Místo výkonu
                      <HelpTip text="Objekt v Areálu. Pozice se pak dá na webu filtrovat podle místa." />
                    </span>
                    <span class="field-tag">position-area_id</span>
                  </label>
                  <AppSelect v-model="areaModel" :options="areaOptions" />
                </div>

                <!-- Mzda: nejazykové údaje, proto čísla, ne text -->
                <div class="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Mzda od</span>
                      <span class="field-tag">position-salary_from</span>
                    </label>
                    <input
                      v-model="salaryFrom"
                      type="number"
                      placeholder="např. 32000"
                      class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Mzda do</span>
                      <span class="field-tag">position-salary_to</span>
                    </label>
                    <input
                      v-model="salaryTo"
                      type="number"
                      placeholder="nepovinné"
                      class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Jednotka</span>
                      <span class="field-tag">position-salary_unit</span>
                    </label>
                    <AppSelect v-model="salaryUnitModel" :options="SALARY_UNIT_OPTIONS" />
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Nástup možný od</span>
                    <span class="field-tag">position-start_at</span>
                  </label>
                  <input
                    v-model="startAt"
                    type="date"
                    class="h-10 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                  />
                  <p class="mt-1.5 text-[11.5px] text-steel-500">Prázdné = na webu se ukáže „dohodou".</p>
                </div>
              </TabsContent>

              <!-- Popis pozice -->
              <TabsContent value="content" class="outline-none">
                <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Náplň práce, koho hledáme a co nabízíme — poskládané z bloků jako ostatní stránky.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">position-content</span>
                </p>
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Nábor -->
              <TabsContent value="hiring" class="space-y-5 outline-none">
                <FormSection
                  title="Formulář zájmu na webu"
                  icon="send"
                  tag="position-form"
                  hint="Pole formuláře jsou pevná — z nich žije modul Uchazeči. Redakce rozhoduje, jestli se nabízí a komu přihlášky chodí."
                >
                  <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                      <AppSwitch
                        v-model="form.acceptsApplications"
                        label="Přijímat přihlášky"
                        hint="Vypnuté = pozice na webu zůstane, ale bez formuláře (nábor pozastaven)."
                      />
                      <span class="field-tag shrink-0">position-accepts</span>
                    </div>

                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                          Uzávěrka přihlášek
                          <HelpTip text="Po tomto dni web formulář nenabídne, i když je nábor zapnutý. Prázdné = bez uzávěrky." />
                        </span>
                        <span class="field-tag">position-deadline</span>
                      </label>
                      <input
                        v-model="deadline"
                        type="date"
                        class="h-10 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                      />
                      <p v-if="deadlinePassed" class="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-700">
                        <Icon name="clock" :size="13" class="mt-0.5 shrink-0" />
                        Uzávěrka už prošla — formulář se na webu nezobrazuje.
                      </p>
                    </div>

                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Přihlášky řeší</span>
                        <span class="field-tag">position-contact_user</span>
                      </label>
                      <AppSelect v-model="form.contactUser" :options="contactOptions" />
                      <p class="mt-1.5 flex items-center gap-2 text-[11.5px] text-steel-500">
                        <UserAvatar :name="form.contactUser" :size="20" />
                        Nová přihláška se přiřadí jemu a dostane upozornění e-mailem.
                      </p>
                    </div>

                    <!-- Co formulář sbírá (pevná pole) -->
                    <div class="rounded-md border border-steel-200 bg-steel-50/60 p-3">
                      <p class="mb-2 field-tag">Formulář sbírá</p>
                      <ul class="grid gap-1.5 text-[12.5px] text-graphite-700 sm:grid-cols-2">
                        <li class="flex items-center gap-1.5"><Icon name="user" :size="13" class="text-steel-400" /> Jméno a příjmení</li>
                        <li class="flex items-center gap-1.5"><Icon name="mail" :size="13" class="text-steel-400" /> E-mail</li>
                        <li class="flex items-center gap-1.5"><Icon name="chat" :size="13" class="text-steel-400" /> Telefon</li>
                        <li class="flex items-center gap-1.5"><Icon name="text" :size="13" class="text-steel-400" /> Proč se hlásíte</li>
                        <li class="flex items-center gap-1.5"><Icon name="file" :size="13" class="text-steel-400" /> Životopis (PDF, DOC)</li>
                        <li class="flex items-center gap-1.5"><Icon name="paperclip" :size="13" class="text-steel-400" /> Motivační dopis (nepovinný)</li>
                      </ul>
                      <p class="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                        <Icon name="help" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                        Součástí formuláře je souhlas se zpracováním osobních údajů. Podle něj se v Uchazečích hlídá,
                        do kdy se přihláška smí uchovávat.
                      </p>
                    </div>
                  </div>
                </FormSection>

                <!-- Přihlášky na tuto pozici (zrcadlo z modulu Uchazeči) -->
                <FormSection
                  title="Přihlášky na tuto pozici"
                  icon="user"
                  tag="applicant-position_id · read-only"
                  hint="Přihlášky se spravují v modulu Uchazeči — tady se jen zrcadlí."
                >
                  <ul v-if="applicants.length" class="space-y-1.5">
                    <li v-for="a in applicants" :key="a.id">
                      <button
                        class="flex w-full items-center gap-3 rounded-md border border-steel-200 px-3 py-2 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40"
                        @click="router.push({ name: 'applicant-detail', params: { id: a.id } })"
                      >
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-[13px] font-500 text-graphite-800">{{ a.name }}</span>
                          <span class="block font-mono text-[11px] text-steel-400">{{ fmtSubmitted(a.createdAt) }}</span>
                        </span>
                        <span
                          class="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-600"
                          :class="[APPLICANT_STATUS_META[a.status].bg, APPLICANT_STATUS_META[a.status].text]"
                        >
                          {{ APPLICANT_STATUS_META[a.status].label }}
                        </span>
                        <Icon name="chevronRight" :size="15" class="shrink-0 text-steel-400" />
                      </button>
                    </li>
                  </ul>
                  <p v-else class="text-[12.5px] text-steel-400">
                    Zatím žádná přihláška. Až někdo odešle formulář, objeví se tady.
                  </p>
                </FormSection>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Stav pozice" icon="briefcase" tag="position-state">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
            :class="[stateMeta.bg, stateMeta.text]"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="stateMeta.dot" />
            {{ stateMeta.label }}
          </span>
          <p class="mt-2 text-[12px] leading-relaxed text-steel-500">{{ stateMeta.hint }}</p>
        </FormSection>

        <PublishCard
          v-model:status="publishStatus"
          v-model:publish-to="deadline"
          :langs="publishRows"
          updated-by="Jana Svobodová"
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
