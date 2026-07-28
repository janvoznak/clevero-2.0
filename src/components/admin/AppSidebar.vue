<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
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

interface NavLink {
  label: string
  to: string
  match?: string
}
interface NavGroup {
  key: string
  label: string
  icon: string
  children: NavLink[]
}

/* Samostatné položky (bez zanoření). */
const dashboard: NavLink & { icon: string } = { label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' }
const help: NavLink & { icon: string } = { label: 'Nápověda', icon: 'help', to: '/admin/help' }

/* Rozbalovací skupiny (jedno zanoření). Zatím funkční jen Aktuality. */
const groups: NavGroup[] = [
  {
    key: 'produkty',
    label: 'Produkty',
    icon: 'box',
    children: [
      { label: 'Kategorie', to: '/admin/product-categories' },
      { label: 'Produkty', to: '/admin/products' },
    ],
  },
  {
    key: 'obsah',
    label: 'Obsah',
    icon: 'layers',
    children: [
      { label: 'Blog', to: '/admin/blog' },
      { label: 'Aktuality', to: '/admin/news/list', match: '/admin/news' },
      { label: 'Stránky', to: '/admin/pages' },
      { label: 'Pop-up', to: '/admin/popups' },
      { label: 'FAQ', to: '/admin/faq' },
      { label: 'Slider', to: '/admin/slider' },
      { label: 'Navigace', to: '/admin/navigation' },
      { label: 'Kontakty', to: '/admin/contacts' },
      { label: 'Patička', to: '/admin/footer' },
    ],
  },
  {
    key: 'nastaveni',
    label: 'Nastavení',
    icon: 'settings',
    children: [{ label: 'Uživatelé', to: '/admin/users' }],
  },
]

/** Moduly uvnitř skupin řadíme abecedně (česky). */
groups.forEach((g) => g.children.sort((a, b) => a.label.localeCompare(b.label, 'cs')))

function isActive(link: NavLink): boolean {
  return route.path.startsWith(link.match ?? link.to)
}
function groupActive(g: NavGroup): boolean {
  return g.children.some(isActive)
}

/** Naráz může být otevřené jen JEDNO zanoření (accordion single).
 *  Výchozí = skupina s aktivní položkou, jinak Obsah. */
const openGroup = ref<string>(groups.find(groupActive)?.key ?? 'obsah')

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

    <!-- Nav — strom s jedním zanořením (Reka Accordion) -->
    <nav class="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <!-- Dashboard (samostatně) -->
      <RouterLink
        :to="dashboard.to"
        :class="[linkBase, isActive(dashboard) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white']"
      >
        <span v-if="isActive(dashboard)" class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-white" />
        <Icon :name="dashboard.icon" :size="18" :class="isActive(dashboard) ? 'text-white' : 'text-white/70 group-hover:text-white'" />
        {{ dashboard.label }}
      </RouterLink>

      <!-- Rozbalovací skupiny -->
      <AccordionRoot v-model="openGroup" type="single" collapsible class="space-y-1">
        <AccordionItem v-for="g in groups" :key="g.key" :value="g.key">
          <AccordionHeader as="div">
            <AccordionTrigger
              class="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] font-600 outline-none transition-colors hover:bg-white/10"
              :class="groupActive(g) ? 'text-white' : 'text-white/85 hover:text-white'"
            >
              <Icon :name="g.icon" :size="18" class="text-white/70 group-hover:text-white" />
              <span class="flex-1 text-left">{{ g.label }}</span>
              <Icon
                name="chevronDown"
                :size="15"
                class="text-white/50 transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent>
            <ul class="my-0.5 ml-[19px] space-y-0.5 border-l border-white/10 pl-2">
              <li v-for="c in g.children" :key="c.label">
                <RouterLink
                  :to="c.to"
                  class="group relative flex items-center rounded-md py-1.5 pl-3 pr-2.5 text-[13px] font-500 transition-colors"
                  :class="isActive(c) ? 'bg-white/15 font-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'"
                >
                  {{ c.label }}
                </RouterLink>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>

      <!-- Nápověda (samostatně) -->
      <RouterLink
        :to="help.to"
        :class="[linkBase, isActive(help) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white']"
      >
        <span v-if="isActive(help)" class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-white" />
        <Icon :name="help.icon" :size="18" :class="isActive(help) ? 'text-white' : 'text-white/70 group-hover:text-white'" />
        {{ help.label }}
      </RouterLink>
    </nav>

    <!-- Rychlé vytvoření nového záznamu -->
    <div class="border-t border-white/10 p-3">
      <NewRecordDialog />
    </div>
  </aside>
</template>
