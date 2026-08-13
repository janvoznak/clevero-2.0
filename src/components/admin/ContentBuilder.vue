<script setup lang="ts">
/**
 * Content builder (prototyp — vizuální zástupka, viz princip 0).
 * Skládání stránky z hotových „grafických vzorů" (jako ContentBuilder.js):
 *  - prázdné plátno s výzvou k vložení obsahu,
 *  - plovoucí panel „Grafické vzory" (vlevo) s kategoriemi a náhledy vzorů,
 *  - přidávání, přetahování (reorder) a mazání vzorů,
 *  - u textových bloků DOVík rozepíše hrubé zadání do souvislých vět.
 * Náhled řídí sdílená komponenta GraphicPattern (princip 0b).
 */
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import GraphicPattern from '@/components/admin/GraphicPattern.vue'
import DovikAvatar from '@/components/admin/DovikAvatar.vue'
import { GRAPHIC_PATTERN_GROUPS, type ContentBlock } from '@/data/mockPages'

const model = defineModel<ContentBlock[]>({ default: () => [] })

/* ---------- DOVík u textového bloku: rozepsat hrubé zadání do vět (prototyp) ----------
   Klient si bloky skládá sám; u textových bloků pomůže DOVík text rozepsat do
   souvislých vět. Žádná reálná AI — deterministické rozvedení (viz STANDARDY §11a). */
const TEXT_KINDS = new Set(['paragraph', 'lead', 'h1-text', 'h2-text', 'text-image', 'quote'])
function isTextKind(kind: string): boolean {
  return TEXT_KINDS.has(kind)
}

const aiOpenId = ref('')
const aiPrompt = ref('')
const aiBusy = ref(false)
function openAi(id: string) {
  aiOpenId.value = id
  aiPrompt.value = ''
}
function expandBrief(brief: string, kind: string): string {
  const topic = (brief.trim() || 'Dolní Vítkovice').replace(/\s+/g, ' ')
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1)
  if (kind === 'quote') return `${cap} — místo, kde industriální minulost potkává živou současnost.`
  if (kind === 'lead')
    return `${cap}. Zveme vás do areálu Dolních Vítkovic, kde se snoubí jedinečná industriální architektura s pestrým programem pro celou rodinu.`
  return (
    `${cap}. Areál Dolních Vítkovic patří k unikátním průmyslovým památkám Evropy — bývalý těžní a hutní ` +
    `komplex se proměnil v živé centrum kultury, vzdělávání a zábavy. Přijďte se přesvědčit, že z industriální ` +
    `minulosti může vyrůst živé místo pro budoucnost.`
  )
}
function aiWrite(block: ContentBlock) {
  if (aiBusy.value) return
  aiBusy.value = true
  const brief = aiPrompt.value
  window.setTimeout(() => {
    const text = expandBrief(brief, block.kind)
    model.value = model.value.map((b) => (b.id === block.id ? { ...b, text } : b))
    aiBusy.value = false
    aiOpenId.value = ''
    aiPrompt.value = ''
  }, 1200)
}

/* ---------- Paleta vzorů (plovoucí panel) ---------- */
const paletteOpen = ref(true)
const activeCat = ref(GRAPHIC_PATTERN_GROUPS[0].category)
const catOptions = GRAPHIC_PATTERN_GROUPS.map((g) => ({ value: g.category, label: g.category }))
const activePatterns = computed(
  () => GRAPHIC_PATTERN_GROUPS.find((g) => g.category === activeCat.value)?.patterns ?? [],
)

let seq = 0
function addPattern(kind: string) {
  seq += 1
  model.value = [...model.value, { id: `cb-${seq}-${model.value.length}-${kind}`, kind }]
}
function remove(id: string) {
  model.value = model.value.filter((b) => b.id !== id)
}

/* ---------- Plovoucí panel — přetažení za hlavičku ---------- */
const pos = ref({ x: 0, y: 48 })
let startDrag = { mx: 0, my: 0, px: 0, py: 0 }
function onHeaderDown(e: PointerEvent) {
  startDrag = { mx: e.clientX, my: e.clientY, px: pos.value.x, py: pos.value.y }
  window.addEventListener('pointermove', onHeaderMove)
  window.addEventListener('pointerup', onHeaderUp)
}
function onHeaderMove(e: PointerEvent) {
  pos.value = { x: startDrag.px + (e.clientX - startDrag.mx), y: startDrag.py + (e.clientY - startDrag.my) }
}
function onHeaderUp() {
  window.removeEventListener('pointermove', onHeaderMove)
  window.removeEventListener('pointerup', onHeaderUp)
}

