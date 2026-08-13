<script setup lang="ts">
/**
 * Plovoucí AI asistent administrace (vpravo dole) — PROTOTYP, bez reálné AI.
 *
 * - Launcher = kruhové značkové tlačítko, po kliknutí otevře chat panel.
 * - Panel = hlavička + historie zpráv + „typing" indikátor + rychlé akce + vstup.
 * - Veškerá „inteligence" je fake engine v `@/data/aiAssistant` (pattern-matching
 *   + setTimeout), žádné volání modelu ani API klíč (viz STANDARDY §11a).
 * - Umí založit koncept aktuality a předat ho do editoru (stageNewsDraft → NewsEdit).
 */
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent, TooltipPortal } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TagChip from '@/components/ui/TagChip.vue'
import {
  respondTo,
  stageNewsDraft,
  nextId,
  QUICK_ACTIONS,
  type ChatMessage,
  type NewsDraft,
} from '@/data/aiAssistant'
import { tagColor, categoryColor } from '@/data/mockNews'

const router = useRouter()

const open = ref(false)
const input = ref('')
const thinking = ref(false)
const scroller = ref<HTMLElement | null>(null)

/** Úvodní pozdrav asistenta. */
const messages = ref<ChatMessage[]>([
  {
    id: nextId(),
    role: 'assistant',
    text:
      'Dobrý den, jsem DOVík — asistent administrace Dolních Vítkovic. Poradím vám s ovládáním, nebo za vás ' +
      'rovnou založím aktualitu. Napište dotaz, nebo použijte některou z rychlých akcí níže.',
  },
])

async function scrollToEnd() {
  await nextTick()
  const el = scroller.value
  if (el) el.scrollTop = el.scrollHeight
}

/** Odeslání zprávy (uživatel) → předstíraná odezva asistenta. */
async function send(text: string) {
  const value = text.trim()
  if (!value || thinking.value) return
  messages.value.push({ id: nextId(), role: 'user', text: value })
  input.value = ''
  thinking.value = true
  await scrollToEnd()

  // Prototyp: předstíraná „práce modelu" — žádné síťové volání.
  window.setTimeout(async () => {
    const reply = respondTo(value)
    messages.value.push({ id: nextId(), role: 'assistant', text: reply.text, draft: reply.draft })
    thinking.value = false
    await scrollToEnd()
  }, 850)
}

function onSubmit(e: Event) {
  e.preventDefault()
  send(input.value)
}

/** Koncept z chatu → předání do editoru Aktualit (prototyp předvyplnění polí). */
function openInEditor(draft: NewsDraft) {
  stageNewsDraft(draft)
  open.value = false
  router.push({ name: 'news-new' })
}

