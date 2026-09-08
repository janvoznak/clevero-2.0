<script setup lang="ts">
/**
 * Správa menu webu.
 *
 * Strom se ovládá stejně jako v modulu Stránky — přetažením nad řádek se
 * položka zařadí před/za, doprostřed se zanoří. Hloubka je omezená na dvě
 * úrovně (`MENU_MAX_DEPTH`), protože hlubší menu se na webu neovládá.
 *
 * Prototyp — pracuje s lokální kopií, „Uložit" je jen potvrzení.
 */
import { computed, reactive, ref } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormSection from '@/components/admin/FormSection.vue'
import LangBar from '@/components/admin/LangBar.vue'
import NavTargetPicker from '@/components/admin/NavTargetPicker.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { MOCK_PAGES } from '@/data/mockPages'
import {
  MOCK_MENUS,
  MOCK_MENU_ITEMS,
  MENU_MAX_DEPTH,
  blankMenuItem,
  navTargetLabel,
  navItemIncomplete,
  navLabel,
  type MenuItem,
} from '@/data/mockNavigation'

/* Lokální kopie (prototyp). */
const items = reactive<MenuItem[]>(JSON.parse(JSON.stringify(MOCK_MENU_ITEMS)))
const menus = MOCK_MENUS
const activeMenu = ref(menus[0]?.id ?? 'main')
const activeLang = ref<LangCode>('cs')

/** Vyplněné mutace napříč položkami — do jazykové lišty. */
const filledLangs = computed(() =>
  LANGS.filter((l) => items.some((i) => i.label[l.code].trim())).map((l) => l.code),
)

function pageTitle(id: string): string {
  return MOCK_PAGES.find((p) => p.id === id)?.title.cs ?? '— smazaná stránka —'
}

