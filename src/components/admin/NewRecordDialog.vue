<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { QUICK_CREATE, type QuickCreateAction } from '@/data/quickCreate'

const router = useRouter()
const open = ref(false)

/* Sada = sdílený zdroj QUICK_CREATE (stejné jako „Rychlé akce" na dashboardu). */
function go(m: QuickCreateAction) {
  open.value = false
  router.push({ name: m.route })
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[13px] font-600 text-brand-700 shadow-sm outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Icon name="plus" :size="17" />
        Nový záznam
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/45 backdrop-blur-[2px]" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[600px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-steel-200 bg-white p-7 shadow-2xl focus:outline-none"
      >
        <div class="relative mb-6">
          <DialogTitle class="text-center font-display text-[22px] font-700 tracking-tight text-graphite-900">
            Nový záznam
          </DialogTitle>
          <DialogClose
            class="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-md text-steel-400 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800"
            aria-label="Zavřít"
          >
            <Icon name="x" :size="18" />
          </DialogClose>
        </div>
        <DialogDescription class="sr-only">Vyberte, jaký typ záznamu chcete vytvořit.</DialogDescription>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            v-for="m in QUICK_CREATE"
            :key="m.route"
            class="group flex flex-col items-center justify-center gap-3 rounded-xl border border-steel-200 bg-white p-6 text-center outline-none transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:border-brand-300 focus-visible:shadow-lg"
            @click="go(m)"
          >
            <span class="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              <Icon :name="m.icon" :size="24" />
            </span>
            <span class="text-[14px] font-600 leading-tight text-graphite-800">{{ m.label }}</span>
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
