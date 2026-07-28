<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'

export interface SelectOption {
  value: string
  label: string
}

defineProps<{ options: SelectOption[]; placeholder?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      class="inline-flex h-9 min-w-[150px] items-center justify-between gap-2 rounded-md border border-steel-200 bg-white px-3 text-[13px] text-graphite-800 outline-none transition-colors hover:border-steel-300 focus:border-brand-500 data-[state=open]:border-brand-500"
    >
      <SelectValue :placeholder="placeholder ?? 'Vyberte…'" />
      <SelectIcon class="text-steel-400">
        <Icon name="chevronDown" :size="14" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="z-50 min-w-[--reka-select-trigger-width] overflow-hidden rounded-lg border border-steel-200 bg-white p-1.5 shadow-2xl"
      >
        <SelectViewport>
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 pr-8 text-[13px] text-graphite-800 outline-none data-[highlighted]:bg-steel-100 data-[state=checked]:font-600 data-[state=checked]:text-brand-600"
          >
            <SelectItemIndicator class="absolute right-2.5">
              <Icon name="check" :size="15" class="text-brand-500" />
            </SelectItemIndicator>
            <SelectItemText>{{ opt.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