/* ---------- Drag & drop reorder vzorů na plátně ---------- */
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
  const list = [...model.value]
  const fi = list.findIndex((b) => b.id === from)
  const ti = list.findIndex((b) => b.id === id)
  if (fi < 0 || ti < 0) return resetDnd()
  const [moved] = list.splice(fi, 1)
  list.splice(ti, 0, moved)
  model.value = list
  resetDnd()
}
function resetDnd() {
  dragId.value = null
  overId.value = null
}
</script>

<template>
  <div class="relative">
    <!-- Ovládací lišta -->
    <div class="mb-2.5 flex items-center gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-600 outline-none transition-colors"
        :class="
          paletteOpen
            ? 'border-brand-500 bg-brand-50 text-brand-600'
            : 'border-steel-300 text-graphite-700 hover:border-brand-400 hover:text-brand-600'
        "
        @click="paletteOpen = !paletteOpen"
      >
        <Icon name="dashboard" :size="16" />
        Zobrazit grafické vzory
      </button>

      <span class="text-[12px] text-steel-400">
        {{ model.length }} {{ model.length === 1 ? 'prvek' : model.length >= 2 && model.length <= 4 ? 'prvky' : 'prvků' }} na stránce
      </span>
      <span class="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-steel-400">
        <Icon name="sparkles" :size="13" class="text-brand-500" /> U textových bloků najeď myší → DOVík text rozepíše
      </span>
    </div>

    <!-- Plátno stránky -->
    <div class="relative rounded-lg border border-steel-200 bg-white p-4 shadow-sm">
      <!-- Poskládaný obsah -->
      <div v-if="model.length" class="mx-auto max-w-2xl">
        <div
          v-for="block in model"
          :key="block.id"
          draggable="true"
          class="group relative rounded-md transition-all"
          :class="
            overId === block.id && dragId !== block.id
              ? 'ring-2 ring-brand-400/40'
              : dragId === block.id
                ? 'opacity-40'
                : ''
          "
          @dragstart="onDragStart(block.id)"
          @dragover.prevent="onDragOver(block.id)"
          @drop.prevent="onDrop(block.id)"
          @dragend="resetDnd"
        >
          <!-- Ovládání vzoru (hover) -->
          <div
            class="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-steel-200 bg-white/95 p-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
            :class="aiOpenId === block.id ? 'opacity-100' : ''"
          >
            <!-- DOVík: rozepsat text bloku (jen textové vzory) -->
            <PopoverRoot
              v-if="isTextKind(block.kind)"
              :open="aiOpenId === block.id"
              @update:open="(v) => (v ? openAi(block.id) : (aiOpenId = ''))"
            >
              <PopoverTrigger as-child>
                <button
                  type="button"
                  draggable="false"
                  class="grid h-6 w-6 place-items-center overflow-hidden rounded outline-none ring-brand-200 transition-shadow hover:ring-1 data-[state=open]:ring-1"
                  title="Rozepsat s DOVíkem"
                  @dragstart.prevent
                >
                  <DovikAvatar :size="20" />
                </button>
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverContent
                  side="left"
                  align="start"
                  :side-offset="10"
                  class="z-50 w-80 rounded-xl border border-steel-200 bg-white p-4 shadow-2xl"
                >
                  <div class="mb-2 flex items-center gap-2">
                    <span class="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-brand-100"><DovikAvatar :size="30" /></span>
                    <div>
                      <p class="text-[13px] font-700 text-graphite-900">Rozepsat s DOVíkem</p>
                      <p class="text-[10.5px] text-steel-500">Z hrubého zadání sepíše souvislý text.</p>
                    </div>
                  </div>
                  <textarea
                    v-model="aiPrompt"
                    rows="3"
                    placeholder="Hrubé zadání — o čem má blok být, klidně jen v bodech…"
                    class="mb-2.5 w-full resize-y rounded-md border border-steel-200 px-3 py-2 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                  <div class="flex justify-end gap-2">
                    <PopoverClose as-child><AppButton variant="secondary" size="sm">Zavřít</AppButton></PopoverClose>
                    <AppButton variant="primary" size="sm" :disabled="aiBusy" @click="aiWrite(block)">
                      <Icon name="sparkles" :size="14" :class="aiBusy && 'animate-pulse'" />
                      {{ aiBusy ? 'Píšu…' : 'Rozepsat' }}
                    </AppButton>
                  </div>
                </PopoverContent>
              </PopoverPortal>
            </PopoverRoot>

            <span
              class="grid h-6 w-6 cursor-grab place-items-center rounded text-steel-400 hover:text-graphite-700"
              title="Přetáhnout"
            >
              <Icon name="grip" :size="14" />
            </span>
            <button
              type="button"
              class="grid h-6 w-6 place-items-center rounded text-steel-400 outline-none hover:bg-danger-500/10 hover:text-danger-500"
              title="Odebrat"
              @click="remove(block.id)"
            >
              <Icon name="trash" :size="14" />
            </button>
          </div>

          <!-- Náhled vzoru -->
          <div class="rounded-md px-4 py-4 transition-colors group-hover:bg-steel-50/50">
            <GraphicPattern :kind="block.kind" :text="block.text" />
          </div>
        </div>
      </div>

      <!-- Prázdný stav -->
      <button
        v-else
        type="button"
        class="grid min-h-[360px] w-full place-items-center rounded-md border-2 border-dashed border-steel-300 text-center outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/30"
        @click="paletteOpen = true"
      >
        <span>
          <span class="block text-[13px] font-700 uppercase tracking-wide text-brand-500">
            Není vložen žádný obsah
          </span>
          <span class="mt-1.5 block text-[13.5px] text-steel-500">
            + Klikněte pro přidání obsahu
          </span>
        </span>
      </button>
    </div>

    <!-- Plovoucí panel „Grafické vzory" -->
    <div
      v-if="paletteOpen"
      class="absolute z-30 w-[264px] overflow-hidden rounded-xl border border-steel-200 bg-white shadow-2xl"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    >
      <!-- Hlavička (přetažitelná) -->
      <div
        class="flex cursor-move items-center gap-2 border-b border-steel-100 bg-steel-50/70 px-3 py-2.5 select-none"
        @pointerdown="onHeaderDown"
      >
        <Icon name="layout" :size="15" class="text-steel-400" />
        <p class="text-[13px] font-700 text-graphite-900">Grafické vzory</p>
        <button
          type="button"
          class="ml-auto grid h-6 w-6 place-items-center rounded text-steel-400 outline-none hover:bg-steel-200/70 hover:text-graphite-700"
          title="Zavřít"
          @click="paletteOpen = false"
        >
          <Icon name="x" :size="15" />
        </button>
      </div>

      <!-- Výběr kategorie -->
      <div class="border-b border-steel-100 p-2.5">
        <AppSelect v-model="activeCat" :options="catOptions" class="!w-full" />
      </div>

      <!-- Náhledy vzorů -->
      <div class="scroll-thin max-h-[420px] space-y-2.5 overflow-y-auto p-2.5">
        <button
          v-for="p in activePatterns"
          :key="p.kind"
          type="button"
          :title="p.name"
          :aria-label="`Přidat vzor: ${p.name}`"
          class="group relative block w-full overflow-hidden rounded-lg border border-steel-200 bg-white outline-none transition-all hover:border-brand-400 hover:shadow-md"
          @click="addPattern(p.kind)"
        >
          <!-- Zmenšený náhled (zoom) -->
          <div class="pointer-events-none" :style="{ zoom: 0.35 }">
            <div class="w-[660px] bg-white p-5">
              <GraphicPattern :kind="p.kind" />
            </div>
          </div>
          <!-- Overlay při najetí -->
          <div
            class="absolute inset-0 grid place-items-center bg-brand-500/0 opacity-0 transition-all group-hover:bg-brand-500/10 group-hover:opacity-100"
          >
            <span class="inline-flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1 text-[11.5px] font-600 text-white shadow">
              <Icon name="plus" :size="13" /> {{ p.name }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
