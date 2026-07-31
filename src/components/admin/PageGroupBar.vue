<script setup lang="ts">
/**
 * Lišta přidružených stránek (prototyp — přepínač stránek ve skupině).
 * Hlavní (kořenová) stránka je na samostatném řádku nahoře; pod ní jsou
 * podstránky s vlastním obsahem + externí odkazy (↗ otevře nové okno).
 * Popisky respektují jazykový přepínač editoru (prop `lang`). Klik na
 * podstránku přepne editaci; přidávání, editace, mazání a řazení na liště.
 */
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { LANGS } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_PAGES,
  pageGroup,
  createChildPage,
  removePage,
  setChildOrder,
  addAssociatedLink,
  updateAssociatedLink,
  removeAssociatedLink,
} from '@/data/mockPages'
import type { PageItem, AssociatedLink } from '@/data/mockPages'

const props = defineProps<{ currentId: string; lang: LangCode }>()
const emit = defineEmits<{
  navigate: [id: string]
  addChildNew: []
  addLinkNew: [payload: { label: ML; url: string }]
}>()

const group = pageGroup(MOCK_PAGES, props.currentId)
const root = group.root
const members = ref<PageItem[]>(group.members)
const links = ref<AssociatedLink[]>(group.links)
const children = computed(() => members.value.slice(1))
/** Je kořen skupiny už uložený v datech? (nová stránka ještě ne) */
const rootPersisted = MOCK_PAGES.some((p) => p.id === root.id)

function emptyML(): ML {
  return LANGS.reduce((acc, l) => ({ ...acc, [l.code]: '' }), {} as ML)
}
function pageTitle(p: PageItem) {
  return p.title[props.lang] || p.title.cs || 'Bez názvu'
}
function linkLabelText(l: AssociatedLink) {
  return l.label[props.lang] || l.label.cs || 'Bez popisku'
}
function isActive(p: PageItem) {
  return p.id === props.currentId
}
function go(id: string) {
  if (id !== props.currentId) emit('navigate', id)
}

/* ---------- Podstránky (vlastní obsah) ---------- */
function addChild() {
  addOpen.value = false
  if (!rootPersisted) {
    emit('addChildNew')
    return
  }
  const page = createChildPage(MOCK_PAGES, root.id)
  emit('navigate', page.id)
}
function removeChild(id: string) {
  const wasActive = id === props.currentId
  removePage(MOCK_PAGES, id)
  members.value = members.value.filter((m) => m.id !== id)
  if (wasActive) emit('navigate', root.id)
}

/* ---------- Externí odkazy ---------- */
const addOpen = ref(false)
const newLabel = ref('')
const newUrl = ref('')
const newValid = computed(() => newLabel.value.trim().length > 0 && newUrl.value.trim().length > 0)

function normalizeUrl(u: string) {
  const url = u.trim()
  return /^https?:\/\//i.test(url) ? url : 'https://' + url
}
function addExternalLink() {
  if (!newValid.value) return
  const label = emptyML()
  label[props.lang] = newLabel.value.trim()
  const url = normalizeUrl(newUrl.value)
  newLabel.value = ''
  newUrl.value = ''
  addOpen.value = false
  if (!rootPersisted) {
    emit('addLinkNew', { label, url })
    return
  }
  const link = addAssociatedLink(root, label, url)
  links.value = [...links.value, link]
}
function unlink(id: string) {
  removeAssociatedLink(root, id)
  links.value = links.value.filter((l) => l.id !== id)
}
function openLink(url: string) {
  window.open(url, '_blank', 'noopener')
}

/* ---------- Editace odkazu (popisek pro aktuální jazyk + URL) ---------- */
const editId = ref<string | null>(null)
const editLabel = ref('')
const editUrl = ref('')
function openEdit(l: AssociatedLink) {
  editId.value = l.id
  editLabel.value = l.label[props.lang] || ''
  editUrl.value = l.url
}
function setEditOpen(l: AssociatedLink, open: boolean) {
  if (open) openEdit(l)
  else if (editId.value === l.id) editId.value = null
}
function saveEdit(l: AssociatedLink) {
  const label: ML = { ...l.label, [props.lang]: editLabel.value.trim() }
  const patch = { label, url: normalizeUrl(editUrl.value) }
  updateAssociatedLink(root, l.id, patch)
  links.value = links.value.map((x) => (x.id === l.id ? { ...x, ...patch } : x))
  editId.value = null
}

/* ---------- Reorder podstránek (drag & drop) ---------- */
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

