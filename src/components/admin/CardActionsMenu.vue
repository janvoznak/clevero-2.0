<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'

/**
 * Kontextové menu „⋮" pro detail/editaci záznamu (hlavička obrazovky).
 * Sjednocuje akce, které v detailu dřív chyběly — hlavně mazání záznamu.
 * Vizuálně i chováním navazuje na RowActionsMenu z výpisů.
 */
const props = withDefaults(
  defineProps<{
    /** Název záznamu zobrazený v potvrzení mazání (např. titulek). */
    name?: string
    /** Sklonění entity (akuzativ) pro nadpis dialogu, např. „program", „akci". */
    entity?: string
    /** Zobrazit položku Smazat (u nového záznamu není co mazat). */
    canDelete?: boolean
    /** Zobrazit položku Duplikovat. */
    canDuplicate?: boolean
  }>(),
  { name: '', entity: 'záznam', canDelete: true, canDuplicate: true },
)

const emit = defineEmits<{ delete: []; duplicate: [] }>()

const actions = computed(() => {
  const list: { key: string; label: string; icon: string; danger?: boolean }[] = []
  if (props.canDuplicate) list.push({ key: 'duplicate', label: 'Duplikovat', icon: 'copy' })
  if (props.canDelete) list.push({ key: 'delete', label: 'Smazat', icon: 'trash', danger: true })
  return list
})

const confirmOpen = ref(false)

function onSelect(key: string) {
  if (key === 'duplicate') emit('duplicate')
  else if (key === 'delete') confirmOpen.value = true
}
function confirmDelete() {
  confirmOpen.value = false
  emit('delete')
}
</script>

<template>
  <RowActionsMenu :actions="actions" label="Další akce" @select="onSelect" />

  <!-- Potvrzení smazání (prototyp — reálně nic nemaže) -->
  <DialogRoot :open="confirmOpen" @update:open="(v) => (confirmOpen = v)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
      >
        <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
          <Icon name="trash" :size="22" />
        </div>
        <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat {{ entity }}?</DialogTitle>
        <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
          Chystáte se smazat
          <span v-if="name" class="font-600 text-graphite-800">„{{ name }}"</span>
          <span v-else>vybraný záznam</span>.
          Tato akce je nevratná.
        </DialogDescription>
        <div class="mt-5 flex justify-end gap-2">
          <AppButton variant="secondary" @click="confirmOpen = false">Zrušit</AppButton>
          <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
