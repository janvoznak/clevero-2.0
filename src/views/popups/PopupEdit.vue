<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import PopupPositionPicker from '@/components/admin/popup/PopupPositionPicker.vue'
import PopupSizePreview from '@/components/admin/popup/PopupSizePreview.vue'
import PopupTemplateBar from '@/components/admin/popup/PopupTemplateBar.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import EditorVersionSwitch from '@/components/admin/popup/EditorVersionSwitch.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import { MOCK_POPUPS, popupState, PREDEFINED_TEMPLATES } from '@/data/mockPopups'
import type { PopupItem, PopupTemplate } from '@/data/mockPopups'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_POPUPS.find((p) => p.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): PopupItem {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as PopupItem
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  return {
    id: 'nové',
    title: empty(),
    titleUrl: '',
    text: empty(),
    image: null,
    position: 'center',
    widthPercent: 30,
    from: null,
    to: null,
    enabled: true,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '',
    // Nové okno: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
  }
}

const form = reactive<PopupItem>(clone())
const activeLang = ref<LangCode>('cs')

/** Sekce detailu jako záložky (jiná vizuální rovina než jazykové mutace). */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'image', label: 'Obrázek', icon: 'image' },
  { value: 'appearance', label: 'Vzhled a umístění', icon: 'layout' },
  { value: 'schedule', label: 'Zobrazování', icon: 'calendar' },
]

const state = computed(() => popupState(form))

/* Publikace/plánování řešíme jen v pravém panelu (PublishCard) — okno od–do. */
const publishFromModel = computed({
  get: () => form.from ?? '',
  set: (v: string) => (form.from = v || null),
})
const publishToModel = computed({
  get: () => form.to ?? '',
  set: (v: string) => (form.to = v || null),
})
const cardStatus = computed<'draft' | 'published' | 'scheduled'>(() =>
  state.value === 'scheduled' ? 'scheduled' : state.value === 'active' ? 'published' : 'draft',
)

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Časové okno (PublishCard) řídí, KDY se okno zobrazuje; tyto přepínače
   řídí, KTERÉ mutace se na webu ukážou. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/* ---------- Ukládání (prototyp — jen lokální stav) ---------- */
const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveAndBack() {
  router.push({ name: 'popups-list' })
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof PopupItem)[] = ['title', 'text']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

/* ---------- Předdefinované šablony (prototyp — předvyplňovač) ----------
   Prázdný formulář = aplikuje rovnou; rozepsaný obsah = potvrzení přepsání. */
const pendingTemplate = ref<PopupTemplate | null>(null)
const isDirty = computed(() =>
  LANGS.some((l) => form.title[l.code].trim() !== '' || form.text[l.code].trim() !== ''),
)
function chooseTemplate(tpl: PopupTemplate) {
  if (isDirty.value) pendingTemplate.value = tpl
  else applyTemplate(tpl)
}
function applyTemplate(tpl: PopupTemplate) {
  const a = tpl.apply
  form.title[SOURCE_LANG] = a.title
  form.text[SOURCE_LANG] = a.text
  if (a.titleUrl !== undefined) form.titleUrl = a.titleUrl
  if (a.position) form.position = a.position
  if (a.widthPercent !== undefined) form.widthPercent = a.widthPercent
  if (a.newWindow !== undefined) form.newWindow = a.newWindow
  if (a.popupFrame !== undefined) form.popupFrame = a.popupFrame
  if (a.cookieExpiration !== undefined) form.cookieExpiration = a.cookieExpiration
  activeLang.value = SOURCE_LANG
  pendingTemplate.value = null
  toast.value = `Použita šablona „${tpl.name}"`
  window.setTimeout(() => (toast.value = ''), 3000)
}

