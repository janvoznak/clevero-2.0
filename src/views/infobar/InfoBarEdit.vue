<script setup lang="ts">
/**
 * Podmodul „Informační lišta" — úzký pruh nad hlavním menu webu.
 * Jeden záznam (web zobrazuje nejvýš jednu lištu), proto bez seznamu:
 * rovnou editace ve vzoru detailu (sticky hlavička + jazykové pilulky + rail).
 * Náhled ukazuje, jak lišta sedí nad menu — prototyp, nic se neukládá.
 */
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_INFO_BAR,
  infoBarState,
  INFO_BAR_STATE_META,
  type InfoBar,
} from '@/data/mockInfoBar'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'

const form = reactive<InfoBar>({
  ...JSON.parse(JSON.stringify(MOCK_INFO_BAR)),
  // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
  publishedLangs: publishedLangsOf(filledLangsOf(MOCK_INFO_BAR.text), MOCK_INFO_BAR.publishedLangs),
})

const activeLang = ref<LangCode>('cs')
const filledLangs = computed(() => LANGS.filter((l) => form.text[l.code].trim()).map((l) => l.code))

/* ---------- Publikace per jazyk (viditelnost lišty v jednotlivých mutacích) ---------- */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.text), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.text, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.text), code)
}

/* ---------- Stav lišty ----------
   Stav drží modul, `PublishCard` je jeho jediným ovladačem (v-model:status):
   Koncept = vypnuto, Publikováno = zapnuto, Naplánováno = zapnuto od termínu. */
type Status = 'draft' | 'published' | 'scheduled'
const status = computed<Status>({
  get: () => (!form.enabled ? 'draft' : form.showFrom ? 'scheduled' : 'published'),
  set: (v: Status) => {
    form.enabled = v !== 'draft'
    if (v !== 'scheduled') form.showFrom = null
  },
})
/** Datumová pole karty (prázdný řetězec ↔ null v modelu). */
const showFrom = computed({
  get: () => form.showFrom ?? '',
  set: (v: string) => (form.showFrom = v || null),
})
const hideAt = computed({
  get: () => form.hideAt ?? '',
  set: (v: string) => (form.hideAt = v || null),
})

const state = computed(() => infoBarState(form))
const stateMeta = computed(() => INFO_BAR_STATE_META[state.value])

/* ---------- Náhled ---------- */
const previewText = computed(() => form.text[activeLang.value].trim())
const previewLink = computed(() => form.linkLabel[activeLang.value].trim())
/** Ukáže se lišta na webu v právě prohlížené mutaci? */
const visibleInLang = computed(
  () => state.value === 'active' && liveLangs.value.includes(activeLang.value) && !!previewText.value,
)

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof InfoBar)[] = ['text', 'linkLabel']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky hlavička -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">infobar</span>
            <span class="font-mono text-[11px] text-steel-400">/admin/infobar</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            Informační lišta
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
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit' }}
        </AppButton>
      </div>
    </div>

    <!-- Dvousloupcové tělo -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0 space-y-5">
        <!-- Náhled: lišta sedí nad hlavním menu webu -->
        <FormSection
          title="Náhled"
          icon="monitor"
          tag="infobar-preview"
          hint="Takhle lišta sedí na webu nad hlavním menu. Náhled ukazuje právě prohlíženou jazykovou mutaci."
        >
          <div class="overflow-hidden rounded-md border border-steel-200">
            <!-- Samotná lišta -->
            <div
              v-if="visibleInLang"
              class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand-500 px-4 py-2.5 text-center"
            >
              <span class="text-[13px] font-500 text-white">{{ previewText }}</span>
              <a
                v-if="previewLink && form.linkUrl"
                href="#"
                class="inline-flex items-center gap-1 text-[13px] font-700 text-white underline underline-offset-2"
                @click.prevent
              >
                {{ previewLink }}
                <Icon :name="form.newWindow ? 'externalLink' : 'chevronRight'" :size="13" />
              </a>
            </div>
            <div v-else class="flex items-center justify-center gap-2 bg-steel-100 px-4 py-2.5 text-center">
              <Icon name="eye" :size="14" class="text-steel-400" />
              <span class="text-[12.5px] text-steel-500">
                <template v-if="!previewText">V této mutaci není vyplněný text — lišta se nezobrazí.</template>
                <template v-else-if="state !== 'active'">{{ stateMeta.hint }}</template>
                <template v-else>Tato jazyková mutace je skrytá — zapněte ji vpravo v Publikaci.</template>
              </span>
            </div>

            <!-- Naznačené menu webu pod lištou (jen kulisa náhledu) -->
            <div class="flex items-center gap-5 border-t border-steel-200 bg-white px-4 py-3">
              <span class="h-5 w-24 rounded bg-graphite-900/85" aria-hidden="true" />
              <span class="hidden gap-4 text-[12px] font-600 text-steel-400 sm:flex">
                <span>Akce</span><span>Prohlídky</span><span>Areál</span><span>Galerie</span><span>Kontakt</span>
              </span>
            </div>
          </div>
        </FormSection>

        <!-- Text lišty -->
        <FormSection title="Text lišty" icon="text" tag="infobar-text">
          <MlFieldHeader
            label="Text"
            :lang="activeLang"
            tag="infobar-text"
            required
            hint="Krátké provozní sdělení — jedna věta. Prázdná mutace se na webu nezobrazí."
            @translate="translateField('text')"
          />
          <textarea
            v-model="form.text[activeLang]"
            rows="2"
            placeholder="Např. Bolt Tower je od 4. do 8. srpna uzavřen kvůli údržbě výtahu."
            class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          />
        </FormSection>

        <!-- Odkaz -->
        <FormSection
          title="Odkaz"
          icon="link"
          tag="infobar-link"
          hint="Nepovinný. Bez popisku nebo bez adresy zůstane lišta jen textem."
        >
          <div class="space-y-4">
            <div>
              <MlFieldHeader
                label="Popisek odkazu"
                :lang="activeLang"
                tag="infobar-link_label"
                @translate="translateField('linkLabel')"
              />
              <input
                v-model="form.linkLabel[activeLang]"
                type="text"
                placeholder="Např. Více informací"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                  Adresa odkazu
                  <HelpTip text="Jedna adresa pro všechny jazykové mutace — stejně jako u přidružených odkazů stránky. Může vést i mimo web." />
                </span>
                <span class="field-tag">infobar-link_url</span>
              </label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  v-model="form.linkUrl"
                  type="text"
                  placeholder="https://…"
                  class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 font-mono text-[12.5px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 border-t border-steel-100 pt-3">
              <AppSwitch
                v-model="form.newWindow"
                label="Otevřít v novém okně"
                hint="Vhodné u odkazů mimo web Dolních Vítkovic."
              />
              <span class="field-tag shrink-0">infobar-new_window</span>
            </div>
          </div>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <!-- Stav lišty -->
        <FormSection title="Stav na webu" icon="bell" tag="infobar-state">
          <div class="flex items-start gap-2.5">
            <span
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
              :class="[stateMeta.bg, stateMeta.text]"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="stateMeta.dot" />
              {{ stateMeta.label }}
            </span>
          </div>
          <p class="mt-2 text-[12px] leading-relaxed text-steel-500">{{ stateMeta.hint }}</p>
        </FormSection>

        <!-- Zapnutí, plánování, automatické skrytí a viditelnost po jazycích -->
        <PublishCard
          v-model:status="status"
          v-model:publish-from="showFrom"
          v-model:publish-to="hideAt"
          :langs="publishRows"
          updated-by="Jan Voznak"
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