/* ---------- Strom ---------- */
interface Row {
  item: MenuItem
  depth: number
  hasKids: boolean
}
function childrenOf(parentId: string | null, menuId: string): MenuItem[] {
  return items
    .filter((i) => i.menuId === menuId && i.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const item of childrenOf(parentId, activeMenu.value)) {
      const kids = childrenOf(item.id, activeMenu.value)
      out.push({ item, depth, hasKids: kids.length > 0 })
      if (kids.length) walk(item.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
})
function incompleteIn(menuId: string): number {
  return items.filter((i) => i.menuId === menuId && navItemIncomplete(i)).length
}

/* ---------- Přetahování (vzor: modul Stránky) ---------- */
const dragId = ref<string | null>(null)
const dropTarget = ref<{ id: string; pos: 'before' | 'after' | 'child' } | null>(null)

function depthOf(id: string): number {
  const it = items.find((i) => i.id === id)
  if (!it) return 0
  return it.parentId ? 1 : 0
}
function isDescendant(rootId: string, targetId: string): boolean {
  if (rootId === targetId) return true
  const t = items.find((i) => i.id === targetId)
  return !!t?.parentId && t.parentId === rootId
}
function resetDnd() {
  dragId.value = null
  dropTarget.value = null
}
function onDragOver(e: DragEvent, targetId: string) {
  const id = dragId.value
  if (!id || isDescendant(id, targetId)) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  let pos: 'before' | 'after' | 'child' = y < rect.height * 0.3 ? 'before' : y > rect.height * 0.7 ? 'after' : 'child'
  // Hlubší než dvě úrovně web neuveze — zanoření pak nenabízíme.
  const dragged = items.find((i) => i.id === id)
  const hasKids = items.some((i) => i.parentId === id)
  if (pos === 'child' && (depthOf(targetId) + 1 >= MENU_MAX_DEPTH || hasKids)) pos = 'after'
  if (!dragged) return
  e.preventDefault()
  dropTarget.value = { id: targetId, pos }
}
function renumber(parentId: string | null) {
  childrenOf(parentId, activeMenu.value).forEach((i, idx) => (i.order = idx + 1))
}
function onDrop() {
  const id = dragId.value
  const info = dropTarget.value
  resetDnd()
  if (!id || !info || id === info.id) return
  const dragged = items.find((i) => i.id === id)
  const target = items.find((i) => i.id === info.id)
  if (!dragged || !target) return
  const oldParent = dragged.parentId
  if (info.pos === 'child') {
    dragged.parentId = target.id
    dragged.order = childrenOf(target.id, activeMenu.value).length + 1
  } else {
    dragged.parentId = target.parentId
    const siblings = childrenOf(target.parentId, activeMenu.value).filter((i) => i.id !== id)
    const idx = siblings.findIndex((s) => s.id === target.id)
    siblings.splice(info.pos === 'before' ? idx : idx + 1, 0, dragged)
    siblings.forEach((s, i) => (s.order = i + 1))
  }
  renumber(oldParent)
  renumber(dragged.parentId)
}
function dropClass(id: string): string {
  if (dropTarget.value?.id !== id) return ''
  if (dropTarget.value.pos === 'child') return 'ring-2 ring-inset ring-brand-400 bg-brand-50/60'
  return dropTarget.value.pos === 'before'
    ? 'shadow-[inset_0_2px_0_0_var(--color-brand-500)]'
    : 'shadow-[inset_0_-2px_0_0_var(--color-brand-500)]'
}

/* ---------- Úpravy položek ---------- */
const openId = ref<string | null>(null)
function toggleOpen(id: string) {
  openId.value = openId.value === id ? null : id
}
function addItem(parentId: string | null = null) {
  const order = childrenOf(parentId, activeMenu.value).length + 1
  const it = blankMenuItem(activeMenu.value, parentId, order)
  items.push(it)
  openId.value = it.id
}
function removeItem(id: string) {
  // Podpoložky se posunou o úroveň výš, ať nezmizí i to, co s nimi nesouvisí.
  items.filter((i) => i.parentId === id).forEach((i) => (i.parentId = items.find((x) => x.id === id)?.parentId ?? null))
  const idx = items.findIndex((i) => i.id === id)
  if (idx >= 0) items.splice(idx, 1)
  if (openId.value === id) openId.value = null
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="px-8 py-6 pb-16">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">navigation</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/navigation</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Navigace</h1>
        <p class="mt-1 max-w-[74ch] text-[13px] text-steel-500">
          Menu webu. Položka drží odkaz na stránku nebo modul, ne hotovou adresu — když se stránce změní URL,
          menu se nerozbije. Pořadí a zanoření se mění přetažením.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <LangBar v-model="activeLang" :filled="filledLangs" class="hidden lg:block" />
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit' }}
        </AppButton>
      </div>
    </div>

    <div class="rounded-lg border border-steel-200 bg-white">
      <TabsRoot v-model="activeMenu">
        <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Nabídky webu">
          <TabsTrigger
            v-for="m in menus"
            :key="m.id"
            :value="m.id"
            class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
          >
            <Icon name="layout" :size="16" />
            {{ m.name }}
            <span
              v-if="incompleteIn(m.id)"
              class="rounded-full bg-amber-500/15 px-1.5 font-mono text-[10px] text-amber-700"
              title="Položky bez cíle"
            >
              {{ incompleteIn(m.id) }}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent v-for="menu in menus" :key="menu.id" :value="menu.id" class="p-5 outline-none">
          <p class="mb-4 text-[12.5px] text-steel-500">{{ menu.purpose }}</p>

          <ul v-if="rows.length" class="space-y-1.5">
            <li
              v-for="r in rows"
              :key="r.item.id"
              draggable="true"
              class="rounded-md border border-steel-200 bg-white transition-all"
              :class="[dragId === r.item.id && 'opacity-40', dropClass(r.item.id)]"
              :style="{ marginLeft: `${r.depth * 28}px` }"
              @dragstart="dragId = r.item.id"
              @dragover="onDragOver($event, r.item.id)"
              @dragleave="dropTarget?.id === r.item.id && (dropTarget = null)"
              @drop.prevent="onDrop"
              @dragend="resetDnd"
            >
              <div class="flex flex-wrap items-center gap-2 px-2.5 py-2">
                <Icon name="grip" :size="15" class="shrink-0 cursor-grab text-steel-400" aria-hidden="true" />

                <button class="min-w-[160px] flex-1 text-left" @click="toggleOpen(r.item.id)">
                  <span class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[13.5px] font-600 text-graphite-900">
                      {{ navLabel(r.item, activeLang) || 'Bez popisku' }}
                    </span>
                    <Icon v-if="r.item.newWindow" name="externalLink" :size="11" class="text-steel-400" />
                    <span
                      v-if="!r.item.label[activeLang].trim() && activeLang !== 'cs'"
                      class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-600 text-amber-600"
                    >
                      chybí překlad
                    </span>
                  </span>
                  <span
                    class="mt-0.5 block truncate text-[11.5px]"
                    :class="navItemIncomplete(r.item) ? 'text-amber-600' : 'text-steel-500'"
                  >
                    <template v-if="navItemIncomplete(r.item)">chybí cíl — odkaz by nikam nevedl</template>
                    <template v-else>→ {{ navTargetLabel(r.item, pageTitle) }}</template>
                  </span>
                </button>

                <button
                  v-if="r.depth === 0"
                  type="button"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700"
                  title="Přidat podpoložku"
                  @click="addItem(r.item.id)"
                >
                  <Icon name="subpage" :size="15" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                  title="Odebrat položku"
                  @click="removeItem(r.item.id)"
                >
                  <Icon name="trash" :size="15" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700"
                  :title="openId === r.item.id ? 'Sbalit' : 'Upravit'"
                  @click="toggleOpen(r.item.id)"
                >
                  <Icon :name="openId === r.item.id ? 'chevronUp' : 'edit'" :size="15" />
                </button>
              </div>

              <!-- Rozbalená úprava položky -->
              <div v-if="openId === r.item.id" class="grid gap-4 border-t border-steel-100 bg-steel-50/50 p-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] font-600 text-graphite-800">
                      Popisek v menu · {{ activeLang.toUpperCase() }}
                    </span>
                    <span class="field-tag">nav-label</span>
                  </label>
                  <input
                    v-model="r.item.label[activeLang]"
                    type="text"
                    placeholder="Např. Kalendář akcí"
                    class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] font-600 text-graphite-800">Kam odkaz vede</span>
                    <span class="field-tag">nav-target</span>
                  </label>
                  <NavTargetPicker v-model="r.item" />
                </div>
              </div>
            </li>
          </ul>

          <div v-else class="rounded-md border border-dashed border-steel-300 px-4 py-10 text-center">
            <Icon name="layout" :size="24" class="mx-auto mb-2 text-steel-300" />
            <p class="text-[13.5px] font-600 text-graphite-800">Tahle nabídka je zatím prázdná</p>
            <p class="mt-1 text-[12.5px] text-steel-500">Přidejte první položku — bez ní se menu na webu nezobrazí.</p>
          </div>

          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
            @click="addItem(null)"
          >
            <Icon name="plus" :size="15" /> Přidat položku do menu
          </button>
        </TabsContent>
      </TabsRoot>
    </div>

    <FormSection class="mt-5" title="Co menu neřídí" icon="help" tag="navigation-note">
      <p class="text-[12.5px] leading-relaxed text-steel-600">
        Přepínač jazyků a vyhledávání jsou pevné prvky hlavičky, nenastavují se tady.
        Informační pruh nad menu má vlastní modul
        <RouterLink :to="{ name: 'infobar' }" class="font-600 text-brand-600 hover:underline">Informační lišta</RouterLink>.
      </p>
    </FormSection>
  </div>
</template>
