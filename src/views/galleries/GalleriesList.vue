<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { MOCK_SECTIONS, galleriesInSection, type GallerySection, type Gallery } from '@/data/mockGalleries'
import { LANGS } from '@/data/types'
import type { ML, LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'

const router = useRouter()
const rows = ref<GallerySection[]>([...MOCK_SECTIONS])

/* Zanoření galerií pod sekce (vizuální strom jako Prohlídky) —
   defaultně rozbalené, aby byly galerie rovnou vidět. */
const expanded = ref<Set<string>>(new Set(MOCK_SECTIONS.map((s) => s.id)))
function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

/** Stav publikace jedné jazykové mutace — sdílené 3-stavové čipy (jako Prohlídky).
    Generické: bere ML pole (název sekce / galerie) + explicitní seznam. */
function lps(field: ML, publishedLangs: LangCode[] | undefined, code: LangCode) {
  return langPublishState(code, filledLangsOf(field), publishedLangs)
}
function goNew() {
  router.push({ name: 'gallery-section-new' })
}
function goEdit(id: string) {
  router.push({ name: 'gallery-section-edit', params: { id } })
}
function goGallery(id: string) {
  router.push({ name: 'gallery-edit', params: { id } })
}
const rowActions = [
  { key: 'edit', label: 'Otevřít sekci', icon: 'edit' },
  { key: 'delete', label: 'Smazat sekci', icon: 'trash', danger: true },
]
const deleteTarget = ref<GallerySection | null>(null)
function onRowAction(key: string, s: GallerySection) {
  if (key === 'edit') goEdit(s.id)
  else if (key === 'delete') deleteTarget.value = s
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((s) => s.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}

/* ---------- Galerie v řádku: stejné kebab ⋮ menu jako u sekcí ---------- */
const deletedGalleryIds = ref<Set<string>>(new Set())
function galleriesIn(s: GallerySection): Gallery[] {
  return galleriesInSection(s.id).filter((g) => !deletedGalleryIds.value.has(g.id))
}
const galleryRowActions = [
  { key: 'edit', label: 'Otevřít galerii', icon: 'edit' },
  { key: 'delete', label: 'Smazat galerii', icon: 'trash', danger: true },
]
const deleteGalleryTarget = ref<Gallery | null>(null)
function onGalleryAction(key: string, g: Gallery) {
  if (key === 'edit') goGallery(g.id)
  else if (key === 'delete') deleteGalleryTarget.value = g
}
function confirmDeleteGallery() {
  if (deleteGalleryTarget.value) {
    const next = new Set(deletedGalleryIds.value)
    next.add(deleteGalleryTarget.value.id)
    deletedGalleryIds.value = next
  }
  deleteGalleryTarget.value = null
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">galleries</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/galleries</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Galerie</h1>      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nová sekce
      </AppButton>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Sekce / galerie</th>
            <th class="w-28 px-2 py-3 font-600">Galerie</th>
            <th class="w-28 px-2 py-3 font-600">Fotky</th>
            <th class="w-52 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="s in rows" :key="s.id">
            <!-- Sekce (skupinová hlavička — výrazně odlišená od galerií) -->
            <tr class="group border-b border-steel-200 bg-steel-50/70 transition-colors hover:bg-steel-100/70">
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-2">
                  <button
                    class="grid h-6 w-6 shrink-0 place-items-center rounded text-steel-500 transition-colors hover:bg-steel-200 hover:text-graphite-700"
                    :title="expanded.has(s.id) ? 'Sbalit galerie' : 'Rozbalit galerie'"
                    @click="toggle(s.id)"
                  >
                    <Icon name="chevronDown" :size="16" class="transition-transform" :class="!expanded.has(s.id) && '-rotate-90'" />
                  </button>
                  <button class="flex items-center gap-3 text-left" @click="goEdit(s.id)">
                    <span class="grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-200 text-steel-400 ring-1 ring-steel-300/60">
                      <img v-if="s.cover" :src="s.cover" :alt="s.name.cs" class="h-full w-full object-cover" />
                      <Icon v-else name="gallery" :size="17" />
                    </span>
                    <span class="min-w-0">
                      <span class="block font-mono text-[10px] uppercase tracking-wider text-steel-400">Sekce</span>
                      <span class="block truncate font-display text-[15.5px] font-700 text-graphite-900 group-hover:text-brand-600">{{ s.name.cs }}</span>
                    </span>
                  </button>
                </div>
              </td>
              <td class="px-2 py-3 align-middle">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-600 text-graphite-700 ring-1 ring-steel-200">
                  <Icon name="gallery" :size="13" class="text-steel-400" /> {{ galleriesIn(s).length }}
                </span>
              </td>
              <td class="px-2 py-3 align-middle" />
              <td class="px-2 py-3 align-middle">
                <div class="flex flex-nowrap items-center gap-1">
                  <span
                    v-for="l in LANGS"
                    :key="l.code"
                    class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                    :class="LANG_PUBLISH_META[lps(s.name, s.publishedLangs, l.code)].chip"
                    :title="`${l.label} — ${LANG_PUBLISH_META[lps(s.name, s.publishedLangs, l.code)].label}`"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(s.name, s.publishedLangs, l.code)].dot" />
                    {{ l.code }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-3 align-middle">
                <div class="flex justify-end">
                  <RowActionsMenu :actions="rowActions" label="Akce se sekcí" @select="(key) => onRowAction(key, s)" />
                </div>
              </td>
            </tr>

            <!-- Zanořené galerie sekce -->
            <template v-if="expanded.has(s.id)">
              <tr
                v-for="g in galleriesIn(s)"
                :key="g.id"
                class="group border-b border-steel-100 bg-white transition-colors last:border-0 hover:bg-steel-50/60"
              >
                <td class="py-2.5 pl-4 pr-2 align-middle">
                  <!-- Odsazení + svislá vodicí linka stromu → jasně „patří pod sekci" -->
                  <div class="flex items-stretch">
                    <span class="ml-3 w-6 shrink-0 border-l-2 border-steel-200" aria-hidden="true" />
                    <button class="flex items-center gap-2.5 text-left" @click="goGallery(g.id)">
                      <span class="h-8 w-11 shrink-0 overflow-hidden rounded-md bg-steel-100 text-steel-400">
                        <img v-if="g.photos[0]" :src="g.photos[0].src" :alt="g.name.cs" class="h-full w-full object-cover" />
                        <span v-else class="grid h-full w-full place-items-center"><Icon name="image" :size="14" /></span>
                      </span>
                      <span class="min-w-0">
                        <span class="block truncate text-[13.5px] font-500 text-graphite-800 group-hover:text-brand-600">{{ g.name.cs || 'Bez názvu' }}</span>
                        <span v-if="!g.published" class="text-[11px] text-steel-400">Koncept</span>
                      </span>
                    </button>
                  </div>
                </td>
                <td class="px-2 py-2.5" />
                <td class="px-2 py-2.5 align-middle">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-steel-100 px-2 py-0.5 text-[11px] font-600 text-graphite-700">
                    <Icon name="image" :size="12" class="text-steel-400" /> {{ g.photos.length }}
                  </span>
                </td>
                <td class="px-2 py-2.5 align-middle">
                  <div class="flex flex-nowrap items-center gap-1">
                    <span
                      v-for="l in LANGS"
                      :key="l.code"
                      class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                      :class="LANG_PUBLISH_META[lps(g.name, g.publishedLangs, l.code)].chip"
                      :title="`${l.label} — ${LANG_PUBLISH_META[lps(g.name, g.publishedLangs, l.code)].label}`"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(g.name, g.publishedLangs, l.code)].dot" />
                      {{ l.code }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2.5 align-middle">
                  <div class="flex justify-end">
                    <RowActionsMenu :actions="galleryRowActions" label="Akce s galerií" @select="(key) => onGalleryAction(key, g)" />
                  </div>
                </td>
              </tr>
              <tr v-if="galleriesIn(s).length === 0" class="border-b border-steel-100 bg-white">
                <td colspan="5" class="py-2.5 pl-[68px] pr-4 text-[12px] text-steel-400">Zatím žádné galerie v této sekci.</td>
              </tr>
            </template>
          </template>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="gallery" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné sekce</p>
              <p class="mt-1 text-[13px] text-steel-500">Vytvořte první sekci galerie.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete dialog — sekce -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat sekci?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.name.cs }}"</span> včetně galerií v ní. Tato akce je nevratná.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Delete dialog — galerie -->
    <DialogRoot :open="!!deleteGalleryTarget" @update:open="(v) => !v && (deleteGalleryTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat galerii?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteGalleryTarget?.name.cs }}"</span>. Tato akce je nevratná.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteGalleryTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDeleteGallery">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
