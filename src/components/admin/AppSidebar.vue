<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import NewRecordDialog from '@/components/admin/NewRecordDialog.vue'

const route = useRoute()
const router = useRouter()

interface NavLink {
  label: string
  to: string
  match?: string
}
interface LinkEntry extends NavLink {
  kind: 'link'
  icon: string
}
interface GroupEntry {
  kind: 'group'
  key: string
  label: string
  icon: string
  children: NavLink[]
  /** Nechat pořadí položek dle definice (neřadit abecedně). */
  keepOrder?: boolean
  /** Cíl při kliknutí na hlavičku skupiny (rovnou navede, ne jen rozbalí). */
  to?: string
}
type NavEntry = LinkEntry | GroupEntry

/* Jednotný seznam navigace v požadovaném pořadí (hlavní moduly + skupiny).
   Zatím funkční jen Aktuality; ostatní jsou placeholder. */
const nav: NavEntry[] = [
  { kind: 'link', label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' },
  {
    kind: 'group',
    key: 'kalendar',
    label: 'Kalendář akcí',
    icon: 'calendar',
    keepOrder: true,
    to: '/admin/events',
    children: [
      { label: 'Přehled akcí', to: '/admin/events', match: '/admin/events' },
      { label: 'Nová akce', to: '/admin/events/new', match: '/admin/events/new' },
    ],
  },
  {
    kind: 'group',
    key: 'areal',
    label: 'Areál',
    icon: 'map',
    keepOrder: true,
    to: '/admin/area/list',
    children: [
      { label: 'Přehled', to: '/admin/area/list', match: '/admin/area' },
      { label: 'Nová budova', to: '/admin/area/new', match: '/admin/area/new' },
    ],
  },
  {
    kind: 'group',
    key: 'prohlidky',
    label: 'Prohlídky',
    icon: 'ticket',
    keepOrder: true,
    to: '/admin/tours',
    children: [
      { label: 'Prohlídky', to: '/admin/tours', match: '/admin/tours' },
      { label: 'Nová prohlídka', to: '/admin/tours/new', match: '/admin/tours/new' },
      { label: 'Vstupenky', to: '/admin/tickets', match: '/admin/tickets' },
    ],
  },
  {
    kind: 'group',
    key: 'obsah',
    label: 'Obsah',
    icon: 'layers',
    children: [
      { label: 'Aktuality', to: '/admin/news/list', match: '/admin/news' },
      { label: 'Stránky', to: '/admin/pages/list', match: '/admin/pages' },
      { label: 'Pop-up', to: '/admin/popups/list', match: '/admin/popups' },
      { label: 'FAQ', to: '/admin/faq' },
      { label: 'Galerie', to: '/admin/galleries' },
      { label: 'Slider', to: '/admin/slider' },
      { label: 'Navigace', to: '/admin/navigation' },
      { label: 'Kontakty', to: '/admin/contacts' },
      { label: 'Patička', to: '/admin/footer' },
    ],
  },
  {
    kind: 'group',
    key: 'education',
    label: 'Vzdělávací programy',
    icon: 'education',
    keepOrder: true,
    to: '/admin/education',
    children: [
      { label: 'Přehled', to: '/admin/education', match: '/admin/education' },
      { label: 'Nový program', to: '/admin/education/new', match: '/admin/education/new' },
    ],
  },
  { kind: 'link', label: 'Dotační projekty', icon: 'grant', to: '/admin/grants' },
  {
    kind: 'group',
    key: 'produkty',
    label: 'Produkty',
    icon: 'box',
    keepOrder: true,
    to: '/admin/products',
    children: [
      { label: 'Produkty', to: '/admin/products', match: '/admin/products' },
      { label: 'Nový produkt', to: '/admin/products/new', match: '/admin/products/new' },
      { label: 'Kategorie', to: '/admin/product-categories', match: '/admin/product-categories' },
    ],
  },
  {
    kind: 'group',
    key: 'kariera',
    label: 'Kariéra',
    icon: 'briefcase',
    children: [
      { label: 'Uchazeči', to: '/admin/careers/applicants' },
      { label: 'Pozice', to: '/admin/careers/positions' },
    ],
  },
  {
    kind: 'group',
    key: 'integrace',
    label: 'Integrace',
    icon: 'integration',
    children: [
      { label: 'Colosseum', to: '/admin/integrations/colosseum' },
      { label: 'Ecomail', to: '/admin/integrations/ecomail' },
    ],
  },
  {
    kind: 'group',
    key: 'nastaveni',
    label: 'Nastavení',
    icon: 'settings',
    children: [{ label: 'Uživatelé', to: '/admin/users' }],
  },
  { kind: 'link', label: 'Nápověda', icon: 'help', to: '/admin/help' },
]

/** Moduly uvnitř skupin řadíme abecedně (česky). */
nav.forEach((e) => {
  if (e.kind === 'group' && !e.keepOrder) e.children.sort((a, b) => a.label.localeCompare(b.label, 'cs'))
})

function isActive(link: NavLink): boolean {
  return route.path.startsWith(link.match ?? link.to)
}
function groupActive(g: GroupEntry): boolean {
  return g.children.some(isActive)
}
/** Klik na hlavičku skupiny s `to` rovnou navede na cíl a skupinu nechá rozbalenou
 *  (uživatel nemusí klikat dvakrát). Bez `to` se skupina jen přepíná (accordion). */
function onGroupTrigger(g: GroupEntry) {
  if (!g.to) return
  router.push(g.to).catch(() => {})
  nextTick(() => (openGroup.value = g.key))
}
/** Aktivní je jen dítě s nejdelší shodou cesty (aby na /events/new nesvítil i „Přehled"). */
function childActive(g: GroupEntry, c: NavLink): boolean {
  const matches = g.children.filter((x) => route.path.startsWith(x.match ?? x.to))
  if (!matches.length) return false
  const best = matches.reduce((a, b) => ((b.match ?? b.to).length > (a.match ?? a.to).length ? b : a))
  return (c.match ?? c.to) === (best.match ?? best.to)
}

/** Klíč skupiny obsahující aktivní stránku (jinak '' = nic otevřené). */
function activeGroupKey(): string {
  const g = nav.find((e): e is GroupEntry => e.kind === 'group' && e.children.some(isActive))
  return g?.key ?? ''
}

/** Naráz otevřené jen JEDNO zanoření (accordion single).
 *  Otevřená je skupina s aktivní stránkou; u samostatných modulů nic. */
const openGroup = ref<string>(activeGroupKey())
watch(
  () => route.path,
  () => {
    openGroup.value = activeGroupKey()
  },
)

/* Weby dostupné pod tímto účtem (prototyp — multi-tenant). */
const workspaces = [
  { id: 'dov', name: 'Dolní Vítkovice', domain: 'dolnivitkovice.cz' },
  { id: 'gong', name: 'Multifunkční aula Gong', domain: 'auladov.cz' },
  { id: 'u6', name: 'Svět techniky', domain: 'stcostrava.cz' },
]
const activeWorkspace = ref(workspaces[0])

const linkBase =
  'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] font-500 outline-none transition-colors'
</script>

<template>
  <aside
    class="flex h-full w-[256px] flex-col text-white"
    style="background: linear-gradient(180deg, var(--color-sidebar-top) 0%, var(--color-sidebar-bottom) 100%)"
  >
    <!-- Brand — bílé logo přímo na oranžové (bez plotny) -->
    <div class="flex h-[64px] items-center border-b border-white/10 px-5">
      <img src="/clevero-logo-white.png" alt="Clevero platforma" class="h-[50px] w-auto max-w-full" />
    </div>

    <!-- Workspace / klientský web — Reka DropdownMenu -->
    <div class="border-b border-white/10 px-3 py-3">
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            class="flex w-full items-center gap-2.5 rounded-lg bg-black/15 px-2.5 py-2 text-left outline-none transition-colors hover:bg-black/25 data-[state=open]:bg-black/25"
          >
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/15 text-white">
              <Icon name="globe" :size="15" />
            </span>
            <span class="min-w-0 flex-1 leading-tight">
              <span class="block truncate text-[12.5px] font-600 text-white">{{ activeWorkspace.name }}</span>
              <span class="block truncate font-mono text-[10px] text-white/60">{{ activeWorkspace.domain }}</span>
            </span>
            <Icon name="chevronDown" :size="14" class="shrink-0 text-white/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            side="right"
            align="start"
            :side-offset="10"
            class="z-50 min-w-64 rounded-xl border border-steel-200 bg-white p-1.5 shadow-2xl"
          >
            <DropdownMenuLabel class="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-400">
              Přepnout web
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="w in workspaces"
              :key="w.id"
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 outline-none data-[highlighted]:bg-steel-100"
              @select="activeWorkspace = w"
            >
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded font-display text-[13px] font-700"
                :class="w.id === activeWorkspace.id ? 'bg-brand-500 text-white' : 'bg-steel-100 text-steel-500'"
              >
                {{ w.name.charAt(0) }}
              </span>
              <span class="min-w-0 flex-1 leading-tight">
                <span class="block truncate text-[13px] font-600 text-graphite-900">{{ w.name }}</span>
                <span class="block truncate font-mono text-[10.5px] text-steel-500">{{ w.domain }}</span>
              </span>
              <Icon v-if="w.id === activeWorkspace.id" name="check" :size="16" class="shrink-0 text-brand-500" />
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-1 h-px bg-steel-200" />
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-graphite-700 outline-none data-[highlighted]:bg-steel-100"
            >
              <Icon name="settings" :size="16" class="text-steel-500" /> Spravovat weby
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>

    <!-- Nav — strom s jedním zanořením (Reka Accordion), single-open -->
    <nav class="scroll-thin flex-1 overflow-y-auto px-3 py-4">
      <AccordionRoot v-model="openGroup" type="single" collapsible class="space-y-1">
        <template v-for="entry in nav" :key="entry.kind === 'group' ? entry.key : entry.label">
          <!-- Hlavní modul (bez zanoření) -->
          <RouterLink
            v-if="entry.kind === 'link'"
            :to="entry.to"
            :class="[linkBase, isActive(entry) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white']"
          >
            <span v-if="isActive(entry)" class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-white" />
            <Icon :name="entry.icon" :size="18" :class="isActive(entry) ? 'text-white' : 'text-white/70 group-hover:text-white'" />
            {{ entry.label }}
          </RouterLink>

          <!-- Rozbalovací skupina -->
          <AccordionItem v-else :value="entry.key">
            <AccordionHeader as="div">
              <AccordionTrigger
                class="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] font-600 outline-none transition-colors hover:bg-white/10"
                :class="groupActive(entry) ? 'text-white' : 'text-white/85 hover:text-white'"
                @click="onGroupTrigger(entry)"
              >
                <Icon :name="entry.icon" :size="18" class="text-white/70 group-hover:text-white" />
                <span class="flex-1 text-left">{{ entry.label }}</span>
                <Icon
                  name="chevronDown"
                  :size="15"
                  class="text-white/50 transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <ul class="my-0.5 ml-[19px] space-y-0.5 border-l border-white/10 pl-2">
                <li v-for="c in entry.children" :key="c.label">
                  <RouterLink
                    :to="c.to"
                    class="group relative flex items-center rounded-md py-1.5 pl-3 pr-2.5 text-[13px] font-500 transition-colors"
                    :class="childActive(entry, c) ? 'bg-white/15 font-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'"
                  >
                    {{ c.label }}
                  </RouterLink>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </template>
      </AccordionRoot>
    </nav>

    <!-- Rychlé vytvoření nového záznamu -->
    <div class="border-t border-white/10 p-3">
      <NewRecordDialog />
    </div>
  </aside>
</template>
