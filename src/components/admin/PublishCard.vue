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
import FormSection from '@/components/admin/FormSection.vue'

type Status = 'draft' | 'published' | 'scheduled'

const props = withDefaults(
  defineProps<{
    published?: boolean
    /** Výchozí stav karty (má přednost před `published`). */
    initialStatus?: Status
    created?: string
    updated?: string
    updatedBy?: string
  }>(),
  {
    published: true,
    initialStatus: undefined,
    created: '4. 8. 2025 · 14:00',
    updated: 'dnes · 9:14',
    updatedBy: 'Jan Voznak',
  },
)

/** Datum zveřejnění (naplánování) a konec zobrazení — datetime-local. */
const publishFrom = defineModel<string>('publishFrom', { default: '' })
const publishTo = defineModel<string>('publishTo', { default: '' })

const STATES: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Koncept' },
  { value: 'published', label: 'Publikováno' },
  { value: 'scheduled', label: 'Naplánováno' },
]
const status = ref<Status>(props.initialStatus ?? (props.published ? 'published' : 'draft'))

function initials(name: string): string {
  return name
    .split(/[\s·]+/)
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
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
          <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-steel-200 text-[8.5px] font-700 text-steel-600">{{ initials(updatedBy) }}</span>
          <span class="text-[12.5px] text-graphite-700">{{ updatedBy }}</span>
        </dd>
      </div>
    </dl>
  </FormSection>
</template>