const langTag = computed(() => props.lang.toUpperCase())
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

    <div class="space-y-3 p-3">
      <!-- Hlavní (kořenová) stránka -->
      <div>
        <p class="mb-1.5 text-[10.5px] font-700 uppercase tracking-wide text-steel-400">
          Hlavní stránka
        </p>
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
      </div>

      <!-- Podstránky + externí odkazy -->
      <div>
        <p class="mb-1.5 text-[10.5px] font-700 uppercase tracking-wide text-steel-400">
          Podstránky
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
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
              title="Odebrat podstránku"
              @click.stop="removeChild(c.id)"
            >
              <Icon name="x" :size="13" />
            </button>
          </div>

          <!-- Externí odkazy (↗ otevře nové okno) -->
          <div
            v-for="l in links"
            :key="l.id"
            class="group inline-flex items-center rounded-md border border-dashed border-steel-300 bg-white text-graphite-700 transition-colors hover:bg-steel-50"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1 text-[13px] font-600 outline-none"
              :class="l.label[props.lang] ? '' : 'italic text-steel-400'"
              :title="l.url"
              @click="openLink(l.url)"
            >
              <Icon name="externalLink" :size="13" class="text-steel-400" />
              {{ linkLabelText(l) }}
            </button>

            <!-- Editace odkazu -->
            <PopoverRoot :open="editId === l.id" @update:open="(o) => setEditOpen(l, o)">
              <PopoverTrigger as-child>
                <button
                  type="button"
                  class="grid h-5 w-5 shrink-0 place-items-center rounded text-steel-400 outline-none transition-colors hover:bg-steel-200 hover:text-graphite-700"
                  title="Upravit odkaz"
                >
                  <Icon name="edit" :size="12" />
                </button>
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent
                  align="end"
                  :side-offset="6"
                  class="z-50 w-64 rounded-xl border border-steel-200 bg-white p-2.5 shadow-2xl"
                >
                  <label class="mb-1 flex items-center justify-between">
                    <span class="text-[12px] font-600 text-graphite-800">Popisek</span>
                    <span class="field-tag">{{ langTag }}</span>
                  </label>
                  <input
                    v-model="editLabel"
                    type="text"
                    :placeholder="`Popisek (${langTag})`"
                    class="mb-2 h-8 w-full rounded-md border border-steel-200 px-2.5 text-[13px] focus:border-brand-500 focus:outline-none"
                  />
                  <label class="mb-1 block text-[12px] font-600 text-graphite-800">Adresa (URL)</label>
                  <input
                    v-model="editUrl"
                    type="text"
                    placeholder="https://…"
                    class="mb-2.5 h-8 w-full rounded-md border border-steel-200 px-2.5 text-[13px] focus:border-brand-500 focus:outline-none"
                    @keyup.enter="saveEdit(l)"
                  />
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand-500 py-1.5 text-[12.5px] font-600 text-white outline-none hover:bg-brand-600"
                      @click="saveEdit(l)"
                    >
                      <Icon name="check" :size="13" /> Uložit
                    </button>
                    <button
                      type="button"
                      class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-steel-500 outline-none hover:bg-danger-500/10 hover:text-danger-500"
                      title="Odebrat odkaz"
                      @click="unlink(l.id); editId = null"
                    >
                      <Icon name="trash" :size="14" />
                    </button>
                  </div>
                  <p class="mt-2 text-[10.5px] leading-relaxed text-steel-400">
                    Popisek zadáváte pro každý jazyk zvlášť — přepněte jazyk nahoře.
                  </p>
                </PopoverContent>
              </PopoverPortal>
            </PopoverRoot>
          </div>

          <!-- Přidat -->
          <PopoverRoot v-model:open="addOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md border border-dashed border-steel-300 text-steel-500 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 data-[state=open]:border-brand-500 data-[state=open]:text-brand-600"
                title="Přidat podstránku nebo odkaz"
              >
                <Icon name="plus" :size="16" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                align="start"
                :side-offset="6"
                class="z-50 w-80 rounded-xl border border-steel-200 bg-white p-3 shadow-2xl"
              >
                <p class="mb-2 text-[10.5px] font-700 uppercase tracking-wide text-steel-400">
                  Přidat do skupiny
                </p>

                <!-- Možnost 1: nová podstránka -->
                <button
                  type="button"
                  class="group/opt flex w-full items-center gap-2.5 rounded-lg border border-steel-200 bg-white px-3 py-2.5 text-left outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/50"
                  @click="addChild"
                >
                  <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-500">
                    <Icon name="subpage" :size="16" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-[13px] font-700 text-graphite-800">Nová podstránka</span>
                    <span class="block text-[11px] text-steel-500">Vlastní obsah přes grafické vzory</span>
                  </span>
                  <Icon name="chevronRight" :size="16" class="shrink-0 text-steel-300 transition-colors group-hover/opt:text-brand-500" />
                </button>

                <!-- Oddělovač -->
                <div class="my-2.5 flex items-center gap-2">
                  <span class="h-px flex-1 bg-steel-100" />
                  <span class="text-[10px] font-700 uppercase tracking-wider text-steel-300">nebo</span>
                  <span class="h-px flex-1 bg-steel-100" />
                </div>

                <!-- Možnost 2: externí odkaz -->
                <div class="rounded-lg border border-steel-200 bg-steel-50/50 px-3 py-2.5">
                  <div class="mb-2 flex items-center gap-2.5">
                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-steel-100 text-steel-500">
                      <Icon name="externalLink" :size="16" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-[13px] font-700 text-graphite-800">Odkaz na externí stránku</span>
                      <span class="block text-[11px] text-steel-500">Otevře se v novém okně (↗)</span>
                    </span>
                    <span class="field-tag">{{ langTag }}</span>
                  </div>
                  <input
                    v-model="newLabel"
                    type="text"
                    :placeholder="`Popisek (${langTag}) – např. Pro školy`"
                    class="mb-1.5 h-8 w-full rounded-md border border-steel-200 px-2.5 text-[13px] focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    v-model="newUrl"
                    type="text"
                    placeholder="https://…"
                    class="mb-2 h-8 w-full rounded-md border border-steel-200 px-2.5 text-[13px] focus:border-brand-500 focus:outline-none"
                    @keyup.enter="addExternalLink"
                  />
                  <button
                    type="button"
                    :disabled="!newValid"
                    class="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500 py-2 text-[13px] font-600 text-white outline-none transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-steel-200 disabled:text-steel-400"
                    @click="addExternalLink"
                  >
                    <Icon name="plus" :size="14" /> Přidat odkaz
                  </button>
                  <p class="mt-2 text-[10.5px] leading-relaxed text-steel-400">
                    Popisek zadáváte pro každý jazyk zvlášť — přepněte jazyk nahoře a doplňte překlad.
                  </p>
                </div>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </div>
      </div>
    </div>
  </div>
</template>
