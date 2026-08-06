<script setup lang="ts">
/**
 * Sdílený správce příloh — řádkový výpis (tabulka) jako GalleryManager, jen pro
 * soubory: Pořadí (úchyt + číslo), Typ (přípona), Název, Velikost, Akce.
 * Přílohy jsou per-jazyk → zobrazuje a řadí jen přílohy aktivní mutace.
 * Řazení: drag&drop + tlačítka ↑/↓, topování úplně nahoru (⤒). Bez „hlavní".
 * Prototyp — nahrávání generuje zástupný soubor.
 */
import { computed, ref } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import type { Attachment, LangCode } from '@/data/types'

const props = defineProps<{ lang: LangCode }>()
const model = defineModel<Attachment[]>({ default: () => [] })

/** Přílohy aktivní jazykové mutace (v pořadí dle pole). */
const forLang = computed(() => model.value.filter((a) => a.lang === props.lang))

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)
const selected = ref<Set<string>>(new Set())

/** Zapíše nové pořadí příloh aktivní mutace zpět do modelu (ostatní jazyky beze změny). */
function writeLangOrder(list: Attachment[]) {
  let k = 0
  model.value = model.value.map((a) => (a.lang === props.lang ? list[k++] : a))
}
function moveVisible(from: number, to: number) {
  const list = [...forLang.value]
  if (to < 0 || to >= list.length || from === to) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  writeLangOrder(list)
}
function moveUp(j: number) {
  moveVisible(j, j - 1)
}
function moveDown(j: number) {
  moveVisible(j, j + 1)
}
function moveToTop(j: number) {
  moveVisible(j, 0)
}
function onDrop(target: number) {
  if (dragIndex.value === null || dragIndex.value === target) {
    dragIndex.value = null
    overIndex.value = null
    return
  }
  moveVisible(dragIndex.value, target)
  dragIndex.value = null
  overIndex.value = null
}

function remove(id: string) {
  model.value = model.value.filter((a) => a.id !== id)
  const next = new Set(selected.value)
  next.delete(id)
  selected.value = next
}

