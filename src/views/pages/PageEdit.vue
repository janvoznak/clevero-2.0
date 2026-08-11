<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import GalleryField from '@/components/admin/GalleryField.vue'
import AttachmentsManager from '@/components/admin/AttachmentsManager.vue'
import OpeningHoursEditor from '@/components/admin/OpeningHoursEditor.vue'
import PageFormBuilder from '@/components/admin/PageFormBuilder.vue'
import PageGroupBar from '@/components/admin/PageGroupBar.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import { LANGS, defaultContentBlocks } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PAGES,
  PAGE_SECTIONS,
  slugPath,
  parentOptions,
  hasChildren,
  createChildPage,
  persistNewPage,
  addAssociatedLink,
  defaultOpeningHours,
  FORM_TEMPLATES,
} from '@/data/mockPages'
import type { PageItem } from '@/data/mockPages'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_PAGES.find((p) => p.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): PageItem {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as PageItem
    c.galleryIds = c.galleryIds ?? []
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  const parentId = typeof route.query.parent === 'string' ? route.query.parent : null
  const parent = parentId ? MOCK_PAGES.find((p) => p.id === parentId) : null
  const qs = route.query.section
  const sectionFromQuery = qs === 'menu' || qs === 'other' || qs === 'client' ? qs : null
  return {
    id: 'nová',
    section: parent?.section ?? sectionFromQuery ?? 'menu',
    parentId,
    title: empty(),
    slug: empty(),
    perex: empty(),
    text: empty(),
    contentBlocks: defaultContentBlocks(),
    associatedLinks: [],
    allowMenu: false,
    allowFooter: '0',
    allowHp: false,
    priority: 0,
    enabled: true,
    // Nová stránka: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
    formTemplateId: '',
    dynamicFormId: '',
    inquiryFormType: 'none',
    contactForm: 'none',
    contactFormText: empty(),
    metaTitle: empty(),
    metaDescription: empty(),
    metaKeywords: empty(),
    canonicalUrl: empty(),
    allowIndexing: true,
    gallery: [],
    galleryIds: [],
    attachments: [],
    jsCodes: '',
    usedCookies: [],
    openingHours: defaultOpeningHours(),
    showOpeningHours: true,
  }
}

const form = reactive<PageItem>(clone())
const activeLang = ref<LangCode>('cs')
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'settings', label: 'Nastavení a vztahy', icon: 'settings' },
  { value: 'forms', label: 'Formuláře', icon: 'reference' },
  { value: 'media', label: 'Obrázky & Přílohy', icon: 'gallery' },
]

/* ---------- Proxy pro typované selecty ---------- */
const parentValue = computed({
  get: () => form.parentId ?? '',
  set: (v: string) => (form.parentId = v || null),
})
/** Nadřazená stránka jen z téže sekce, do které stránka patří. */
const parentOpts = computed(() =>
  parentOptions(
    MOCK_PAGES.filter((p) => p.section === form.section),
    props.id,
  ),
)
const sectionLabel = computed(() => PAGE_SECTIONS.find((s) => s.key === form.section)?.label ?? '')
/** Stránka s podstránkami je nadřazená → musí zůstat na kořenové úrovni. */
const isParent = computed(() => isEdit.value && hasChildren(MOCK_PAGES, form.id))

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Přepínač „Zobrazit na webu" (PublishCard) řídí, ZDA je stránka živá; tyto
   přepínače řídí, KTERÉ jazykové mutace se na webu zobrazí. Prázdnou mutaci
   nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/* Hierarchická URL náhled (dle rodiče z mock stromu + vlastní slug). */
const urlPreview = computed(() => {
  const slug = form.slug[activeLang.value] || form.slug.cs || 'slug'
  if (!form.parentId) return '/' + slug
  const parent = MOCK_PAGES.find((p) => p.id === form.parentId)
  return parent ? `${slugPath(MOCK_PAGES, parent)}/${slug}` : '/' + slug
})

/* ---------- URL slug (prototyp) — automaticky z nadpisu, dokud ho klient
   neupraví ručně. Titulek a meta se odvozují automaticky. ---------- */
const { markManual } = useAutoSlug(() => form.title, () => form.slug)

/* ---------- Přepínání mezi přidruženými stránkami ---------- */
function goPage(id: string) {
  router.push({ name: 'page-edit', params: { id } })
}
/* Přidání podstránky/odkazu na dosud neuložené stránce → nejdřív ji založíme. */
function onAddChildNew() {
  const parent = persistNewPage(MOCK_PAGES, form)
  form.id = parent.id
  const child = createChildPage(MOCK_PAGES, parent.id)
  goPage(child.id)
}
function onAddLinkNew(payload: { label: ML; url: string }) {
  const parent = persistNewPage(MOCK_PAGES, form)
  form.id = parent.id
  addAssociatedLink(parent, payload.label, payload.url)
  goPage(parent.id)
}
/* Router recykluje instanci komponenty — při změně id načteme stránku znovu. */
watch(
  () => props.id,
  () => {
    Object.assign(form, clone())
    activeSection.value = 'basic'
    activeLang.value = 'cs'
  },
)

