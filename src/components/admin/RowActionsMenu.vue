<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'

/** Jedna položka kontextového menu akcí nad řádkem tabulky. */
interface RowAction {
  key: string
  label: string
  icon: string
  /** Destruktivní položka (mazání) — červené zvýraznění. */
  danger?: boolean
}

withDefaults(
  defineProps<{
    actions: RowAction[]
    /** Přístupný popisek spouštěče. */
    label?: string
    /** Velikost spouštěče: 'sm' (výpisy, výchozí) | 'md' (hlavička detailu — zarovnané s tlačítkem Uložit). */
    size?: 'sm' | 'md'
  }>(),
  { label: 'Akce', size: 'sm' },
)
defineEmits<{ select: [key: string] }>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :aria-label="label"
        class="grid place-items-center rounded-md border border-steel-200 bg-white text-graphite-700 outline-none transition-colors hover:border-steel-300 hover:bg-steel-100 hover:text-graphite-900 data-[state=open]:border-brand-500 data-[state=open]:bg-brand-50 data-[state=open]:text-brand-600"
        :class="size === 'md' ? 'h-10 w-10' : 'h-8 w-8'"
      >
        <Icon name="more" :size="20" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="4"
        class="z-50 min-w-52 rounded-lg border border-steel-200 bg-white p-1.5 shadow-2xl"
      >
        <DropdownMenuItem
          v-for="a in actions"
          :key="a.key"
          class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] outline-none transition-colors"
          :class="a.danger
            ? 'text-danger-600 data-[highlighted]:bg-danger-500/10'
            : 'text-graphite-700 data-[highlighted]:bg-steel-100'"
          @select="$emit('select', a.key)"
        >
          <Icon :name="a.icon" :size="16" :class="a.danger ? 'text-danger-500' : 'text-steel-500'" />
          {{ a.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