function toggle() {
  open.value = !open.value
  if (open.value) scrollToEnd()
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
    <!-- Chat panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-3 scale-95"
    >
      <section
        v-show="open"
        class="flex h-[560px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-3rem)] origin-bottom-right flex-col overflow-hidden rounded-xl border border-steel-200 bg-white shadow-2xl"
        role="dialog"
        aria-label="DOVík — AI asistent"
      >
        <!-- Hlavička -->
        <header class="flex items-center gap-3 bg-brand-500 px-4 py-3 text-white">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">
            <Icon name="sparkles" :size="18" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[14px] font-700 leading-tight">DOVík</span>
            <span class="block text-[11.5px] text-white/80">AI asistent Dolních Vítkovic · prototyp</span>
          </span>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-md text-white/90 outline-none transition-colors hover:bg-white/15 focus-visible:bg-white/15"
            aria-label="Zavřít DOVíka"
            @click="open = false"
          >
            <Icon name="x" :size="18" />
          </button>
        </header>

        <!-- Zprávy -->
        <div ref="scroller" class="scroll-thin flex-1 space-y-3 overflow-y-auto bg-steel-50/60 px-4 py-4">
          <template v-for="m in messages" :key="m.id">
            <!-- Bublina -->
            <div class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
              <div
                class="max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed shadow-sm"
                :class="
                  m.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'border border-steel-200 bg-white text-graphite-800'
                "
              >
                {{ m.text }}
              </div>
            </div>

            <!-- Karta konceptu aktuality (u odpovědi asistenta) -->
            <div v-if="m.draft" class="rounded-lg border border-brand-300 bg-brand-50/70 p-3 shadow-sm">
              <div class="mb-2 flex items-center gap-2">
                <span class="grid h-6 w-6 place-items-center rounded-md bg-brand-500 text-white">
                  <Icon name="news" :size="13" />
                </span>
                <span class="text-[12px] font-700 text-graphite-900">Koncept aktuality</span>
                <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[9.5px] text-brand-600">news</span>
              </div>

              <dl class="space-y-1.5 text-[12px]">
                <div class="flex gap-2">
                  <dt class="w-16 shrink-0 font-mono text-[10px] text-steel-500">Nadpis</dt>
                  <dd class="font-600 text-graphite-900">{{ m.draft.title }}</dd>
                </div>
                <div class="flex gap-2">
                  <dt class="w-16 shrink-0 font-mono text-[10px] text-steel-500">Shrnutí</dt>
                  <dd class="text-graphite-700">{{ m.draft.summary }}</dd>
                </div>
                <div v-if="m.draft.tags.length" class="flex items-center gap-2">
                  <dt class="w-16 shrink-0 font-mono text-[10px] text-steel-500">Štítky</dt>
                  <dd class="flex flex-wrap gap-1">
                    <TagChip v-for="t in m.draft.tags" :key="t" :label="t" :color="tagColor(t)" />
                  </dd>
                </div>
                <div v-if="m.draft.categories.length" class="flex items-center gap-2">
                  <dt class="w-16 shrink-0 font-mono text-[10px] text-steel-500">Kategorie</dt>
                  <dd class="flex flex-wrap gap-1">
                    <TagChip v-for="c in m.draft.categories" :key="c" :label="c" :color="categoryColor(c)" />
                  </dd>
                </div>
              </dl>

              <div class="mt-3">
                <AppButton size="sm" class="w-full" @click="openInEditor(m.draft)">
                  <Icon name="edit" :size="14" />
                  Otevřít v editoru
                </AppButton>
              </div>
            </div>
          </template>

          <!-- Typing indikátor -->
          <div v-if="thinking" class="flex justify-start">
            <div class="flex items-center gap-1 rounded-lg border border-steel-200 bg-white px-3 py-2.5 shadow-sm">
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-400 [animation-delay:-0.2s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-400 [animation-delay:-0.1s]" />
              <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-400" />
            </div>
          </div>
        </div>

        <!-- Rychlé akce -->
        <div class="flex flex-wrap gap-1.5 border-t border-steel-200 bg-white px-3 pt-3">
          <button
            v-for="a in QUICK_ACTIONS"
            :key="a.label"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-steel-200 bg-steel-50 px-2.5 py-1 text-[11.5px] font-600 text-graphite-700 outline-none transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:border-brand-300 disabled:pointer-events-none disabled:opacity-55"
            :disabled="thinking"
            @click="send(a.prompt)"
          >
            <Icon :name="a.icon" :size="13" />
            {{ a.label }}
          </button>
        </div>

        <!-- Vstup -->
        <form class="flex items-center gap-2 border-t border-steel-200 bg-white p-3" @submit="onSubmit">
          <input
            v-model="input"
            type="text"
            placeholder="Napište dotaz nebo úkol…"
            class="h-10 min-w-0 flex-1 rounded-md border border-steel-200 bg-white px-3 text-[13px] text-graphite-900 outline-none placeholder:text-steel-400 focus-visible:border-brand-400"
          />
          <AppButton type="submit" size="md" :disabled="!input.trim() || thinking" aria-label="Odeslat">
            <Icon name="send" :size="16" />
          </AppButton>
        </form>
      </section>
    </Transition>

    <!-- Launcher -->
    <TooltipProvider :delay-duration="300">
      <TooltipRoot>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-lg outline-none transition-all hover:bg-brand-600 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-brand-500/30"
            :aria-label="open ? 'Zavřít DOVíka' : 'Otevřít DOVíka'"
            :aria-expanded="open"
            @click="toggle"
          >
            <Transition
              mode="out-in"
              enter-active-class="transition duration-150"
              enter-from-class="opacity-0 rotate-45"
              leave-active-class="transition duration-100"
              leave-to-class="opacity-0 -rotate-45"
            >
              <Icon v-if="open" name="chevronDown" :size="24" :key="'close'" />
              <Icon v-else name="chat" :size="24" :key="'open'" />
            </Transition>
          </button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            v-if="!open"
            side="left"
            :side-offset="10"
            class="rounded-md bg-graphite-900 px-2.5 py-1.5 text-[12px] font-500 text-white shadow-lg"
          >
            Zeptejte se DOVíka
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  </div>
</template>
