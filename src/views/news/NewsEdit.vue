<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import GalleryField from '@/components/admin/GalleryField.vue'
import AttachmentsManager from '@/components/admin/AttachmentsManager.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, defaultContentBlocks } from '@/data/types'
import type { LangCode, NewsItem, ML } from '@/data/types'
import { MOCK_NEWS, publishState, PREDEFINED_TAGS, PREDEFINED_CATEGORIES } from '@/data/mockNews'
import { consumeNewsDraft, newsDraftFromText, type NewsDraft } from '@/data/aiAssistant'
import DovikChoiceTiles from '@/components/admin/DovikChoiceTiles.vue'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import { tourOptionsList } from '@/data/mockTours'
import { PLACE_OPTIONS, areaPlace } from '@/data/mockVenues'
import DovikSocialPost from '@/components/admin/DovikSocialPost.vue'

const tourItems = tourOptionsList()

/** Výběr objektu v Areálu (stejně jako u akce; u novinky nepovinný).
    Reka Select nepovolí prázdnou hodnotu → sentinel + proxy na ''. */
const AREA_NONE = '__none__'
const areaOptions = [{ value: AREA_NONE, label: '— nepropojeno' }, ...PLACE_OPTIONS]

const props = defineProps<{ id?: string }>()
const router = useRouter()

/* Proklik na objekt v Areálu z výběru (nový panel — zachová práci).
   Objekty se zakládají v modulu Areál, ne odsud. */
function openPlace() {
  if (!form.areaId) return
  window.open(router.resolve({ name: 'area-edit', params: { id: form.areaId } }).href, '_blank')
}

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_NEWS.find((n) => n.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): NewsItem {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as NewsItem
    c.galleryIds = c.galleryIds ?? []
    c.slug = c.slug ?? empty()
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  return {
    id: 'nová',
    author: 'Jan Voznak',
    title: empty(),
    slug: empty(),
    // Nová aktualita: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
    contentBlocks: defaultContentBlocks(),
    summary: empty(),
    text: empty(),
    videoLink: '',
    dateFrom: null,
    dateTo: null,
    metaTitle: empty(),
    metaDescription: empty(),
    metaKeywords: empty(),
    ogImage: null,
    gallery: [],
    attachments: [],
    tags: [],
    categories: [],
    areaId: '',
    tourIds: [],
    galleryIds: [],
  }
}

const form = reactive<NewsItem>(clone())

/* Aplikace konceptu od DOVíka (jen CS — cizí mutace se doplní přes AI překlad). */
function applyDraft(draft: NewsDraft) {
  form.title.cs = draft.title
  form.summary.cs = draft.summary
  form.text.cs = draft.text
  if (draft.tags.length) form.tags = [...draft.tags]
  if (draft.categories.length) form.categories = [...draft.categories]
  if (draft.dateFrom) form.dateFrom = draft.dateFrom
}

/* Handoff z plovoucího DOVíka (chat → editor): pokud přinesl koncept, rovnou vyplní. */
const chatDraft = isEdit.value ? null : consumeNewsDraft()
if (chatDraft) applyDraft(chatDraft)

/* Nová aktualita bez konceptu z chatu → nejdřív nabídneme volbu (dvě dlaždice). */
const showChooser = ref(!isEdit.value && !chatDraft)

/* Dlaždice „Založit zrychleně s DOVíkem" — z tématu sestaví koncept (fake engine). */
const dovikTopic = ref('')
const dovikBusy = ref(false)
function dovikCreate() {
  if (!dovikTopic.value.trim() || dovikBusy.value) return
  dovikBusy.value = true
  window.setTimeout(() => {
    applyDraft(newsDraftFromText(dovikTopic.value))
    dovikBusy.value = false
    showChooser.value = false
  }, 900)
}

const activeLang = ref<LangCode>('cs')
const areaModel = computed({
  get: () => form.areaId || AREA_NONE,
  set: (v: string) => (form.areaId = v === AREA_NONE ? '' : v),
})

/** Sekce detailu jako záložky (jiná vizuální rovina než jazykové mutace). */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'news' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'relations', label: 'Zařazení a vazby', icon: 'layers' },
  { value: 'gallery', label: 'Fotogalerie', icon: 'gallery' },
  { value: 'attachments', label: 'Přílohy', icon: 'paperclip' },
  { value: 'promo', label: 'Propagace', icon: 'share' },
]

