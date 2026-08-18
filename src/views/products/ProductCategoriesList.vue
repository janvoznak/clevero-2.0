<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { MOCK_PRODUCT_CATEGORIES, productsForCategory, categoryVisible, type ProductCategory } from '@/data/mockProducts'

const router = useRouter()

const rows = ref<ProductCategory[]>([...MOCK_PRODUCT_CATEGORIES])
const deleteTarget = ref<ProductCategory | null>(null)

function goNew() {
  router.push({ name: 'product-category-new' })
}
function goEdit(id: string) {
  router.push({ name: 'product-category-edit', params: { id } })
}

const rowActions = [
  { key: 'edit', label: 'Editovat kategorii', icon: 'edit' },
  { key: 'delete', label: 'Smazat kategorii', icon: 'trash', danger: true },
]
function onRowAction(key: string, c: ProductCategory) {
  if (key === 'edit') goEdit(c.id)
  else if (key === 'delete') deleteTarget.value = c
}
function confirmDelete() {
  if (!deleteTarget.value) return
  rows.value = rows.value.filter((c) => c.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}

const total = computed(() => rows.value.length)
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">product-category</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/product-categories</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Členění produktů</h1>      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" /> Nová kategorie
      </AppButton>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Kategorie</th>
            <th class="w-40 px-2 py-3 font-600">Produktů</th>
            <th class="w-32 px-2 py-3 font-600">Stav</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in rows"
            :key="c.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
          >
            <td class="px-4 py-3 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(c.id)">
                <span class="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-100 text-steel-400">
                  <img v-if="c.image" :src="c.image" :alt="c.name.cs" class="h-full w-full object-cover" />
                  <Icon v-else name="layers" :size="16" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">{{ c.name.cs || 'Bez názvu' }}</span>
                  <span class="block truncate text-[11.5px] text-steel-500">{{ c.description.cs.replace(/<[^>]+>/g, '') || 'Bez popisu' }}</span>
                </span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle text-[13px] text-graphite-700 tabular-nums">
              {{ productsForCategory(c.id).length }}
            </td>
            <td class="px-2 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                :class="categoryVisible(c.id) ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-500'"
                :title="categoryVisible(c.id) ? 'Má dostupné produkty — zobrazuje se v navigaci' : 'Bez dostupných produktů — skryto'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="categoryVisible(c.id) ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ categoryVisible(c.id) ? 'V navigaci' : 'Skryto' }}
              </span>
            </td>
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s kategorií" @select="(key) => onRowAction(key, c)" />
              </div>
            </td>
          </tr>

          <tr v-if="rows.length === 0">
            <td colspan="4" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="layers" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné členění</p>
              <p class="mt-1 text-[13px] text-steel-500">Vytvořte první kategorii produktů.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete dialog -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat kategorii?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.name.cs }}"</span>. Produkty zůstanou, jen se odeberou z tohoto členění. Tato akce je nevratná.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
