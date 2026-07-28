<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
</script>

<template>
  <header class="flex h-[64px] items-center gap-4 border-b border-steel-200 bg-white px-6">
    <!-- Vyhledávání = hlavní prvek -->
    <div class="relative w-full max-w-[560px]">
      <Icon name="search" :size="18" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-400" />
      <input
        type="text"
        placeholder="Hledat aktuality, stránky, média, nastavení…"
        class="h-10 w-full rounded-lg border border-steel-200 bg-steel-50 pl-11 pr-16 text-[13.5px] text-graphite-900 placeholder:text-steel-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
      />
      <kbd
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-steel-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-500 text-steel-400"
        >⌘K</kbd
      >
    </div>

    <!-- Pravá strana: notifikace + účet -->
    <div class="ml-auto flex items-center gap-2">
      <TooltipProvider :delay-duration="200">
        <TooltipRoot>
          <TooltipTrigger as-child>
            <button
              class="relative grid h-9 w-9 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-900"
            >
              <Icon name="bell" :size="18" />
              <span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent
              side="bottom"
              :side-offset="6"
              class="rounded-md bg-graphite-900 px-2.5 py-1.5 text-[12px] text-white shadow-lg"
            >
              3 nové poznámky
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>

      <div class="mx-1 h-7 w-px bg-steel-200" />

      <!-- Uživatelský účet (zcela vpravo) -->
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            class="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2.5 outline-none transition-colors hover:bg-steel-100 data-[state=open]:bg-steel-100"
          >
            <span
              class="grid h-8 w-8 place-items-center rounded-full bg-graphite-800 font-display text-[13px] font-700 text-white"
              >JV</span
            >
            <div class="hidden text-left leading-tight sm:block">
              <div class="text-[13px] font-600 text-graphite-900">Jan Voznak</div>
              <div class="font-mono text-[10px] text-steel-500">Administrátor</div>
            </div>
            <Icon name="chevronDown" :size="14" class="text-steel-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            :side-offset="8"
            align="end"
            class="z-50 min-w-56 rounded-xl border border-steel-200 bg-white p-1.5 shadow-2xl"
          >
            <DropdownMenuLabel class="flex items-center gap-2.5 px-2.5 py-2">
              <span class="grid h-9 w-9 place-items-center rounded-full bg-graphite-800 font-display text-[13px] font-700 text-white">JV</span>
              <span class="leading-tight">
                <span class="block text-[13px] font-600 text-graphite-900">Jan Voznak</span>
                <span class="block font-mono text-[10.5px] text-steel-500">jan.voznak@poski.com</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator class="my-1 h-px bg-steel-200" />
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-graphite-800 outline-none data-[highlighted]:bg-steel-100"
            >
              <Icon name="settings" :size="16" class="text-steel-500" /> Můj profil
            </DropdownMenuItem>
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-graphite-800 outline-none data-[highlighted]:bg-steel-100"
            >
              <Icon name="globe" :size="16" class="text-steel-500" /> Zobrazit web
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-1 h-px bg-steel-200" />
            <DropdownMenuItem
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-danger-600 outline-none data-[highlighted]:bg-danger-500/10"
            >
              <Icon name="x" :size="16" /> Odhlásit se
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </header>
</template>
