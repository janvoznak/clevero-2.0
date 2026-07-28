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
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to?: string
  match?: string
  soon?: boolean
}
interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Přehled',
    items: [{ label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' }],
  },
  {
    label: 'Obsah',
    items: [
      { label: 'Aktuality', icon: 'news', to: '/admin/news/list', match: '/admin/news' },
      { label: 'Blog', icon: 'blog', to: '/admin/blog' },
      { label: 'Stránky', icon: 'page', to: '/admin/pages' },
      { label: 'FAQ', icon: 'faq', to: '/admin/faq' },
      { label: 'Galerie', icon: 'gallery', to: '/admin/galleries' },
      { label: 'Reference', icon: 'reference', to: '/admin/references' },
    ],
  },
  {
    label: 'Systém',
    items: [
      { label: 'Média', icon: 'media', to: '/admin/media' },
      { label: 'Nastavení', icon: 'settings', to: '/admin/settings' },
    ],
  },
]

function isActive(item: NavItem): boolean {
  const path = item.match ?? item.to ?? ''
  return route.path.startsWith(path)
}

const collapsed = ref(false)

/* Weby dostupné pod tímto účtem (prototyp — multi-tenant). */
const workspaces = [
  { id: 'dov', name: 'Dolní Vítkovice', domain: 'dolnivitkovice.cz' },
  { id: 'gong', name: 'Multifunkční aula Gong', domain: 'auladov.cz' },
  { id: 'u6', name: 'Svět techniky', domain: 'stcostrava.cz' },
]
const activeWorkspace = ref(workspaces[0])
</script>

<template>
  <aside
    class="flex h-full flex-col text-white transition-[width] duration-200"
    :class="collapsed ? 'w-[72px]' : 'w-[256px]'"
    style="background: linear-gradient(180deg, var(--color-sidebar-top) 0%, var(--color-sidebar-bottom) 100%)"
  >
    <!-- Brand — bílé logo přímo na oranžové (bez plotny) -->
    <div class="flex h-[64px] items-center border-b border-white/10" :class="collapsed ? 'justify-center px-2' : 'px-5'">
      <img
        v-if="!collapsed"
        src="/clevero-logo-white.png"
        alt="Clevero platforma"
        class="h-[50px] w-auto max-w-full"
      />
      <img v-else src="/clevero-mark-white.png" alt="Clevero" class="h-10 w-10" />
    </div>

    <!-- Workspace / klientský web — Reka DropdownMenu -->
    <div class="border-b border-white/10 px-3 py-3">
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            v-if="!collapsed"
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
          <button
            v-else
            :title="activeWorkspace.name"
            class="grid h-8 w-8 place-items-center rounded bg-white/15 text-white outline-none transition-colors hover:bg-white/25"
          >
            <Icon name="globe" :size="16" />
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

    <!-- Nav -->
    <nav class="scroll-thin flex-1 overflow-y-auto px-3 py-4">
      <div v-for="group in groups" :key="group.label" class="mb-5">
        <div
          v-if="!collapsed"
          class="mb-1.5 px-2 font-mono text-[10px] font-500 uppercase tracking-[0.14em] text-white/45"
        >
          {{ group.label }}
        </div>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.label">
            <RouterLink
              :to="item.to ?? '#'"
              :title="collapsed ? item.label : undefined"
              class="group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] font-500 transition-colors"
              :class="[
                isActive(item) ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-0',
              ]"
            >
              <!-- akcentní rail (světlý, aby vynikl na oranžové) -->
              <span
                v-if="isActive(item) && !collapsed"
                class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-white"
              />
              <Icon :name="item.icon" :size="18" :class="isActive(item) ? 'text-white' : 'text-white/70 group-hover:text-white'" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Collapse toggle -->
    <button
      class="flex h-11 items-center gap-3 border-t border-white/10 px-4 text-[12.5px] text-white/65 transition-colors hover:text-white"
      :class="collapsed && 'justify-center px-0'"
      @click="collapsed = !collapsed"
    >
      <Icon :name="collapsed ? 'chevronRight' : 'chevronLeft'" :size="18" />
      <span v-if="!collapsed">Sbalit panel</span>
    </button>
  </aside>
</template>
