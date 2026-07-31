<script setup lang="ts">
/**
 * Lišta přidružených stránek (prototyp — přepínač stránek ve skupině).
 * Skupina = kořenová stránka + její přímé podstránky (vlastní obsah)
 * + odkazy na existující stránky (↗). Klik na záložku přepne editaci
 * na danou stránku (její vlastní nadpis/obsah). Přidávání, mazání a
 * změna pořadí přímo na liště.
 */
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import {
  MOCK_PAGES,
  pageGroup,
  createChildPage,
  removePage,
  setChildOrder,
  addAssociatedLink,
  removeAssociatedLink,
  slugPath,
} from '@/data/mockPages'
import type { PageItem } from '@/data/mockPages'

const props = defineProps<{ currentId: string }>()
const emit = defineEmits<{ navigate: [id: string] }>()

const group = pageGroup(MOCK_PAGES, props.currentId)
const root = group.root
const members = ref<PageItem[]>(group.members)
const links = ref<PageItem[]>(group.links)
const children = computed(() => members.value.slice(1))

function pageTitle(p: PageItem) {
  return p.title.cs || 'Bez názvu'
}
function isActive(p: PageItem) {
  return p.id === props.currentId
}
function go(id: string) {
  if (id !== props.currentId) emit('navigate', id)
}

/* ---------- Přidání / odebrání ---------- */
const addOpen = ref(false)
const search = ref('')
const groupIds = computed(
  () => new Set([...members.value.map((m) => m.id), ...links.value.map((l) => l.id)]),
)
const candidates = computed(() => {
  const q = search.value.trim().toLowerCase()
  return MOCK_PAGES.filter(
    (p) => !groupIds.value.has(p.id) && pageTitle(p).toLowerCase().includes(q),
  )
})

function addChild() {
  const page = createChildPage(MOCK_PAGES, root.id)
  addOpen.value = false
  emit('navigate', page.id)
}
function removeChild(id: string) {
  const wasActive = id === props.currentId
  removePage(MOCK_PAGES, id)
  members.value = members.value.filter((m) => m.id !== id)
  // Pokud jsme smazali právě editovanou stránku, přejdeme na kořen skupiny.
  if (wasActive) emit('navigate', root.id)
}
function linkExisting(p: PageItem) {
  addAssociatedLink(root, p.id)
  links.value = [...links.value, p]
  search.value = ''
  addOpen.value = false
}
function unlink(id: string) {
  removeAssociatedLink(root, id)
  links.value = links.value.filter((l) => l.id !== id)
}

/* ---------- Reorder potomků (drag & drop) ---------- */
const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)
function onDragStart(id: string) {
  dragId.value = id
}
function onDragOver(id: string) {
  if (dragId.value && dragId.value !== id) overId.value = id
}
function onDrop(id: string) {
  const from = dragId.value
  if (!from || from === id) return resetDnd()
  const list = [...children.value]
  const fi = list.findIndex((c) => c.id === from)
  const ti = list.findIndex((c) => c.id === id)
  if (fi < 0 || ti < 0) return resetDnd()
  const [moved] = list.splice(fi, 1)
  list.splice(ti, 0, moved)
  members.value = [members.value[0], ...list]
  setChildOrder(MOCK_PAGES, list.map((c) => c.id))
  resetDnd()
}
function resetDnd() {
  dragId.value = null
  overId.value = null
}
</script>

