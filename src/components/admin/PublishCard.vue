<script setup lang="ts">
/**
 * Sdílená karta „Publikace" pro pravý rail detailů napříč moduly
 * (princip 0b: jeden prvek = jedna komponenta). Jediné místo pro publikaci:
 * - Stav: Koncept / Publikováno / Naplánováno.
 * - Naplánování: „Zveřejnit v" (datum a čas automatického zveřejnění).
 * - Omezení zobrazení: „Zobrazovat do" (prázdné = neomezeně).
 * - Metadata: vytvořeno, naposledy upraveno + kým.
 *
 * Datumová pole jsou volitelné v-modely (`publishFrom`, `publishTo`): moduly
 * s reálným časovým oknem je napojí (v-model:publish-from/publish-to), ostatní
 * je nechají neřízené a karta si drží vlastní lokální stav (vizuální prototyp).
 */
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import LangFlag from '@/components/admin/LangFlag.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import type { LangCode } from '@/data/types'

type Status = 'draft' | 'published' | 'scheduled'

/** Řádek matice „Mutace na webu" — jedna jazyková mutace a její stav publikace. */
export interface PublishLangRow {
  code: LangCode
  label: string
  flag: string
  state: 'live' | 'ready' | 'empty'
}

const props = withDefaults(
  defineProps<{
    published?: boolean
    /** Výchozí stav karty (má přednost před `published`). */
    initialStatus?: Status
    created?: string
    updated?: string
    updatedBy?: string
    /** Volitelné: publikování per jazyk. Když je předáno, zobrazí se matice
        „Mutace na webu" (přepínač u každé mutace). Prázdnou nelze zapnout. */
    langs?: PublishLangRow[]
  }>(),
  {
    published: true,
    initialStatus: undefined,
    created: '4. 8. 2025 · 14:00',
    updated: 'dnes · 9:14',
    updatedBy: 'Jan Voznak',
    langs: undefined,
  },
)

defineEmits<{ 'toggle-lang': [LangCode] }>()

const LANG_STATE_META: Record<PublishLangRow['state'], { label: string; dot: string }> = {
  live: { label: 'Zveřejněno', dot: 'bg-forge-500' },
  ready: { label: 'Skryté', dot: 'bg-amber-500' },
  empty: { label: 'Prázdné', dot: 'bg-steel-300' },
}

/** Datum zveřejnění (naplánování) a konec zobrazení — datetime-local. */
const publishFrom = defineModel<string>('publishFrom', { default: '' })
const publishTo = defineModel<string>('publishTo', { default: '' })

const STATES: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Koncept' },
  { value: 'published', label: 'Publikováno' },
  { value: 'scheduled', label: 'Naplánováno' },
]
const status = ref<Status>(props.initialStatus ?? (props.published ? 'published' : 'draft'))
</script>

<template>
  <FormSection title="Publikace" icon="eye" tag="record-publish">
    <!-- Stav publikace + plánování -->
    <div class="mb-4">
      <div class="flex gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
        <button
          v-for="s in STATES"
          :key="s.value"
          type="button"
          class="flex-1 rounded-md px-2 py-1.5 text-[12px] font-600 outline-none transition-colors"
          :class="status === s.value ? 'bg-white text-graphite-900 shadow-sm' : 'text-steel-500 hover:text-graphite-800'"
          @click="status = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Naplánování zveřejnění -->
      <div v-if="status === 'scheduled'" class="mt-3">
        <label class="mb-1.5 flex items-center justify-between">
          <span class="text-[12.5px] font-600 text-graphite-800">Zveřejnit v</span>
          <span class="field-tag">publish-at</span>
        </label>
        <input
          v-model="publishFrom"
          type="datetime-local"
          class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
        />
        <p class="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
          <Icon name="calendar" :size="13" class="mt-0.5 shrink-0 text-amber-500" />
          Do zadaného termínu zůstane jako koncept, pak se zveřejní automaticky.
        </p>
      </div>

      <!-- Omezení zobrazení (konec zveřejnění) -->
      <div v-if="status !== 'draft'" class="mt-3">
        <label class="mb-1.5 flex items-center justify-between">
          <span class="text-[12.5px] font-600 text-graphite-800">Zobrazovat do</span>
          <span class="field-tag">publish-until</span>
        </label>
        <input
          v-model="publishTo"
          type="datetime-local"
          class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
        />
        <p class="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
          <Icon name="clock" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
          Po tomto termínu se přestane zobrazovat. Prázdné = zobrazovat neomezeně.
        </p>
      </div>

      <!-- Publikování per jazyk (jen když modul předá `langs`) -->
      <div v-if="langs && langs.length" class="mt-4 rounded-md border border-steel-200 bg-steel-50/60 p-2.5">
        <p class="mb-2 flex items-center gap-1.5 px-1 field-tag">
          <Icon name="globe" :size="13" class="text-steel-400" /> Zobrazit jazyk na webu
        </p>
        <ul class="space-y-1">
          <li
            v-for="l in langs"
            :key="l.code"
            class="flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-1.5"
          >
            <span class="flex items-center gap-2 text-[12.5px]">
              <LangFlag :lang="l.code" :size="13" />
              <span class="font-600 text-graphite-800">{{ l.code.toUpperCase() }}</span>
              <span class="inline-flex items-center gap-1 text-[11px] text-steel-500">
                <span class="h-1.5 w-1.5 rounded-full" :class="LANG_STATE_META[l.state].dot" />
                {{ LANG_STATE_META[l.state].label }}
              </span>
            </span>
            <AppSwitch
              v-if="l.state !== 'empty'"
              :model-value="l.state === 'live'"
              :aria-label="`Zveřejnit mutaci ${l.label}`"
              @update:model-value="$emit('toggle-lang', l.code)"
            />
            <span v-else class="text-[11px] text-steel-400" :title="`${l.label} — nejdřív doplňte obsah`">
              nelze
            </span>
          </li>
        </ul>
        <p class="mt-2 px-1 text-[11px] leading-relaxed text-steel-500">
          Přepínač zapne/vypne zobrazení dané jazykové verze na webu. Skryté a prázdné
          verze návštěvník uvidí v češtině.
        </p>
      </div>

      <div class="my-4 h-px bg-steel-100" />
    </div>

    <!-- Metadata záznamu -->
    <dl class="space-y-2.5 text-[12.5px]">
      <div class="flex items-center justify-between gap-2">
        <dt class="flex items-center gap-1.5 text-steel-500"><Icon name="plus" :size="13" class="text-steel-400" /> Vytvořeno</dt>
        <dd class="font-mono text-[11.5px] text-steel-600 tabular-nums">{{ created }}</dd>
      </div>
      <div class="flex items-center justify-between gap-2">
        <dt class="flex items-center gap-1.5 text-steel-500"><Icon name="edit" :size="13" class="text-steel-400" /> Naposledy upraveno</dt>
        <dd class="font-mono text-[11.5px] text-steel-600 tabular-nums">{{ updated }}</dd>
      </div>
      <div class="flex items-center justify-between gap-2 border-t border-steel-100 pt-2.5">
        <dt class="flex items-center gap-1.5 text-steel-500"><Icon name="user" :size="13" class="text-steel-400" /> Upravil(a)</dt>
        <dd class="flex items-center gap-1.5">
          <UserAvatar :name="updatedBy" :size="20" />
          <span class="text-[12.5px] text-graphite-700">{{ updatedBy }}</span>
        </dd>
      </div>
    </dl>
  </FormSection>
</template>