/** Indikátor vyplněnosti jazyka (podle nadpisu). */
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Časové okno (PublishCard níže) řídí, KDY je aktualita živá; tyto přepínače
   řídí, KTERÉ mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/** Živý náhled stavu publikace z časového okna. */
const state = computed(() => publishState(form))

/* Publikace řešíme jen v pravém panelu (PublishCard) — napojení na okno OD–DO. */
const publishFromModel = computed({
  get: () => form.dateFrom ?? '',
  set: (v: string) => (form.dateFrom = v || null),
})
const publishToModel = computed({
  get: () => form.dateTo ?? '',
  set: (v: string) => (form.dateTo = v || null),
})
const cardStatus = computed<'draft' | 'published' | 'scheduled'>(() =>
  state.value === 'scheduled' ? 'scheduled' : state.value === 'active' ? 'published' : 'draft',
)

/** URL slug se generuje automaticky z nadpisu (dokud ho klient neupraví ručně).
    Titulek a meta pro vyhledávače se odvozují automaticky. */
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = empty()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(() => form.title, () => (form.slug ??= empty()))

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'news-list' })
}
function onDuplicate() {
  router.push({ name: 'news-new' })
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof NewsItem)[] = ['title', 'summary']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

/* Propagace na FB — banner/text z aktuality (obrázek = OG nebo hlavní fotka). */
const promoPlace = computed(() => (form.areaId ? areaPlace(form.areaId) : undefined))
const promoImage = computed(() => form.ogImage || form.gallery.find((g) => g.isMain)?.src || form.gallery[0]?.src || '')
function fmtPromoDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''
}
const promoDate = computed(() => {
  if (!form.dateFrom) return ''
  const f = fmtPromoDate(form.dateFrom)
  return !form.dateTo || form.dateTo === form.dateFrom ? f : `${f} – ${fmtPromoDate(form.dateTo)}`
})
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'news-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/news/${form.id}/edit` : '/admin/news/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová aktualita' }}
          </h1>
        </div>

        <!-- Akce hlavičky jen v editoru (ne během výběru způsobu založení) -->
        <template v-if="!showChooser">
          <!-- Jazykové mutace — jediné místo (horní lišta), ✨ = AI překlad mutace -->
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
            entity="aktualitu"
            :is-edit="isEdit"
            :saved="saved"
            @save="save"
            @save-back="saveBack"
            @duplicate="onDuplicate"
            @delete="router.push({ name: 'news-list' })"
          />
        </template>
      </div>

      <!-- Jazykové mutace (mobil / <lg) -->
      <div v-if="!showChooser" class="px-8 pb-3 lg:hidden">
        <LangBar v-model="activeLang" :filled="filledLangs" :published="liveLangs" :translating="translating" @translate="translateLang" />
      </div>
    </div>

    <!-- Gate: dvě dlaždice (jen nová aktualita bez konceptu z chatu) -->
    <div v-if="showChooser" class="mx-auto max-w-[780px] px-6 py-10">
      <DovikChoiceTiles
        title="Jak aktualitu založíme?"
        subtitle="Vyberte způsob — zrychleně s DOVíkem z tématu, nebo ručně."
        dovik-hint="DOVík připraví koncept z tématu."
        dovik-lead="Napište, o čem aktualita je, a DOVík navrhne nadpis, perex, text i štítky. Vše pak upravíte a dopřeložíte."
        manual-hint="Bez DOVíka, prázdný formulář."
        manual-lead="Vyplňte aktualitu sami od začátku — nadpis, perex, obsah, štítky i publikaci."
        note="DOVík termín nevyplňuje — doplňte ho prosím sami. Cizí jazyky pak dopřeložíte jedním tlačítkem."
        @manual="showChooser = false"
      >
        <template #dovik>
          <div class="space-y-2">
            <textarea
              v-model="dovikTopic"
              rows="3"
              placeholder="Např. blíží se festival Colours of Ostrava 2027"
              class="w-full resize-y rounded-md border border-steel-200 bg-white px-3 py-2 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
            <AppButton variant="primary" class="w-full" :disabled="!dovikTopic.trim() || dovikBusy" @click="dovikCreate">
              <Icon name="sparkles" :size="16" :class="dovikBusy && 'animate-pulse'" />
              {{ dovikBusy ? 'DOVík připravuje…' : 'Připravit s DOVíkem' }}
            </AppButton>
          </div>
        </template>
      </DovikChoiceTiles>
    </div>

    <!-- Two-column body -->
    <div v-else class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: obsah v záložkách sekcí (Reka Tabs, podtržený styl) -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList
              class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2"
              aria-label="Sekce aktuality"
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
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Nadpis, perex a text existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
            <div>
              <MlFieldHeader label="Nadpis" :lang="activeLang" tag="news-title" required @translate="translateField('title')" />
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Hlavní nadpis aktuality"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <SlugField
              v-model="slugText"
              :tag="`news-url · ${activeLang.toUpperCase()}`"
              @edit="markManual(activeLang)"
            />

            <div>
              <MlFieldHeader label="Shrnutí / PEREX" :lang="activeLang" tag="news-summary" @translate="translateField('summary')" />
              <textarea
                v-model="form.summary[activeLang]"
                rows="2"
                placeholder="Krátký úvodní výtah zobrazený v seznamu a náhledech"
                class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Odkaz na video</span>
                <span class="field-tag">news-videoLink</span>
              </label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  v-model="form.videoLink"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

                </div>
              </TabsContent>

              <!-- Sekce: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Sekce: Zařazení a vazby -->
              <TabsContent value="relations" class="space-y-4 outline-none">
                <FormSection title="Objekt v areálu" icon="map" hint="Ke kterému objektu aktualita patří — na webu se propojí s jeho detailem." tag="news-area_id">
                  <AppSelect v-model="areaModel" :options="areaOptions" />
                  <button
                    v-if="form.areaId"
                    type="button"
                    class="mt-2 inline-flex items-center gap-1 text-[12px] font-600 text-brand-600 transition-colors hover:text-brand-700"
                    @click="openPlace"
                  >
                    <Icon name="externalLink" :size="13" /> Otevřít objekt
                  </button>
                </FormSection>

                <FormSection title="Kategorie" icon="filter" hint="Obsahové zařazení pro filtrování aktualit na webu." tag="news-categories">
                  <TagPicker v-model="form.categories" :options="PREDEFINED_CATEGORIES" add-label="Přidat kategorii" empty-label="Zatím žádné kategorie." color-label="Barva kategorie" />
                </FormSection>

                <FormSection title="Související prohlídky" icon="ticket" hint="Prohlídky, na které aktualita na webu odkazuje." tag="news-tours">
                  <RelationPicker v-model="form.tourIds" :items="tourItems" add-label="Přidat prohlídku" empty-label="Zatím žádné prohlídky." search-placeholder="Hledat prohlídku…" icon="ticket" item-route-name="tour-edit" create-route-name="tour-new" create-label="Založit novou prohlídku" />
                </FormSection>
              </TabsContent>

              <!-- Sekce: Fotogalerie -->
              <TabsContent value="gallery" class="outline-none">
                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.gallery"
                  link-tag="news-gallery_ids"
                  photos-tag="news-gallery"
                />
              </TabsContent>

              <!-- Sekce: Přílohy -->
              <TabsContent value="attachments" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Přílohy mohou být specifické pro jednotlivé jazykové mutace.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news-attachments · ML</span>
                </p>
                <AttachmentsManager v-model="form.attachments" :lang="activeLang" />
              </TabsContent>

              <!-- Sekce: Propagace (DOVík → FB koncept) -->
              <TabsContent value="promo" class="outline-none">
                <DovikSocialPost
                  :title="form.title.cs"
                  :date-label="promoDate"
                  :place-label="promoPlace?.title.cs ?? ''"
                  :place-color="promoPlace?.color"
                  :image="promoImage"
                  :summary="form.summary.cs"
                  :tags="form.tags"
                />
              </TabsContent>

            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail: publikace + přehled -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <PublishCard
          :initial-status="cardStatus"
          v-model:publish-from="publishFromModel"
          v-model:publish-to="publishToModel"
          :langs="publishRows"
          updated-by="Jana Svobodová"
          @toggle-lang="onToggleLang"
        />

        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="news-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_TAGS" />
        </FormSection>
      </aside>
    </div>

    <!-- Toast (potvrzení AI akce) -->
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
