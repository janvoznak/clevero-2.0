<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { MOCK_CATEGORIES, toursForCategory, type TourCategory } from '@/data/mockTours'
import { LANGS } from '@/data/types'

const router = useRouter()
const rows = ref<TourCategory[]>([...MOCK_CATEGORIES])

/* Zanoření prohlídek pod kategorie (vizuální strom jako Stránky) —
   defaultně rozbalené, aby byly prohlídky rovnou vidět. */
const expanded = ref<Set<string>>(new Set(MOCK_CATEGORIES.map((c) => c.id)))
function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function plain(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
function goNew() {
  router.push({ name: 'category-new' })
}
function goEdit(id: string) {
  router.push({ name: 'category-edit', params: { id } })
}
function goTour(id: string) {
  router.push({ name: 'tour-edit', params: { id } })
}
const rowActions = [
  { key: 'edit', label: 'Otevřít kategorii', icon: 'edit' },
  { key: 'delete', label: 'Smazat kategorii', icon: 'trash', danger: true },
]
const deleteTarget = ref<TourCategory | null>(null)
function onRowAction(key: string, c: TourCategory) {
  if (key === 'edit') goEdit(c.id)
  else if (key === 'delete') deleteTarget.value = c
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((c) => c.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tours</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/tours</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Prohlídky</h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ rows.length }} kategorií · prohlídky napojené na Colosseum · vstupenky přes API
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nová kategorie
      </AppButton>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Kategorie</th>
            <th class="px-2 py-3 font-600">Popis</th>
            <th class="w-28 px-2 py-3 font-600">Prohlídky</th>
            <th class="w-40 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="c in rows" :key="c.id">
            <!-- Kategorie -->
            <tr class="group border-b border-steel-100 transition-colors hover:bg-steel-50/60">
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-2">
                  <button
                    class="grid h-6 w-6 shrink-0 place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700"
                    :title="expanded.has(c.id) ? 'Sbalit prohlídky' : 'Rozbalit prohlídky'"
                    @click="toggle(c.id)"
                  >
                    <Icon name="chevronDown" :size="16" class="transition-transform" :class="!expanded.has(c.id) && '-rotate-90'" />
                  </button>
                  <button class="flex items-center gap-3 text-left" @click="goEdit(c.id)">
                    <span class="h-11 w-16 shrink-0 overflow-hidden rounded-md bg-steel-100">
                      <img v-if="c.image" :src="c.image" :alt="c.name.cs" class="h-full w-full object-cover" />
                    </span>
                    <span class="text-[14.5px] font-600 text-graphite-900 group-hover:text-brand-600">{{ c.name.cs }}</span>
                  </button>
                </div>
              </td>
              <td class="px-2 py-3 align-middle">
                <span class="block max-w-[420px] truncate text-[13px] text-steel-500">{{ plain(c.description.cs) }}</span>
              </td>
              <td class="px-2 py-3 align-middle">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-steel-100 px-2.5 py-1 text-[12px] font-600 text-graphite-700">
                  <Icon name="ticket" :size="13" class="text-steel-400" /> {{ toursForCategory(c.id).length }}
                </span>
              </td>
              <td class="px-2 py-3 align-middle">
                <div class="flex flex-wrap items-center gap-1">
                  <span
                    v-for="l in LANGS"
                    :key="l.code"
                    :title="c.name[l.code].trim() ? `${l.label} — vyplněno` : `${l.label} — chybí překlad`"
                    class="rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                    :class="c.name[l.code].trim() ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-400'"
                  >
                    {{ l.code }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-3 align-middle">
                <div class="flex justify-end">
                  <RowActionsMenu :actions="rowActions" label="Akce s kategorií" @select="(key) => onRowAction(key, c)" />
                </div>
              </td>
            </tr>

            <!-- Zanořené prohlídky kategorie -->
            <template v-if="expanded.has(c.id)">
              <tr
                v-for="t in toursForCategory(c.id)"
                :key="t.id"
                class="group border-b border-steel-100 bg-steel-50/30 transition-colors hover:bg-steel-50"
              >
                <td class="py-2.5 pl-4 pr-2 align-middle">
                  <button class="flex items-center gap-2.5 pl-9 text-left" @click="goTour(t.id)">
                    <Icon name="ticket" :size="15" class="shrink-0 text-steel-400" />
                    <span class="min-w-0">
                      <span class="block truncate text-[13.5px] font-500 text-graphite-800 group-hover:text-brand-600">{{ t.title.cs || 'Bez názvu' }}</span>
                      <span v-if="!t.published" class="text-[11px] text-steel-400">Koncept</span>
                    </span>
                  </button>
                </td>
                <td class="px-2 py-2.5 align-middle">
                  <span class="block max-w-[420px] truncate text-[12.5px] text-steel-400">{{ plain(t.perex.cs) }}</span>
                </td>
                <td class="px-2 py-2.5" />
                <td class="px-2 py-2.5 align-middle">
                  <div class="flex flex-wrap items-center gap-1">
                    <span
                      v-for="l in LANGS"
                      :key="l.code"
                      :title="t.title[l.code].trim() ? `${l.label} — vyplněno` : `${l.label} — chybí překlad`"
                      class="rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                      :class="t.title[l.code].trim() ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-400'"
                    >
                      {{ l.code }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2.5 align-middle">
                  <div class="flex justify-end">
                    <button
                      class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-brand-600"
                      title="Otevřít prohlídku"
                      @click="goTour(t.id)"
                    >
                      <Icon name="externalLink" :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="toursForCategory(c.id).length === 0" class="border-b border-steel-100">
                <td colspan="5" class="py-2.5 pl-[52px] pr-4 text-[12px] text-steel-400">Zatím žádné prohlídky v této kategorii.</td>
              </tr>
            </template>
          </template>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="ticket" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné kategorie</p>
              <p class="mt-1 text-[13px] text-steel-500">Vytvořte první kategorii prohlídek.</p>
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
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.name.cs }}"</span> včetně prohlídek v ní. Tato akce je nevratná.
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
