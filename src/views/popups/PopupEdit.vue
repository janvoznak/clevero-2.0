<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, RadioGroupRoot, RadioGroupItem } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import PopupPositionPicker from '@/components/admin/popup/PopupPositionPicker.vue'
import PopupSizePreview from '@/components/admin/popup/PopupSizePreview.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import { MOCK_POPUPS, popupState, POPUP_STATE_META } from '@/data/mockPopups'
import type { PopupItem } from '@/data/mockPopups'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_POPUPS.find((p) => p.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): PopupItem {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  return {
    id: 'nové',
    title: empty(),
    titleUrl: '',
    text: empty(),
    image: null,
    position: 'center',
    widthUnit: 'px',
    width: 420,
    widthPercent: 30,
    height: 300,
    from: null,
    to: null,
    enabled: true,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '',
  }
}

const form = reactive<PopupItem>(clone())
const activeLang = ref<LangCode>('cs')

/** Šířka svázaná s aktivní jednotkou (px / %). */
const widthValue = computed({
  get: () => (form.widthUnit === 'px' ? form.width : form.widthPercent),
  set: (v: number) => {
    if (form.widthUnit === 'px') form.width = v
    else form.widthPercent = v
  },
})

const state = computed(() => popupState(form))

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
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

/* ---------- AI překlad (prototyp — žádná reálná AI) ----------
   Přeloží ML pole (nadpis, text) ze zdrojové CZ do EN/DE/PL. */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const mlFields: (keyof PopupItem)[] = ['title', 'text']
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

        <!-- Jazykový přepínač (globální) — Reka Tabs, pilulky -->
        <TabsRoot
          :model-value="activeLang"
          class="hidden lg:block"
          @update:model-value="(v) => (activeLang = v as LangCode)"
        >
          <TabsList
            class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1"
            aria-label="Jazyková mutace"
          >
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>
              {{ l.code.toUpperCase() }}
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'"
                :title="langFilled(l.code) ? 'Vyplněno' : 'Prázdné'"
              />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit a zůstat' }}
        </AppButton>
        <AppButton variant="primary" @click="saveAndBack">
          <Icon name="check" :size="16" />
          Uložit a zpět
        </AppButton>
      </div>

      <!-- Jazykový přepínač (mobil / <lg) -->
      <div class="px-8 pb-3 lg:hidden">
        <TabsRoot :model-value="activeLang" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              {{ l.flag }} {{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: obsahové sekce (bez tabů — dle specifikace) -->
      <div class="min-w-0 space-y-5">
        <!-- Základní informace -->
        <FormSection title="Základní informace" icon="page" tag="popup">
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Název (nadpis) <span class="text-brand-500">*</span></span>
                <span class="field-tag">popup-title · {{ activeLang.toUpperCase() }}</span>
              </label>
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Nadpis pop-up okna"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
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

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Text</span>
                <span class="field-tag">popup-text · {{ activeLang.toUpperCase() }}</span>
              </label>
              <RichTextEditor v-model="form.text[activeLang]" />
            </div>
          </div>
        </FormSection>

        <!-- Obrázek -->
        <FormSection title="Obrázek" icon="image" tag="popup-image">
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
        </FormSection>

        <!-- Vzhled a umístění -->
        <FormSection title="Vzhled a umístění" icon="layout" tag="popup-position">
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

            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Šířka + přepínač jednotky -->
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Šířka okna <span class="text-brand-500">*</span></span>
                  <span class="field-tag">{{ form.widthUnit === 'px' ? 'popup-width' : 'popup-width_percent' }}</span>
                </label>
                <div class="flex items-stretch gap-2">
                  <input
                    v-model.number="widthValue"
                    type="number"
                    min="0"
                    class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                  />
                  <RadioGroupRoot
                    v-model="form.widthUnit"
                    class="inline-flex shrink-0 items-center rounded-md border border-steel-200 bg-steel-50 p-1"
                    aria-label="Jednotka šířky"
                  >
                    <RadioGroupItem
                      v-for="u in (['px', 'percent'] as const)"
                      :key="u"
                      :value="u"
                      class="rounded px-2.5 py-1 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=checked]:bg-white data-[state=checked]:text-graphite-900 data-[state=checked]:shadow-sm"
                    >
                      {{ u === 'px' ? 'px' : '%' }}
                    </RadioGroupItem>
                  </RadioGroupRoot>
                </div>
                <p class="mt-1 field-tag">tmp_value_or_percent</p>
              </div>

              <!-- Výška -->
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Výška okna (px) <span class="text-brand-500">*</span></span>
                  <span class="field-tag">popup-height</span>
                </label>
                <input
                  v-model.number="form.height"
                  type="number"
                  min="0"
                  class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Vizuální nastavení velikosti (resize) — obousměrně svázané s poli výše -->
            <div>
              <p class="mb-2 flex items-center gap-2 text-[12.5px] text-steel-500">
                Náhled velikosti okna
                <span class="field-tag">popup-width / popup-height</span>
              </p>
              <PopupSizePreview
                v-model:width="form.width"
                v-model:width-percent="form.widthPercent"
                v-model:height="form.height"
                :unit="form.widthUnit"
                :frame="form.popupFrame"
              />
            </div>

            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <AppSwitch v-model="form.popupFrame" label="Zobrazit rámeček pop-up okna" aria-label="Zobrazit rámeček pop-up okna" />
              <span class="field-tag">popup-popupFrame</span>
            </div>
          </div>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Zobrazování -->
        <FormSection title="Zobrazování" icon="calendar" tag="popup-from / popup-to">
          <div class="space-y-4">
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Aktuální stav</span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[POPUP_STATE_META[state].bg, POPUP_STATE_META[state].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="POPUP_STATE_META[state].dot" />
                {{ POPUP_STATE_META[state].label }}
              </span>
            </div>

            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.enabled" label="Zobrazovat" hint="Okno je aktivní" aria-label="Zobrazovat" />
              <span class="field-tag">popup-enabled</span>
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Od</span>
                <span class="field-tag">popup-from</span>
              </label>
              <input
                v-model="form.from"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Do</span>
                <span class="field-tag">popup-to</span>
              </label>
              <input
                v-model="form.to"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Platnost blokace (dny)</span>
                <span class="field-tag">popup-cookie_expiration</span>
              </label>
              <input
                v-model.number="form.cookieExpiration"
                type="number"
                min="0"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
              <p class="mt-1 text-[11.5px] leading-relaxed text-steel-500">
                Po zavření se okno návštěvníkovi znovu nezobrazí po tento počet dní.
              </p>
            </div>
          </div>
        </FormSection>

        <!-- Náhled na webu (prototyp — mrtvý odkaz) -->
        <FormSection title="Náhled" icon="eye">
          <a
            href="#"
            target="_blank"
            class="flex w-full items-center justify-center gap-2 rounded-md border border-steel-200 bg-white px-4 py-2.5 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 hover:text-graphite-900 focus-visible:ring-4 focus-visible:ring-brand-500/15"
            @click.prevent
          >
            <Icon name="eye" :size="16" /> Náhled na webu
          </a>
          <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">
            Otevře náhled pop-up okna na webu v novém okně.
          </p>
        </FormSection>

        <!-- Jazykové mutace -->
        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li
              v-for="l in LANGS"
              :key="l.code"
              class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors"
              :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'"
            >
              <button class="flex items-center gap-2.5 text-left" @click="activeLang = l.code">
                <span>{{ l.flag }}</span>
                <span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span>
              </button>
              <span
                class="inline-flex items-center gap-1.5 font-mono text-[10.5px]"
                :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ langFilled(l.code) ? 'vyplněno' : 'prázdné' }}
              </span>
            </li>
          </ul>

          <div class="mt-4 border-t border-steel-100 pt-4">
            <AppButton
              variant="primary"
              size="sm"
              class="w-full"
              :disabled="translating || !sourceReady"
              @click="translateAll"
            >
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL (nadpis a text) ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte český nadpis — z něj se překládá.</span>
            </p>
          </div>
        </FormSection>
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