</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          aria-label="Zpět"
          @click="router.push({ name: 'popups-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">popup</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/popups/${form.id}/edit` : '/admin/popups/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nové pop-up okno' }}
          </h1>
        </div>

        <EditorVersionSwitch :id="props.id" class="hidden md:inline-flex" />

        <!-- Jazykové mutace (globální) — jediné místo, ✨ = AI překlad mutace -->
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
          :name="form.title.cs"
          entity="pop-up okno"
          @delete="router.push({ name: 'popups-list' })"
        />
        <AppButton variant="secondary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit a zůstat' }}
        </AppButton>
        <AppButton variant="primary" @click="saveAndBack">
          <Icon name="check" :size="16" />
          Uložit a zpět
        </AppButton>
      </div>

      <!-- Jazykové mutace (mobil / <lg) -->
      <div class="px-8 pb-3 lg:hidden">
        <LangBar v-model="activeLang" :filled="filledLangs" :published="liveLangs" :translating="translating" @translate="translateLang" />
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: obsahové sekce v záložkách (Reka Tabs, podtržený styl) -->
      <div class="min-w-0">
        <!-- Předvyplnění ze šablony (preset — jen předvyplní pole níže) -->
        <div class="mb-5"><PopupTemplateBar :templates="PREDEFINED_TEMPLATES" @select="chooseTemplate" /></div>

        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList
              class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2"
              aria-label="Sekce pop-upu"
            >
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="basic" class="outline-none">
                <div class="space-y-4">
            <div>
              <MlFieldHeader label="Název (nadpis)" :lang="activeLang" tag="popup-title" required @translate="translateField('title')" />
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Nadpis pop-up okna"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <MlFieldHeader label="Text" :lang="activeLang" tag="popup-text" @translate="translateField('text')" />
              <RichTextEditor v-model="form.text[activeLang]" />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Cíl odkazu</span>
                <span class="field-tag">popup-title_url</span>
              </label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  v-model="form.titleUrl"
                  type="text"
                  placeholder="/aktuality/… nebo https://…"
                  class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div class="mt-2">
                <AppSwitch v-model="form.newWindow" label="Otevřít odkaz v novém okně" aria-label="Otevřít odkaz v novém okně" />
                <span class="field-tag ml-1">popup-new_window</span>
              </div>
            </div>
                </div>
              </TabsContent>

              <!-- Sekce: Obrázek -->
              <TabsContent value="image" class="outline-none">
                <p class="mb-3 text-[12.5px] text-steel-500">Obrázek zobrazený v pop-up okně. Není jazykově specifický.</p>
                <div class="flex items-center gap-4">
            <span class="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-md border border-steel-200 bg-steel-100 text-steel-400">
              <img v-if="form.image" :src="form.image" alt="Náhled obrázku" class="h-full w-full object-cover" />
              <Icon v-else name="image" :size="24" />
            </span>
            <div class="space-y-2">
              <!-- prototyp — nahrávání je mockované, bez reálného uploadu -->
              <AppButton variant="secondary" size="sm">
                <Icon name="upload" :size="15" /> Nahrát obrázek
              </AppButton>
              <button
                v-if="form.image"
                class="block text-[12px] font-500 text-danger-500 hover:text-danger-600"
                @click="form.image = null"
              >
                Odebrat obrázek
              </button>
              <p class="text-[11px] text-steel-400">Doporučeno max. 1200 px na šířku.</p>
            </div>
                </div>
              </TabsContent>

              <!-- Sekce: Vzhled a umístění -->
              <TabsContent value="appearance" class="outline-none">
                <div class="space-y-5">
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Umístění na obrazovce <span class="text-brand-500">*</span></span>
                <span class="field-tag">popup-position</span>
              </label>
              <div class="max-w-sm">
                <PopupPositionPicker v-model="form.position" />
              </div>
            </div>

            <!-- Šířka okna (responzivně, v % obrazovky) — výška se řídí obsahem -->
            <div>
              <p class="mb-2 flex items-center gap-2 text-[12.5px] text-steel-500">
                Šířka okna
                <span class="field-tag">popup-width_percent</span>
              </p>
              <PopupSizePreview v-model:width-percent="form.widthPercent" :frame="form.popupFrame" />
            </div>

            <div class="max-w-xs">
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Šířka okna (% obrazovky) <span class="text-brand-500">*</span></span>
                <span class="field-tag">popup-width_percent</span>
              </label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="form.widthPercent"
                  type="range"
                  min="12"
                  max="100"
                  step="1"
                  class="h-2 flex-1 cursor-pointer accent-brand-500"
                  aria-label="Šířka okna v procentech obrazovky"
                />
                <div class="flex h-10 w-20 items-center rounded-md border border-steel-200 px-2">
                  <input
                    v-model.number="form.widthPercent"
                    type="number"
                    min="12"
                    max="100"
                    class="w-full text-right text-[13.5px] text-graphite-800 focus:outline-none"
                  />
                  <span class="pl-1 text-[13px] text-steel-400">%</span>
                </div>
              </div>
              <p class="mt-1 text-[11.5px] leading-relaxed text-steel-500">
                Na mobilu se okno vždy přizpůsobí šířce displeje; výška roste podle obsahu.
              </p>
            </div>

            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <AppSwitch v-model="form.popupFrame" label="Zobrazit rámeček pop-up okna" aria-label="Zobrazit rámeček pop-up okna" />
              <span class="field-tag">popup-popupFrame</span>
            </div>
                </div>
              </TabsContent>

              <!-- Chování a náhled (publikaci a plánování řeší pravý panel) -->
              <TabsContent value="schedule" class="space-y-5 outline-none">
                <FormSection title="Chování a náhled" icon="settings" tag="popup-behavior">
                  <div class="space-y-4">
                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Platnost blokace (dny)</span>
                        <span class="field-tag">popup-cookie_expiration</span>
                      </label>
                      <input v-model.number="form.cookieExpiration" type="number" min="0" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                      <p class="mt-1 text-[11.5px] leading-relaxed text-steel-500">Po zavření se okno návštěvníkovi znovu nezobrazí po tento počet dní.</p>
                    </div>
                    <a href="#" target="_blank" class="inline-flex items-center justify-center gap-2 rounded-md border border-steel-200 bg-white px-4 py-2.5 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 hover:text-graphite-900" @click.prevent>
                      <Icon name="eye" :size="16" /> Náhled na webu
                    </a>
                  </div>
                </FormSection>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <PublishCard
          :initial-status="cardStatus"
          v-model:publish-from="publishFromModel"
          v-model:publish-to="publishToModel"
          :langs="publishRows"
          updated-by="Jan Voznak"
          @toggle-lang="onToggleLang"
        />

      </aside>
    </div>

    <!-- Potvrzení přepsání obsahu šablonou -->
    <DialogRoot :open="!!pendingTemplate" @update:open="(v) => !v && (pendingTemplate = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
        >
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
            <Icon name="layout" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Přepsat obsah šablonou?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Máte rozepsaný obsah, který bude nahrazen šablonou
            <span class="font-600 text-graphite-800">„{{ pendingTemplate?.name }}"</span>. Předvyplní se
            zdrojová čeština a doporučené nastavení; cizí mutace pak doplňte přes AI překlad.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="pendingTemplate = null">Zrušit</AppButton>
            <AppButton variant="primary" @click="pendingTemplate && applyTemplate(pendingTemplate)">Přepsat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Toast -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"
      >
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
