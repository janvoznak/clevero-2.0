<script setup lang="ts">
/**
 * Veřejná stránka „Košík" — krok 2 nákupu.
 * Vlevo se objednávka DOKONČUJE (doručení, platba, kam poslat),
 * vpravo je souhrn objednávky s možností změny — vstupenky se tu
 * znovu nevybírají, jen upravují (krokovač, koš, „Upravit výběr").
 * Prototyp — nic se neodesílá, platba se jen předstírá.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import DovWebFrame from '../../components/public/DovWebFrame.vue'
import CheckoutSteps from '../../components/public/CheckoutSteps.vue'
import SummaryPanel from '../../components/public/SummaryPanel.vue'
import QtyStepper from '../../components/public/QtyStepper.vue'
import PaymentMark from '../../components/public/PaymentMark.vue'
import { czk } from '../../data/mockTicketing'
import {
  cart,
  cartCount,
  cartPersons,
  cartTotal,
  groupTotal,
  removeLine,
  type CartGroup,
} from '../../data/mockCart'

const router = useRouter()

/* ---------- rezervační čas (Colosseum drží položky 10 minut) ---------- */
const secondsLeft = ref(10 * 60)
const timer = window.setInterval(() => {
  if (secondsLeft.value > 0) secondsLeft.value--
}, 1000)
onBeforeUnmount(() => window.clearInterval(timer))
const timeLabel = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

/* ---------- volby ---------- */
/* Značky vykresluje PaymentMark.vue (zjednodušené napodobeniny — před
   ostrým nasazením vyměnit za oficiální brand assety poskytovatelů). */
const PAYMENTS = [
  { id: 'card', name: 'Kartou online', note: 'Visa, Mastercard' },
  { id: 'apple', name: 'Apple Pay', note: 'Platba dotykem' },
  { id: 'google', name: 'Google Pay', note: 'Platba dotykem' },
  { id: 'pluxee', name: 'Pluxee', note: 'Benefitní body' },
  { id: 'edenred', name: 'Edenred', note: 'Benefitní body' },
]
const payment = ref('card')
const couponOpen = ref(false)
const coupon = ref('')

const mode = ref<'guest' | 'account'>('guest')
const form = ref({ firstName: '', lastName: '', email: '', phone: '' })
const newsletter = ref(false)
const terms = ref(false)
const paid = ref(false)

/* ---------- souhrn ---------- */
const total = computed(() => cartTotal())
const persons = computed(() => cartPersons())
const count = computed(() => cartCount())

const missing = computed(() => {
  const out: string[] = []
  if (mode.value === 'guest') {
    if (!form.value.firstName.trim() || !form.value.lastName.trim()) out.push('jméno a příjmení')
    if (!/^\S+@\S+\.\S+$/.test(form.value.email)) out.push('e-mail pro doručení vstupenek')
  } else {
    out.push('přihlášení k účtu')
  }
  if (!terms.value) out.push('souhlas s obchodními podmínkami')
  return out
})

const summaryRows = computed(() => [
  { label: `Vstupenky · ${count.value} ${itemsLabel(count.value)}`, value: czk(total.value) },
  { label: 'Doručení e-mailem', value: 'Zdarma' },
])

/** Panel v kroku 2 — položky objednávky. */
const itemsPanelClass =
  'flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:scroll-thin lg:pr-1'

const payLabel = computed(() => {
  const method = PAYMENTS.find((p) => p.id === payment.value)
  if (payment.value === 'card') return `Zaplatit ${czk(total.value)}`
  return `Zaplatit přes ${method?.name}`
})

/** Položka = vstupenka nebo rodinný balíček (ten pokrývá víc osob). */
function itemsLabel(n: number) {
  return n === 1 ? 'položka' : n < 5 ? 'položky' : 'položek'
}

function pay() {
  // prototyp — žádná platební brána
  paid.value = true
}

/** Zpět do výběru — s klíčem skupiny, aby se výběr UPRAVIL, ne zdvojil. */
function editGroup(group: CartGroup) {
  router.push({
    name: 'public-ticket-picker',
    params: { id: group.itemId },
    query: { edit: group.key },
  })
}