/* ---------- Výběr / hromadné mazání (v rámci mutace) ---------- */
const allSelected = computed(() => forLang.value.length > 0 && forLang.value.every((a) => selected.value.has(a.id)))
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) forLang.value.forEach((a) => next.add(a.id))
  else forLang.value.forEach((a) => next.delete(a.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
function removeSelected() {
  model.value = model.value.filter((a) => !selected.value.has(a.id))
  selected.value = new Set()
}

/** Přidání „nahrané" přílohy (prototyp). */
let addSeq = 0
function addMock() {
  addSeq += 1
  const n = model.value.filter((a) => a.lang === props.lang).length + 1
  model.value = [
    ...model.value,
    { id: `att-new-${props.lang}-${addSeq}`, name: `dokument-${n}.pdf`, size: `${120 + n * 37} kB`, ext: 'pdf', lang: props.lang },
  ]
}

const extColor: Record<string, string> = {
  pdf: 'bg-danger-500/10 text-danger-600',
  doc: 'bg-brand-500/10 text-brand-600',
  docx: 'bg-brand-500/10 text-brand-600',
  xls: 'bg-forge-500/10 text-forge-600',
  xlsx: 'bg-forge-500/10 text-forge-600',
  zip: 'bg-graphite-800/10 text-graphite-700',
}
</script>

<template>
  <div>
    <!-- Hromadná akce (při výběru) -->
    <div
      v-if="selected.size"
      class="mb-3 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
    >
      <span class="text-[13px] font-600 text-brand-700">Vybráno {{ selected.size }} {{ selected.size === 1 ? 'příloha' : 'příloh' }}</span>
      <div class="flex items-center gap-2">
        <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">Zrušit výběr</button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md bg-danger-500 px-3 py-1.5 text-[12.5px] font-600 text-white transition-colors hover:bg-danger-600"
          @click="removeSelected"
        >
          <Icon name="trash" :size="14" /> Smazat vybrané
        </button>
      </div>
    </div>

    <!-- Řádkový výpis příloh -->
    <div v-if="forLang.length" class="overflow-x-auto rounded-lg border border-steel-200">
      <table class="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-10 px-3 py-2.5">
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="w-20 px-2 py-2.5 font-600">Pořadí</th>
            <th class="w-16 px-2 py-2.5 font-600">Typ</th>
            <th class="px-2 py-2.5 font-600">Název</th>
            <th class="w-28 px-2 py-2.5 font-600">Velikost</th>
            <th class="w-28 px-3 py-2.5 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(a, j) in forLang"
            :key="a.id"
            class="border-b border-steel-100 align-middle transition-colors last:border-0 hover:bg-steel-50/60"
            :class="[
              overIndex === j && dragIndex !== j ? 'ring-2 ring-inset ring-brand-400' : '',
              dragIndex === j ? 'opacity-40' : '',
            ]"
            @dragenter.prevent="dragIndex !== null && (overIndex = j)"
            @dragover.prevent
            @drop="onDrop(j)"
          >
            <!-- Výběr -->
            <td class="px-3 py-2.5">
              <CheckboxRoot
                :model-value="selected.has(a.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(a.id, v)"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>

            <!-- Pořadí: úchyt + číslo -->
            <td class="px-2 py-2.5">
              <div class="flex items-center gap-1.5">
                <span
                  draggable="true"
                  class="cursor-grab text-steel-400 transition-colors hover:text-graphite-700 active:cursor-grabbing"
                  title="Přetáhnout pro změnu pořadí"
                  @dragstart="dragIndex = j"
                  @dragend="dragIndex = null; overIndex = null"
                >
                  <Icon name="grip" :size="16" />
                </span>
                <span class="font-mono text-[12.5px] font-600 text-graphite-700 tabular-nums">{{ j + 1 }}.</span>
              </div>
            </td>

            <!-- Typ (přípona) -->
            <td class="px-2 py-2.5">
              <span
                class="grid h-8 w-9 place-items-center rounded-md font-mono text-[10px] font-700 uppercase"
                :class="extColor[a.ext] ?? 'bg-steel-200 text-steel-600'"
              >
                {{ a.ext }}
              </span>
            </td>

            <!-- Název (editovatelný) -->
            <td class="px-2 py-2.5">
              <input
                v-model="a.name"
                type="text"
                placeholder="Název souboru"
                class="h-9 w-full min-w-[180px] rounded-md border border-steel-200 px-2.5 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </td>

            <!-- Velikost -->
            <td class="px-2 py-2.5">
              <span class="block font-mono text-[12px] text-steel-500 tabular-nums">{{ a.size }}</span>
            </td>

            <!-- Akce -->
            <td class="px-3 py-2.5">
              <div class="flex items-center justify-end gap-0.5">
                <button
                  v-if="j !== 0"
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-brand-600 transition-colors hover:bg-brand-50"
                  title="Úplně nahoru"
                  @mousedown.stop
                  @click.stop="moveToTop(j)"
                >
                  <Icon name="chevronsUp" :size="15" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800 disabled:cursor-not-allowed disabled:opacity-30"
                  title="O pozici výš"
                  :disabled="j === 0"
                  @mousedown.stop
                  @click.stop="moveUp(j)"
                >
                  <Icon name="chevronUp" :size="16" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800 disabled:cursor-not-allowed disabled:opacity-30"
                  title="O pozici níž"
                  :disabled="j === forLang.length - 1"
                  @mousedown.stop
                  @click.stop="moveDown(j)"
                >
                  <Icon name="chevronDown" :size="16" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
                  title="Upravit v editoru"
                  @mousedown.stop
                >
                  <Icon name="edit" :size="14" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-danger-500 transition-colors hover:bg-danger-500/10"
                  title="Smazat"
                  @mousedown.stop
                  @click.stop="remove(a.id)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dropzone / přidání (prototyp) -->
    <div
      class="mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-steel-300 bg-steel-50 px-6 py-7 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      @dragover.prevent
      @drop.prevent="addMock"
    >
      <div class="mb-2 grid h-11 w-11 place-items-center rounded-full bg-white text-brand-500 shadow-sm">
        <Icon name="paperclip" :size="20" />
      </div>
      <p class="text-[13.5px] font-600 text-graphite-800">Přetáhněte přílohy sem</p>
      <p class="mt-0.5 flex items-center gap-1.5 text-[12px] text-steel-500">
        nebo použijte tlačítko Přidat <span class="field-tag">· {{ lang.toUpperCase() }}</span>
      </p>
      <button
        class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-graphite-900 px-3.5 py-2 text-[12.5px] font-600 text-white transition-colors hover:bg-graphite-800"
        @click="addMock"
      >
        <Icon name="plus" :size="15" /> Přidat přílohu
      </button>
      <p class="mt-2 font-mono text-[10.5px] text-steel-400">PDF, DOCX, XLSX, ZIP · max 20 MB</p>
    </div>
  </div>
</template>
