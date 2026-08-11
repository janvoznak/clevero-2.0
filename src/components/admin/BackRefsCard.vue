<script setup lang="ts">
/**
 * Sdílená karta „Zpětné vazby" — kde všude se na tento záznam odkazuje.
 * Read-only: vazby se spravují v odkazujícím záznamu (jednosměrný zdroj pravdy),
 * tady se jen zrcadlí a proklikávají. Jednotné napříč moduly (Prohlídky, Areál,
 * Galerie…). Data dodává `@/data/backrefs`.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import FormSection from '@/components/admin/FormSection.vue'
import type { BackRefGroup } from '@/data/backrefs'

const props = withDefaults(
  defineProps<{
    groups: BackRefGroup[]
    /** Popisek entity pro prázdný stav, např. „prohlídku". */
    entityLabel?: string
  }>(),
  { entityLabel: 'tento záznam' },
)

const router = useRouter()
const total = computed(() => props.groups.reduce((n, g) => n + g.items.length, 0))

function open(routeName: string, id: string) {
  router.push({ name: routeName, params: { id } })
}
</script>

<template>
  <FormSection title="Zpětné vazby" icon="link" tag="record-backrefs">
    <p class="mb-3 text-[11.5px] leading-relaxed text-steel-500">
      Kde všude se na {{ entityLabel }} odkazuje. Vazba se spravuje v daném záznamu — tady je jen přehled.
    </p>

    <div v-if="total === 0" class="rounded-md border border-dashed border-steel-200 px-3 py-4 text-center text-[12.5px] text-steel-400">
      Zatím sem odnikud nevede odkaz.
    </div>

    <div v-else class="space-y-3">
      <div v-for="g in groups" :key="g.key">
        <p class="mb-1.5 flex items-center gap-1.5 field-tag">
          <Icon :name="g.icon" :size="13" class="text-steel-400" /> {{ g.label }}
          <span class="text-steel-400">· {{ g.items.length }}</span>
        </p>
        <ul class="space-y-1">
          <li v-for="it in g.items" :key="it.id">
            <button
              type="button"
              class="group flex w-full items-center gap-2 rounded-md border border-steel-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              @click="open(it.routeName, it.id)"
            >
              <span class="min-w-0 flex-1 truncate text-[12.5px] text-graphite-800 group-hover:text-brand-700">{{ it.title }}</span>
              <Icon name="externalLink" :size="13" class="shrink-0 text-steel-300 group-hover:text-brand-500" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </FormSection>
</template>
