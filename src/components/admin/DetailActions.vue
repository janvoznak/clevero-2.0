<script setup lang="ts">
/**
 * Sjednocené akce hlavičky detailu/editace napříč všemi moduly.
 * Jediné primární tlačítko „Uložit" + kebab „⋮" vlevo s dalšími akcemi:
 *   Uložit a zpět · Duplikovat · Smazat. Žádné tlačítko „Zrušit".
 * (Princip 0b: jeden prvek = jedna komponenta.)
 */
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

const props = withDefaults(
  defineProps<{
    /** Název záznamu (do potvrzení mazání). */
    name?: string
    /** Sklonění entity (akuzativ) pro dialog, např. „akci", „prohlídku". */
    entity?: string
    /** Existující záznam → nabídnout Duplikovat + Smazat. Nový = jen Uložit a zpět. */
    isEdit?: boolean
    /** Umožnit duplikaci (u importovaných záznamů, např. produktů, bez smyslu). */
    canDuplicate?: boolean
    /** Po uložení: tlačítko ukáže „Uloženo" + fajfku. */
    saved?: boolean
  }>(),
  { name: '', entity: 'záznam', isEdit: true, canDuplicate: true, saved: false },
)

const emit = defineEmits<{ save: []; 'save-back': []; duplicate: []; delete: [] }>()

const menuActions = computed(() => {
  const list: { key: string; label: string; icon: string; danger?: boolean }[] = [
    { key: 'save-back', label: 'Uložit a zpět', icon: 'check' },
  ]
  if (props.isEdit && props.canDuplicate) list.push({ key: 'duplicate', label: 'Duplikovat', icon: 'copy' })
  if (props.isEdit) list.push({ key: 'delete', label: 'Smazat', icon: 'trash', danger: true })
  return list
})

const confirmOpen = ref(false)
function onSelect(key: string) {
  if (key === 'save-back') emit('save-back')
  else if (key === 'duplicate') emit('duplicate')
  else if (key === 'delete') confirmOpen.value = true
}
function confirmDelete() {
  confirmOpen.value = false
  emit('delete')
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Kebab s dalšími akcemi (vlevo od Uložit) -->
    <RowActionsMenu :actions="menuActions" label="Další akce" @select="onSelect" />

    <!-- Jediné primární tlačítko -->
    <AppButton variant="primary" @click="emit('save')">
      <Icon :name="saved ? 'check' : 'save'" :size="16" />
      {{ saved ? 'Uloženo' : 'Uložit' }}
    </AppButton>
  </div>

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
