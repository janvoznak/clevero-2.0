<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
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

const router = useRouter()
const open = ref(false)

interface RecordType {
  label: string
  icon: string
  color: string
  to: RouteLocationRaw
}

/** Typy záznamů = obsahové moduly. Zatím funkční jen Aktualita. */
const RECORD_TYPES: RecordType[] = [
  { label: 'Aktualita', icon: 'news', color: '#ee703d', to: { name: 'news-new' } },
  { label: 'Blog', icon: 'blog', color: '#3b6fb0', to: '/admin/blog' },
  { label: 'Stránka', icon: 'page', color: '#7b5ea7', to: '/admin/pages' },
  { label: 'FAQ', icon: 'faq', color: '#d98a15', to: '/admin/faq' },
  { label: 'Galerie', icon: 'gallery', color: '#15916a', to: '/admin/galleries' },
  { label: 'Reference', icon: 'reference', color: '#0e8a8a', to: '/admin/references' },
]

function go(m: RecordType) {
  open.value = false
  router.push(m.to)
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
            v-for="m in RECORD_TYPES"
            :key="m.label"
            class="group flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center outline-none transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg"
            :style="{ backgroundColor: m.color + '0f', borderColor: m.color + '2e' }"
            @click="go(m)"
          >
            <Icon :name="m.icon" :size="26" :style="{ color: m.color }" />
            <span class="text-[14px] font-600 leading-tight text-graphite-800">{{ m.label }}</span>
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