function addMore() {
  router.push({ name: 'public-ticket-picker', params: { id: 'svet-techniky' } })
}

const fieldClass =
  'h-12 w-full border border-dov-coal/20 bg-white px-3.5 font-dov-sans text-[14.5px] text-dov-coal outline-none transition-colors placeholder:text-dov-mutedfg/60 hover:border-dov-coal/45 focus:border-dov-coal'
const labelClass =
  'font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-dov-mutedfg'
</script>

<template>
  <div>
    <!-- Přepínač ukázek — jen pro prototyp. -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 bg-graphite-900 px-5 py-2 text-white">
      <span class="font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
        Prototyp · krok 2
      </span>
      <button
        type="button"
        class="px-2 py-1 text-[12px] text-white/55 transition-colors hover:text-white"
        @click="addMore"
      >
        ← Zpět na výběr vstupenek
      </button>
    </div>

    <DovWebFrame :cart-count="count">
      <div class="mx-auto max-w-[1400px] px-5 pb-28 lg:pb-16">
        <!-- Cesta + kroky nákupu -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-dov-line py-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg transition-colors hover:text-dov-coal"
            @click="addMore"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Zpět na výběr vstupenek
          </button>
          <CheckoutSteps :current="2" />
        </div>

        <div class="pt-8 lg:pt-10">
          <h1 class="font-dov-display text-[clamp(2rem,4.5vw,3.4rem)] font-black uppercase leading-[0.95] text-dov-coal">
            Košík
          </h1>
          <p v-if="count" class="mt-3 font-dov-sans text-[15px] text-dov-mutedfg">
            Zkontrolujte vstupenky, vyberte způsob platby a řekněte nám, kam je poslat.
          </p>
        </div>

        <div v-if="!count" class="mt-8 border border-dashed border-dov-line bg-white px-6 py-14 text-center">
          <p class="font-dov-display text-[24px] font-bold uppercase text-dov-coal">Košík je prázdný</p>
          <p class="mt-2 font-dov-sans text-[13.5px] text-dov-mutedfg">
            Vyberte si vstupenky a vraťte se sem k dokončení nákupu.
          </p>
          <button
            type="button"
            class="mt-5 bg-dov-rust px-5 py-3 font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-dov-signal hover:text-dov-coal"
            @click="addMore"
          >
            Vybrat vstupenky
          </button>
        </div>

        <div
          v-else
          class="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10"
        >
          <!-- ============ pravý sloupec: objednávka (na mobilu první) ============ -->
          <aside class="min-w-0 lg:col-start-2 lg:row-start-1">
            <div
              class="flex flex-col border border-dov-line bg-white p-4 sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]"
            >
              <SummaryPanel
                label="Vaše objednávka"
                :rows="summaryRows"
                :total="total"
                :persons="persons"
                :timer="timeLabel"
                :cta="payLabel"
                :disabled="missing.length > 0"
                :hint="missing.length ? `K dokončení chybí: ${missing.join(', ')}.` : undefined"
                :notes="['Platba probíhá v zabezpečené bráně, kartu neukládáme.', 'Vstupenky držíme rezervované po dobu odpočtu.']"
                cta-desktop-only
                @submit="pay"
              >
                <template #items>
                  <div :class="itemsPanelClass">
                    <div v-for="group in cart.groups" :key="group.key" class="border border-dov-line">
                      <!-- termín + odkaz na úpravu výběru (krok 1) -->
                      <div class="flex items-start gap-2 border-b border-dov-line bg-dov-cream/60 px-3 py-2.5">
                        <div class="min-w-0 flex-1">
                          <p class="line-clamp-2 font-dov-mono text-[9.5px] font-semibold uppercase leading-snug tracking-[0.18em] text-dov-mutedfg">
                            {{ group.venue }} · {{ group.title }}
                          </p>
                          <p class="mt-0.5 font-dov-display text-[15px] font-bold uppercase leading-tight text-dov-coal">
                            {{ group.dateLabel }}
                          </p>
                          <p v-if="group.extraMeta.length" class="mt-0.5 font-dov-sans text-[11.5px] leading-tight text-dov-mutedfg">
                            {{ group.extraMeta.join(' · ') }}
                          </p>
                        </div>
                        <button
                          type="button"
                          class="shrink-0 font-dov-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-dov-rust underline underline-offset-4 transition-opacity hover:opacity-70"
                          @click="editGroup(group)"
                        >
                          Upravit
                        </button>
                      </div>

                      <ul class="divide-y divide-dov-line">
                        <li v-for="line in group.lines" :key="line.id" class="px-3 py-2.5">
                          <div class="flex items-baseline justify-between gap-2">
                            <span class="min-w-0 flex-1 font-dov-sans text-[13px] font-semibold leading-tight text-dov-coal">
                              {{ line.label }}
                              <span v-if="line.sub" class="mt-0.5 block font-normal text-[11.5px] leading-tight text-dov-mutedfg">
                                {{ line.sub }}
                              </span>
                            </span>
                            <span class="shrink-0 font-dov-sans text-[13px] font-semibold tabular-nums text-dov-coal">
                              {{ line.unitPrice === 0 ? 'Zdarma' : czk(line.unitPrice * line.qty) }}
                            </span>
                          </div>
                          <div class="mt-2 flex items-center gap-2.5">
                            <QtyStepper v-model="line.qty" :min="1" size="sm" :label="`Počet ${line.label}`" />
                            <span class="font-dov-sans text-[11.5px] text-dov-mutedfg">
                              {{ line.unitPrice === 0 ? '0 Kč' : czk(line.unitPrice) }} / ks
                            </span>
                            <button
                              type="button"
                              class="ml-auto grid size-7 shrink-0 place-items-center border border-transparent text-dov-mutedfg transition-colors hover:border-dov-line hover:text-dov-rust"
                              :aria-label="`Odebrat ${line.label}`"
                              @click="removeLine(group, line.id)"
                            >
                              <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      </ul>

                      <p class="flex items-baseline justify-between gap-2 border-t border-dashed border-dov-line px-3 py-2 font-dov-sans text-[12px] text-dov-mutedfg">
                        <span>Za tento termín</span>
                        <span class="font-semibold tabular-nums text-dov-coal">{{ czk(groupTotal(group)) }}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="mt-3 inline-flex w-full items-center justify-center gap-2 border border-dashed border-dov-coal/25 px-3 py-2.5 font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-dov-coal transition-colors hover:border-dov-coal"
                    @click="addMore"
                  >
                    <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Přidat další vstupenky
                  </button>
                </template>
              </SummaryPanel>
            </div>
          </aside>

          <!-- ============ levý sloupec: dokončení objednávky ============ -->
          <div class="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
            <!-- 1 · Doručení -->
            <section>
              <div class="mb-3 flex items-center gap-3">
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-dov-coal font-dov-display text-[13px] font-bold text-white">1</span>
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Doručení
                </h2>
                <span class="h-px flex-1 bg-dov-line" aria-hidden="true" />
              </div>
              <div class="flex items-center gap-4 border border-dov-coal/70 bg-white px-4 py-4 sm:px-5">
                <span class="grid size-10 shrink-0 place-items-center bg-dov-signal text-dov-coal">
                  <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 5h18v14H3zM3 7l9 6 9-6" />
                  </svg>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-dov-display text-[18px] font-bold uppercase leading-none text-dov-coal">
                    Elektronicky e-mailem
                  </span>
                  <span class="mt-1 block font-dov-sans text-[12.5px] text-dov-mutedfg">
                    E-vstupenku dostanete hned po zaplacení. U vstupu stačí načíst čárový kód z mobilu.
                  </span>
                </span>
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-dov-moss text-white">
                  <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              </div>
            </section>

            <!-- 2 · Platba -->
            <section>
              <div class="mb-3 flex items-center gap-3">
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-dov-coal font-dov-display text-[13px] font-bold text-white">2</span>
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Způsob úhrady
                </h2>
                <span class="h-px flex-1 bg-dov-line" aria-hidden="true" />
              </div>

              <div class="grid gap-2 sm:grid-cols-2">
                <button
                  v-for="method in PAYMENTS"
                  :key="method.id"
                  type="button"
                  class="flex items-center gap-3 border bg-white px-4 py-3.5 text-left transition-colors"
                  :class="payment === method.id ? 'border-dov-coal/70' : 'border-dov-line hover:border-dov-coal/40'"
                  :aria-pressed="payment === method.id"
                  @click="payment = method.id"
                >
                  <PaymentMark :brand="method.id" />
                  <span class="min-w-0 flex-1">
                    <span class="block font-dov-sans text-[13.5px] font-semibold leading-tight text-dov-coal">
                      {{ method.name }}
                    </span>
                    <span class="block font-dov-sans text-[11.5px] text-dov-mutedfg">{{ method.note }}</span>
                  </span>
                  <span
                    class="grid size-5 shrink-0 place-items-center rounded-full border"
                    :class="payment === method.id ? 'border-dov-moss bg-dov-moss text-white' : 'border-dov-coal/25'"
                  >
                    <svg v-if="payment === method.id" viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                </button>
              </div>

              <!-- Slevový kód — v Colosseu pole natvrdo, tady schované pod odkazem -->
              <div class="mt-3">
                <button
                  v-if="!couponOpen"
                  type="button"
                  class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-rust underline underline-offset-4 transition-opacity hover:opacity-70"
                  @click="couponOpen = true"
                >
                  Mám slevový kupón
                </button>
                <div v-else class="flex flex-wrap items-center gap-2">
                  <input v-model="coupon" type="text" placeholder="Kód kupónu" :class="[fieldClass, 'max-w-[240px]']" />
                  <button
                    type="button"
                    class="h-12 border border-dov-coal px-5 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-coal transition-colors hover:bg-dov-coal hover:text-white"
                  >
                    Uplatnit
                  </button>
                </div>
              </div>
            </section>

            <!-- 3 · Kontaktní údaje -->
            <section>
              <div class="mb-3 flex flex-wrap items-center gap-3">
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-dov-coal font-dov-display text-[13px] font-bold text-white">3</span>
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Kam vstupenky poslat
                </h2>
                <span class="hidden h-px flex-1 bg-dov-line sm:block" aria-hidden="true" />
                <button
                  type="button"
                  class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-rust underline underline-offset-4 transition-opacity hover:opacity-70"
                  @click="mode = mode === 'guest' ? 'account' : 'guest'"
                >
                  {{ mode === 'guest' ? 'Mám účet DOV — přihlásit se' : 'Nakoupit bez registrace' }}
                </button>
              </div>

              <!-- Nákup bez registrace (výchozí cesta) -->
              <div v-if="mode === 'guest'" class="border border-dov-line bg-white">
                <p class="flex items-start gap-3 border-b border-dov-line px-4 py-3.5 font-dov-sans text-[12.5px] leading-relaxed text-dov-mutedfg sm:px-5">
                  <svg viewBox="0 0 24 24" class="mt-[1px] size-4 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 5h18v14H3zM3 7l9 6 9-6" />
                  </svg>
                  Vstupenky pošleme na uvedený e-mail během pár minut. Telefon použijeme jen v případě
                  změny termínu.
                </p>

                <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">Jméno <span class="text-dov-rust">*</span></span>
                    <input v-model="form.firstName" type="text" autocomplete="given-name" placeholder="Jan" :class="fieldClass" />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">Příjmení <span class="text-dov-rust">*</span></span>
                    <input v-model="form.lastName" type="text" autocomplete="family-name" placeholder="Novák" :class="fieldClass" />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">E-mail <span class="text-dov-rust">*</span></span>
                    <input v-model="form.email" type="email" autocomplete="email" placeholder="jan.novak@email.cz" :class="fieldClass" />
                    <span class="font-dov-sans text-[11.5px] text-dov-mutedfg">Sem dorazí e-vstupenky.</span>
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">Telefon <span class="normal-case tracking-normal text-dov-mutedfg/70">(nepovinné)</span></span>
                    <input v-model="form.phone" type="tel" autocomplete="tel" placeholder="+420 777 123 456" :class="fieldClass" />
                  </label>
                </div>

                <div class="flex flex-col gap-3 border-t border-dov-line bg-dov-cream/60 px-4 py-4 sm:px-5">
                  <label class="flex items-start gap-3 font-dov-sans text-[12.5px] leading-snug text-dov-coal-soft">
                    <input v-model="terms" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-[#B4532A]" />
                    <span>
                      Souhlasím s <a href="#" class="underline underline-offset-2">obchodními podmínkami</a>
                      a beru na vědomí <a href="#" class="underline underline-offset-2">zpracování osobních údajů</a>.
                      <span class="text-dov-rust">*</span>
                    </span>
                  </label>
                  <label class="flex items-start gap-3 font-dov-sans text-[12.5px] leading-snug text-dov-coal-soft">
                    <input v-model="newsletter" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-[#B4532A]" />
                    <span>Chci e-mailem dostávat novinky a program akcí v Dolních Vítkovicích.</span>
                  </label>
                </div>
              </div>

              <!-- Přihlášení do účtu -->
              <div v-else class="border border-dov-line bg-white">
                <p class="flex items-start gap-3 border-b border-dov-line px-4 py-3.5 font-dov-sans text-[12.5px] leading-relaxed text-dov-mutedfg sm:px-5">
                  <svg viewBox="0 0 24 24" class="mt-[1px] size-4 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0" />
                  </svg>
                  Po přihlášení se údaje předvyplní a vstupenky najdete i v historii nákupů.
                </p>
                <div class="grid gap-4 p-4 sm:max-w-md sm:p-5">
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">E-mail</span>
                    <input type="email" autocomplete="email" :class="fieldClass" />
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span :class="labelClass">Heslo</span>
                    <input type="password" autocomplete="current-password" :class="fieldClass" />
                  </label>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="button"
                      class="h-12 bg-dov-coal px-5 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-dov-rust"
                    >
                      Přihlásit se
                    </button>
                    <a href="#" class="font-dov-sans text-[12.5px] text-dov-mutedfg underline underline-offset-2 hover:text-dov-coal">
                      Zapomenuté heslo
                    </a>
                    <a href="#" class="font-dov-sans text-[12.5px] text-dov-mutedfg underline underline-offset-2 hover:text-dov-coal">
                      Založit účet
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- Mobil: lepicí lišta s celkovou cenou -->
      <div
        v-if="count"
        class="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-dov-coal/15 bg-white px-5 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden"
      >
        <span class="flex-1">
          <span class="block font-dov-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg">
            <template v-if="missing.length">Chybí: {{ missing[0] }}</template>
            <template v-else>Celkem · rezervace {{ timeLabel }}</template>
          </span>
          <span class="block font-dov-display text-[24px] font-black leading-tight text-dov-coal">
            {{ czk(total) }}
          </span>
        </span>
        <button
          type="button"
          class="bg-dov-rust px-5 py-3.5 font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-white disabled:bg-dov-coal/15 disabled:text-dov-coal/40"
          :disabled="missing.length > 0"
          @click="pay"
        >
          Zaplatit
        </button>
      </div>

      <!-- Potvrzení (prototyp — žádná platební brána) -->
      <div v-if="paid" class="fixed inset-0 z-50 grid place-items-center bg-dov-coal/60 px-5" role="dialog" aria-modal="true">
        <div class="w-full max-w-md border border-dov-line bg-white p-7 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-dov-moss text-white">
            <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h2 class="mt-4 font-dov-display text-[24px] font-black uppercase leading-none text-dov-coal">
            Přesměrování na platbu
          </h2>
          <p class="mt-3 font-dov-sans text-[13.5px] leading-relaxed text-dov-mutedfg">
            Objednávka za {{ czk(total) }} by pokračovala do platební brány Colossea
            a e-vstupenky by dorazily na {{ form.email || 'zadaný e-mail' }}.
            V prototypu se nikam neodesílá.
          </p>
          <button
            type="button"
            class="mt-5 w-full border border-dov-coal/25 px-5 py-3 font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-dov-coal transition-colors hover:bg-dov-coal hover:text-white"
            @click="paid = false"
          >
            Zpět do košíku
          </button>
        </div>
      </div>
    </DovWebFrame>
  </div>
</template>