/* ---------- Uložení (prototyp) ---------- */
const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveAndClose() {
  router.push({ name: 'pages-list' })
}
function onDuplicate() {
  router.push({ name: 'page-new' })
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof PageItem)[] = ['title', 'perex', 'text', 'contactFormText']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          aria-label="Zpět"
          @click="router.push({ name: 'pages-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/page/edit/${form.id}` : '/admin/page/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová stránka' }}
          </h1>
        </div>

        <!-- Jazykové mutace (jediné místo, ✨ = AI překlad mutace) -->
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
          entity="stránku"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveAndClose"
          @duplicate="onDuplicate"
          @delete="router.push({ name: 'pages-list' })"
        />
      </div>

      <!-- Jazykové mutace (mobil) -->
      <div class="px-8 pb-3 lg:hidden">
        <LangBar v-model="activeLang" :filled="filledLangs" :published="liveLangs" :translating="translating" @translate="translateLang" />
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: sekce v podtržených tabech -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce stránky">
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
              <!-- TAB 1: Základní informace -->
              <TabsContent value="basic" class="space-y-4 outline-none">
                <p class="mb-1 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Nadpis, perex a text existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div>
                  <MlFieldHeader label="Nadpis" :lang="activeLang" tag="page-title" required @translate="translateField('title')" />
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Hlavní nadpis stránky (H1)"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <SlugField
                  v-model="form.slug[activeLang]"
                  :tag="`page-url · ${activeLang.toUpperCase()}`"
                  @edit="markManual(activeLang)"
                />
                <div>
                  <MlFieldHeader label="Perex" :lang="activeLang" tag="page-perex" @translate="translateField('perex')" />
                  <textarea
                    v-model="form.perex[activeLang]"
                    rows="2"
                    placeholder="Krátký úvodní text stránky"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </TabsContent>

              <!-- TAB: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- TAB: Nastavení a vztahy (dříve v pravém railu) -->
              <TabsContent value="settings" class="space-y-5 outline-none">
                <!-- Přidružené stránky (podstránky + externí odkazy) -->
                <PageGroupBar
                  :key="form.id"
                  :current-id="form.id"
                  :lang="activeLang"
                  @navigate="goPage"
                  @add-child-new="onAddChildNew"
                  @add-link-new="onAddLinkNew"
                />

                <!-- Zařazení -->
                <FormSection title="Zařazení" icon="layers" tag="page-entityParentId">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Nadřazená stránka</span>
                      <span class="field-tag">page-entityParentId</span>
                    </label>
                    <AppSelect v-model="parentValue" :options="parentOpts" :disabled="isParent" />
                    <p v-if="isParent" class="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-steel-500">
                      <Icon name="reference" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                      Tato stránka má podstránky, je tedy nadřazená a zůstává na kořenové úrovni.
                    </p>
                    <p v-else class="mt-1 text-[11px] text-steel-400">
                      Na výběr jsou pouze stránky ze sekce <span class="font-600 text-steel-500">{{ sectionLabel }}</span>.
                    </p>
                  </div>
                  <p class="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="grip" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                    Pořadí a zanoření stránky nastavíte přetažením přímo v seznamu stránek.
                  </p>
                </FormSection>

                <!-- Adresa a náhled (publikaci řeší pravý panel) -->
                <FormSection title="Adresa a náhled" icon="globe" tag="page-url">
                  <div class="space-y-3">
                    <div class="rounded-md border border-steel-200 px-3 py-2.5">
                      <p class="mb-0.5 field-tag">Adresa na webu</p>
                      <p class="break-all font-mono text-[11.5px] text-graphite-700">/cs{{ urlPreview }}</p>
                    </div>
                    <a href="#" target="_blank" class="inline-flex items-center justify-center gap-2 rounded-md border border-steel-200 bg-white px-4 py-2 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 hover:text-graphite-900" @click.prevent>
                      <Icon name="eye" :size="16" /> Náhled na webu
                    </a>
                  </div>
                </FormSection>

                <!-- Otevírací doba -->
                <FormSection title="Otevírací doba" icon="clock" tag="page-openingHours">
                  <div class="rounded-md border border-steel-200 bg-steel-50/60 px-3 py-2.5">
                    <AppSwitch
                      v-model="form.showOpeningHours"
                      label="Zobrazit na webu"
                      hint="Některé stránky otevírací dobu nepotřebují — vypnutím se skryje."
                      aria-label="Zobrazit otevírací dobu na webu"
                    />
                  </div>
                  <template v-if="form.showOpeningHours">
                    <p class="mb-3 mt-4 text-[12.5px] text-steel-500">Nastavte hodiny pro jednotlivé dny, nebo den označte jako zavřený.</p>
                    <OpeningHoursEditor v-model="form.openingHours" />
                  </template>
                </FormSection>
              </TabsContent>

              <!-- TAB 2: Formuláře -->
              <TabsContent value="forms" class="space-y-4 outline-none">
                <PageFormBuilder v-model="form.formTemplateId" :templates="FORM_TEMPLATES" />

                <div class="border-t border-steel-100 pt-4">
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Text u formuláře</span>
                    <span class="field-tag">page-contactFormText · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <textarea
                    v-model="form.contactFormText[activeLang]"
                    rows="3"
                    placeholder="Úvodní text zobrazený nad formulářem"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </TabsContent>


              <!-- TAB 4: Obrázky & Přílohy -->
              <TabsContent value="media" class="space-y-6 outline-none">
                <div>
                  <GalleryField
                    v-model:galleries="form.galleryIds"
                    v-model:photos="form.gallery"
                    link-tag="page-gallery_ids"
                    photos-tag="page-images"
                  />
                </div>
                <div>
                  <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                    Přílohy ke stažení — rozlišené dle jazyka.
                    <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page-attachments · ML</span>
                  </p>
                  <AttachmentsManager v-model="form.attachments" :lang="activeLang" />
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <PublishCard
          :published="form.enabled"
          :langs="publishRows"
          updated-by="Jan Voznak"
          @toggle-lang="onToggleLang"
        />
      </aside>
    </div>

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
