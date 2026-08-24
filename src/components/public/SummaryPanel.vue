<script setup lang="ts">
/**
 * Boční panel s cenou — JEDINÁ komponenta pro oba kroky nákupu,
 * aby krok 1 a krok 2 vypadaly a fungovaly stejně:
 *
 * — krok 1 „Váš výběr": vlevo se vybírá, vpravo se skládá seznam
 *   (`lines`), protože jinde v kroku 1 seznam vybraných vstupenek není;
 * — krok 2 „Vaše objednávka": vlevo se objednávka dokončuje (doručení,
 *   platba, údaje), takže obsah košíku žije TADY — přes slot `items`,
 *   kde má každá položka i krokovač a odkaz na úpravu výběru.
 */
import { czk, type OrderLine } from '../../data/mockTicketing'

defineProps<{
  /** Popisek panelu — „Váš výběr" / „Rekapitulace ceny". */
  label: string
  /** Rozpis vybraných vstupenek (krok 1). */
  lines?: OrderLine[]
  /** Souhrnné řádky (krok 2) — „Vstupenky 13 položek", „Doručení zdarma". */
  rows?: { label: string; value: string; strong?: boolean }[]
  total: number
  persons: number
  /** Text hlavního tlačítka. */
  cta: string
  disabled?: boolean
  /** Věta pod tlačítkem, když akci něco blokuje. */
  hint?: string
  /** Odpočet rezervace (krok 2). */
  timer?: string
  /** Uklidňující poznámky pod tlačítkem. */
  notes?: string[]
  /** Text prázdného stavu (krok 1). */
  emptyText?: string
  /**
   * Skryje tlačítko (a poznámky) pod `lg` — pro košík, kde na mobilu
   * tutéž akci nese lepicí lišta u spodní hrany a druhé CTA by mátlo.
   */
  ctaDesktopOnly?: boolean
}>()

defineEmits<{ submit: [] }>()

function personsLabel(n: number) {
  return n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osob'
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex shrink-0 items-center gap-3">
      <p class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-dov-mutedfg">
        {{ label }}
      </p>
      <span
        v-if="timer"
        class="ml-auto inline-flex items-center gap-1.5 bg-dov-signal/30 px-2 py-1 font-dov-mono text-[11px] font-semibold tabular-nums text-dov-coal"
        :title="'Vstupenky držíme rezervované'"
      >
        <svg viewBox="0 0 24 24" class="size-3.5 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3.5 2" />
        </svg>
        {{ timer }}
      </span>
    </div>

    <!-- Krok 2 — obsah košíku (editovatelný) -->
    <div v-if="$slots.items" class="mt-4 flex min-h-0 flex-1 flex-col">
      <slot name="items" />
    </div>

    <!-- Krok 1 — rozpis výběru -->
    <ul v-else-if="lines && lines.length" class="mt-4 flex flex-col divide-y divide-dov-line">
      <li v-for="line in lines" :key="line.id" class="flex items-start gap-3 py-2.5 first:pt-0">
        <span class="mt-[1px] min-w-6 font-dov-display text-[15px] font-bold tabular-nums text-dov-rust">
          {{ line.qty }}×
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-dov-sans text-[13.5px] font-semibold leading-tight text-dov-coal">
            {{ line.label }}
          </span>
          <span v-if="line.sub" class="mt-0.5 block font-dov-sans text-[12px] leading-tight text-dov-mutedfg">
            {{ line.sub }}
          </span>
        </span>
        <span class="shrink-0 font-dov-sans text-[13.5px] font-semibold tabular-nums text-dov-coal">
          {{ line.total === 0 ? 'Zdarma' : czk(line.total) }}
        </span>
      </li>
    </ul>

    <p
      v-else-if="emptyText"
      class="mt-4 border border-dashed border-dov-line px-4 py-5 text-center font-dov-sans text-[13px] leading-relaxed text-dov-mutedfg"
    >
      {{ emptyText }}
    </p>

    <!-- Krok 2 — souhrnné řádky místo opakovaného seznamu -->
    <ul v-if="rows && rows.length" class="mt-4 flex flex-col gap-2.5">
      <li
        v-for="row in rows"
        :key="row.label"
        class="flex items-baseline justify-between gap-3 font-dov-sans text-[13px]"
      >
        <span class="text-dov-mutedfg">{{ row.label }}</span>
        <span class="shrink-0 font-semibold tabular-nums text-dov-coal">{{ row.value }}</span>
      </li>
    </ul>

    <div class="mt-4 shrink-0 border-t-2 border-dov-coal pt-3">
      <div class="flex items-baseline justify-between gap-3">
        <span class="font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-dov-coal">
          Celkem
        </span>
        <span
          class="font-dov-display text-[30px] font-black leading-none tabular-nums text-dov-coal"
          aria-live="polite"
        >
          {{ czk(total) }}
        </span>
      </div>
      <p class="mt-1.5 text-right font-dov-sans text-[12px] text-dov-mutedfg">
        <template v-if="persons > 0">{{ persons }} {{ personsLabel(persons) }} · včetně DPH</template>
        <template v-else>Vyberte vstupenky vlevo</template>
      </p>
    </div>

    <button
      type="button"
      :class="ctaDesktopOnly && 'hidden lg:inline-flex'"
      class="mt-4 inline-flex w-full items-center justify-center gap-2.5 bg-dov-rust px-5 py-4 font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-dov-signal hover:text-dov-coal disabled:cursor-not-allowed disabled:bg-dov-coal/15 disabled:text-dov-coal/40"
      :disabled="disabled"
      @click="$emit('submit')"
    >
      {{ cta }}
      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>

    <p
      v-if="hint"
      class="mt-2.5 font-dov-sans text-[12px] leading-snug text-dov-mutedfg"
      :class="ctaDesktopOnly && 'hidden lg:block'"
    >
      {{ hint }}
    </p>

    <ul
      v-else-if="notes && notes.length"
      class="mt-4 flex flex-col gap-2"
      :class="ctaDesktopOnly && 'hidden lg:flex'"
    >
      <li
        v-for="note in notes"
        :key="note"
        class="flex items-start gap-2 font-dov-sans text-[12px] leading-snug text-dov-mutedfg"
      >
        <svg viewBox="0 0 24 24" class="mt-[2px] size-3.5 shrink-0 text-dov-moss" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {{ note }}
      </li>
    </ul>
  </div>
</template>
