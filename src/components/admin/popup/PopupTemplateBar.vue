<script setup lang="ts">
/**
 * Lišta „Předvyplnit ze šablony" — nad Reka DropdownMenu.
 * Jen prezentační: nabídne šablony a vybranou emituje ven (@select).
 * Rozhodnutí o přepsání/aplikaci řeší rodič (drží stav formuláře).
 */
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { PopupTemplate } from '@/data/mockPopups'

defineProps<{ templates: PopupTemplate[] }>()
defineEmits<{ select: [tpl: PopupTemplate] }>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-steel-200 bg-steel-50/70 px-4 py-3">
    <div class="flex items-center gap-2.5">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-500/10 text-brand-500">
        <Icon name="layout" :size="17" />
      </span>
      <div>
        <p class="text-[13px] font-600 text-graphite-800">Předvyplnit ze šablony</p>
        <p class="text-[11.5px] text-steel-500">Rychlý start z připravené předlohy</p>
      </div>
    </div>

    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <AppButton variant="secondary" size="sm">
          <Icon name="layout" :size="15" /> Vybrat šablonu
          <Icon name="chevronDown" :size="14" />
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          :side-offset="6"
          class="z-50 w-[320px] max-w-[92vw] rounded-xl border border-steel-200 bg-white p-1.5 shadow-2xl"
        >
          <DropdownMenuItem
            v-for="t in templates"
            :key="t.id"
            class="flex cursor-pointer flex-col items-start gap-1 rounded-md px-2.5 py-2 outline-none transition-colors data-[highlighted]:bg-steel-100"
            @select="$emit('select', t)"
          >
            <span class="flex items-center gap-2">
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-700 uppercase tracking-wide text-white"
                :style="{ backgroundColor: t.categoryColor }"
              >
                {{ t.category }}
              </span>
              <span class="text-[13px] font-600 text-graphite-900">{{ t.name }}</span>
            </span>
            <span class="text-[11.5px] leading-snug text-steel-500">{{ t.hint }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