<template>
  <div class="rounded-lg border border-steel-200 bg-white">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-steel-100 px-3 py-2">
      <span class="flex items-center gap-2 text-[12.5px] font-600 text-graphite-700">
        <Icon name="layout" :size="15" class="text-brand-500" /> Přidružené stránky
        <span class="field-tag">záložky na stránce</span>
      </span>
      <span class="text-[11px] text-steel-400">Klik přepne editaci · přetažením změníte pořadí</span>
    </div>

    <div class="flex flex-wrap items-center gap-1.5 p-2.5">
      <!-- Kořenová stránka (vlastník skupiny) -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-600 outline-none transition-colors"
        :class="isActive(members[0])
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-steel-200 bg-steel-50 text-graphite-700 hover:bg-steel-100'"
        @click="go(members[0].id)"
      >
        <Icon name="home" :size="14" :class="isActive(members[0]) ? 'text-white/90' : 'text-steel-400'" />
        {{ pageTitle(members[0]) }}
      </button>

      <!-- Podstránky (vlastní obsah) — přetažitelné -->
      <div
        v-for="c in children"
        :key="c.id"
        draggable="true"
        class="group inline-flex items-center rounded-md border transition-all"
        :class="[
          isActive(c) ? 'border-brand-500 bg-brand-500 text-white' : 'border-steel-200 bg-steel-50 text-graphite-700 hover:bg-steel-100',
          overId === c.id && dragId !== c.id ? 'ring-2 ring-brand-400/50' : '',
          dragId === c.id ? 'opacity-40' : '',
        ]"
        @dragstart="onDragStart(c.id)"
        @dragover.prevent="onDragOver(c.id)"
        @drop.prevent="onDrop(c.id)"
        @dragend="resetDnd"
      >
        <button
          type="button"
          class="inline-flex cursor-grab items-center gap-1.5 py-1.5 pl-3 pr-1.5 text-[13px] font-600 outline-none"
          @click="go(c.id)"
        >
          <Icon name="grip" :size="13" :class="isActive(c) ? 'text-white/70' : 'text-steel-400'" />
          {{ pageTitle(c) }}
        </button>
        <button
          type="button"
          class="mr-1 grid h-5 w-5 shrink-0 place-items-center rounded outline-none transition-colors"
          :class="isActive(c) ? 'text-white/70 hover:bg-white/20 hover:text-white' : 'text-steel-400 hover:bg-danger-500/10 hover:text-danger-500'"
          title="Odebrat stránku"
          @click.stop="removeChild(c.id)"
        >
          <Icon name="x" :size="13" />
        </button>
      </div>

      <!-- Oddělovač před odkazy -->
      <span v-if="links.length" class="mx-1 h-5 w-px bg-steel-200" />

      <!-- Odkazy na existující stránky (↗) -->
      <div
        v-for="l in links"
        :key="l.id"
        class="group inline-flex items-center rounded-md border border-dashed transition-colors"
        :class="isActive(l) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-steel-300 bg-white text-graphite-700 hover:bg-steel-50'"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1.5 text-[13px] font-600 outline-none"
          @click="go(l.id)"
        >
          {{ pageTitle(l) }}
          <Icon name="link" :size="12" class="text-steel-400" />
        </button>
        <button
          type="button"
          class="mr-1 grid h-5 w-5 shrink-0 place-items-center rounded text-steel-400 outline-none transition-colors hover:bg-danger-500/10 hover:text-danger-500"
          title="Zrušit odkaz"
          @click.stop="unlink(l.id)"
        >
          <Icon name="x" :size="13" />
        </button>
      </div>

      <!-- Přidat přidruženou stránku -->
      <PopoverRoot v-model:open="addOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-md border border-dashed border-steel-300 text-steel-500 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 data-[state=open]:border-brand-500 data-[state=open]:text-brand-600"
            title="Přidat přidruženou stránku"
          >
            <Icon name="plus" :size="16" />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="start"
            :side-offset="6"
            class="z-50 w-72 rounded-xl border border-steel-200 bg-white p-2 shadow-2xl"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-steel-100"
              @click="addChild"
            >
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded bg-brand-50 text-brand-500">
                <Icon name="plus" :size="15" />
              </span>
              <span class="flex-1">
                <span class="block text-[13px] font-600 text-graphite-800">Nová podstránka</span>
                <span class="block text-[11px] text-steel-500">Vlastní obsah přes grafické vzory</span>
              </span>
            </button>

            <div class="my-1.5 border-t border-steel-100" />
            <p class="px-1 pb-1.5 text-[11px] font-600 text-steel-500">Odkaz na existující stránku</p>
            <div class="relative mb-1.5">
              <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                v-model="search"
                type="text"
                placeholder="Hledat stránku…"
                class="h-8 w-full rounded-md border border-steel-200 pl-8 pr-2 text-[13px] focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div class="scroll-thin max-h-48 overflow-y-auto">
              <button
                v-for="p in candidates"
                :key="p.id"
                type="button"
                class="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-steel-100"
                @click="linkExisting(p)"
              >
                <Icon name="subpage" :size="14" class="shrink-0 text-steel-400" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] text-graphite-800">{{ pageTitle(p) }}</span>
                  <span class="block truncate font-mono text-[10.5px] text-steel-400">{{ slugPath(MOCK_PAGES, p) }}</span>
                </span>
                <Icon name="link" :size="13" class="shrink-0 text-steel-300" />
              </button>
              <p v-if="!candidates.length" class="px-2 py-3 text-center text-[12px] text-steel-400">
                Žádná další stránka k odkazu.
              </p>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>
  </div>
</template>
