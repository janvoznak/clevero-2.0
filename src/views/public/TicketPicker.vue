<script setup lang="ts">
/**
 * Veřejná stránka „Výběr vstupenek" — krok 1 nákupu.
 * Vlevo se vybírá, vpravo se skládá „Váš výběr" (tady jinde seznam není).
 * Po potvrzení výběr putuje do košíku (krok 2).
 *
 * S parametrem `?edit=<klíč skupiny>` se stránka otevře jako ÚPRAVA už
 * nakoupeného termínu: počty se předvyplní z košíku a potvrzením se
 * skupina přepíše — nevznikne druhá, vizuálně shodná položka.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DovWebFrame from '../../components/public/DovWebFrame.vue'
import CheckoutSteps from '../../components/public/CheckoutSteps.vue'
import TicketRow from '../../components/public/TicketRow.vue'
import FamilyPackageCard from '../../components/public/FamilyPackageCard.vue'
import SummaryPanel from '../../components/public/SummaryPanel.vue'
import { TICKETING_ITEMS, czk, ticketingItem, type OrderLine } from '../../data/mockTicketing'
import {
  addToCart,
  cartCount,
  findGroup,
  replaceGroup,
  type CartGroup,
  type CartLine,
} from '../../data/mockCart'

const route = useRoute()
const router = useRouter()

const item = computed(() => ticketingItem(String(route.params.id)) ?? TICKETING_ITEMS[0])

/* ---------- stav výběru ---------- */
const counts = reactive<Record<string, number>>({})
const pkgQty = reactive<Record<string, number>>({})
const pkgChildren = reactive<Record<string, number>>({})
const infoOpen = ref(false)

/** Klíč upravované skupiny z URL (`?edit=`), pokud jsme přišli z košíku. */
const editKey = computed(() => (route.query.edit ? String(route.query.edit) : ''))
const editing = computed(() => Boolean(editKey.value && findGroup(editKey.value)))

function resetSelection() {
  Object.keys(counts).forEach((k) => delete counts[k])
  Object.keys(pkgQty).forEach((k) => delete pkgQty[k])
  Object.keys(pkgChildren).forEach((k) => delete pkgChildren[k])
  item.value.tiers.forEach((t) => (counts[t.id] = 0))
  item.value.packages.forEach((p) => {
    pkgQty[p.id] = 0
    pkgChildren[p.id] = p.childrenMax
  })
  infoOpen.value = false

  // Úprava termínu z košíku — předvyplnit, co už je koupené.
  const group = editKey.value ? findGroup(editKey.value) : undefined
  if (!group) return
  for (const line of group.lines) {
    if (line.id in counts) counts[line.id] = line.qty
    if (line.id in pkgQty) {
      pkgQty[line.id] = line.qty
      if (line.packageChildren) pkgChildren[line.id] = line.packageChildren
    }
  }
}
watch([item, editKey], resetSelection, { immediate: true })

/* ---------- odvozené hodnoty ---------- */
const basicTiers = computed(() => item.value.tiers.filter((t) => t.group === 'basic'))
const reducedTiers = computed(() => item.value.tiers.filter((t) => t.group === 'reduced'))

const lines = computed<OrderLine[]>(() => {
  const out: OrderLine[] = []
  for (const t of item.value.tiers) {
    const qty = counts[t.id] ?? 0
    if (qty > 0) {
      out.push({
        id: t.id,
        label: t.name,
        sub: t.note,
        qty,
        unitPrice: t.price,
        total: t.price * qty,
        persons: qty,
      })
    }
  }
  for (const p of item.value.packages) {
    const qty = pkgQty[p.id] ?? 0
    if (qty > 0) {
      const kids = pkgChildren[p.id] ?? p.childrenMax
      out.push({
        id: p.id,
        label: p.name,
        sub: `${p.adults}× dospělý + ${kids}× ${p.childrenLabel}`,
        qty,
        unitPrice: p.price,
        total: p.price * qty,
        persons: qty * (p.adults + kids),
      })
    }
  }
  return out
})

const total = computed(() => lines.value.reduce((sum, l) => sum + l.total, 0))
const persons = computed(() => lines.value.reduce((sum, l) => sum + l.persons, 0))

const slotLabel = computed(() => {
  const s = item.value.slot
  if (!s) return ''
  const d = new Date(s.datetime)
  return `${d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })} · ${s.weekday} ${d.toLocaleTimeString('cs-CZ', { hour: 'numeric', minute: '2-digit' })}`
})

/** Sestaví skupinu do košíku z aktuálního výběru. */
function buildGroup(): CartGroup {
  const cartLines: CartLine[] = lines.value.map((l) => ({
    id: l.id,
    label: l.label,
    sub: l.sub,
    unitPrice: l.unitPrice,
    qty: l.qty,
    personsPerUnit: l.persons / l.qty,
    packageChildren: pkgChildren[l.id],
  }))

  return item.value.kind === 'slot'
    ? {
        key: `${item.value.id}|${item.value.slot?.datetime}`,
        itemId: item.value.id,
        title: item.value.title,
        venue: item.value.venue,
        dated: true,
        dateLabel: slotLabel.value,
        extraMeta: [item.value.slot?.language ?? ''].filter(Boolean),
        lines: cartLines,
      }
    : {
        /* Nedatovaná vstupenka — žádný termín, proto ani v klíči. */
        key: `${item.value.id}|open`,
        itemId: item.value.id,
        title: item.value.title,
        venue: item.value.venue,
        dated: false,
        extraMeta: [],
        lines: cartLines,
      }
}

/** Uloží výběr do košíku a posune zákazníka na krok 2. */
function submit() {
  const group = buildGroup()
  if (editing.value) replaceGroup(editKey.value, group)
  else addToCart(group)
  router.push({ name: 'public-cart' })
}
</script>

<template>
  <div>
    <!-- Přepínač ukázek — jen pro prototyp, na ostrém webu nebude. -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 bg-graphite-900 px-5 py-2 text-white">
      <span class="font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
        Prototyp · ukázky
      </span>
      <button
        v-for="demo in TICKETING_ITEMS"
        :key="demo.id"
        type="button"
        class="px-2 py-1 text-[12px] transition-colors"
        :class="demo.id === item.id ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'"
        @click="router.push({ name: 'public-ticket-picker', params: { id: demo.id } })"
      >
        {{ demo.title }}
      </button>
    </div>

    <DovWebFrame :cart-count="editing ? cartCount() : cartCount() + persons">
      <div class="mx-auto max-w-[1400px] px-5 pb-24 lg:pb-16">
        <!-- Cesta + kroky nákupu -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-dov-line py-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg transition-colors hover:text-dov-coal"
            @click="editing ? router.push({ name: 'public-cart' }) : undefined"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <template v-if="editing">Zpět do košíku</template>
            <template v-else>Zpět na {{ item.kind === 'slot' ? 'termíny' : 'program' }}</template>
          </button>

          <CheckoutSteps :current="1" />
        </div>

        <!-- Hlavička objednávky -->
        <div class="pt-8 lg:pt-10">
          <p class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-dov-rust">
            {{ item.venue }}
          </p>
          <h1 class="mt-2 max-w-3xl font-dov-display text-[clamp(2rem,4.5vw,3.4rem)] font-black uppercase leading-[0.95] text-dov-coal">
            {{ item.title }}
          </h1>
          <p v-if="item.perex" class="mt-3 max-w-2xl font-dov-sans text-[15px] leading-relaxed text-dov-mutedfg">
            {{ item.perex }}
          </p>
          <p
            v-if="editing"
            class="mt-4 inline-flex items-center gap-2.5 border border-dov-sand bg-dov-signal/25 px-3.5 py-2 font-dov-sans text-[12.5px] text-dov-coal"
          >
            <svg viewBox="0 0 24 24" class="size-4 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
            </svg>
            Upravujete vstupenky, které už máte v košíku — uložením se původní výběr přepíše.
          </p>
        </div>

        <div class="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <!-- ============ levý sloupec: výběr ============ -->
          <div class="flex min-w-0 flex-col gap-8">
            <!-- Termín / datum návštěvy -->
            <section class="border border-dov-line bg-white">
              <div class="flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-5">
                <template v-if="item.kind === 'slot'">
                  <div class="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" class="size-5 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />
                    </svg>
                    <span>
                      <span class="block font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg">
                        Termín prohlídky
                      </span>
                      <span class="block font-dov-display text-[19px] font-bold uppercase leading-tight text-dov-coal">
                        {{ slotLabel }}
                      </span>
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" class="size-5 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18" />
                    </svg>
                    <span>
                      <span class="block font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg">
                        Jazyk výkladu
                      </span>
                      <span class="block font-dov-display text-[19px] font-bold uppercase leading-tight text-dov-coal">
                        {{ item.slot?.language }}
                      </span>
                    </span>
                  </div>
                  <a href="#" class="ml-auto font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-rust underline underline-offset-4 transition-opacity hover:opacity-70">
                    Změnit termín
                  </a>
                </template>

                <!-- Nedatovaná vstupenka — datum se nevybírá ani nezobrazuje. -->
                <template v-else>
                  <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div class="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" class="size-5 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3.5 2" />
                      </svg>
                      <span>
                        <span class="block font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg">
                          Vstupenka
                        </span>
                        <span class="block font-dov-display text-[19px] font-bold uppercase leading-tight text-dov-coal">
                          Nedatovaná
                        </span>
                      </span>
                    </div>
                    <p class="max-w-sm font-dov-sans text-[12.5px] leading-snug text-dov-mutedfg">
                      Vstupenka platí <strong class="font-semibold text-dov-coal">30 dnů od nákupu</strong> —
                      dorazit můžete kterýkoli otevírací den, na nic se neobjednáváte.
                    </p>
                  </div>
                </template>
              </div>
            </section>

            <!-- Základní vstupenky -->
            <section>
              <div class="mb-3 flex items-baseline gap-3">
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Vstupenky
                </h2>
                <span class="h-px flex-1 bg-dov-line" aria-hidden="true" />
              </div>
              <div class="flex flex-col gap-2">
                <TicketRow
                  v-for="tier in basicTiers"
                  :key="tier.id"
                  v-model="counts[tier.id]"
                  :tier="tier"
                />
              </div>
            </section>

            <!-- Rodinné vstupné -->
            <section v-if="item.packages.length">
              <div class="mb-3 flex items-baseline gap-3">
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Rodinné vstupné
                </h2>
                <span class="h-px flex-1 bg-dov-line" aria-hidden="true" />
                <span class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-mutedfg">
                  Výhodnější balíček
                </span>
              </div>
              <div class="flex flex-col gap-2">
                <FamilyPackageCard
                  v-for="pkg in item.packages"
                  :key="pkg.id"
                  :pkg="pkg"
                  :tiers="item.tiers"
                  :qty="pkgQty[pkg.id] ?? 0"
                  :children="pkgChildren[pkg.id] ?? pkg.childrenMax"
                  @update:qty="pkgQty[pkg.id] = $event"
                  @update:children="pkgChildren[pkg.id] = $event"
                />
              </div>
            </section>

            <!-- Zvýhodněné a zdarma -->
            <section v-if="reducedTiers.length">
              <div class="mb-3 flex items-baseline gap-3">
                <h2 class="font-dov-display text-[22px] font-bold uppercase leading-none text-dov-coal">
                  Zvýhodněné a zdarma
                </h2>
                <span class="h-px flex-1 bg-dov-line" aria-hidden="true" />
              </div>
              <div class="flex flex-col gap-2">
                <TicketRow
                  v-for="tier in reducedTiers"
                  :key="tier.id"
                  v-model="counts[tier.id]"
                  :tier="tier"
                />
              </div>
            </section>

            <!-- Důležité informace -->
            <section class="border border-dov-line bg-white">
              <button
                type="button"
                class="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
                :aria-expanded="infoOpen"
                @click="infoOpen = !infoOpen"
              >
                <svg viewBox="0 0 24 24" class="size-5 shrink-0 text-dov-rust" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7h.01" />
                </svg>
                <span class="min-w-0 flex-1">
                  <span class="block font-dov-display text-[19px] font-bold uppercase leading-none text-dov-coal">
                    Důležité informace ke vstupu
                  </span>
                  <span
                    v-if="!infoOpen"
                    class="mt-1 block truncate font-dov-sans text-[12.5px] text-dov-mutedfg"
                  >
                    {{ item.info[0] }}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  class="size-4 shrink-0 text-dov-mutedfg transition-transform"
                  :class="infoOpen && 'rotate-180'"
                  fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <ul v-show="infoOpen" class="flex flex-col gap-2.5 border-t border-dov-line px-4 py-4 sm:px-5">
                <li
                  v-for="(note, i) in item.info"
                  :key="i"
                  class="flex items-start gap-2.5 font-dov-sans text-[13.5px] leading-relaxed text-dov-coal-soft"
                >
                  <span class="mt-[7px] size-1.5 shrink-0 bg-dov-rust" aria-hidden="true" />
                  {{ note }}
                </li>
              </ul>
            </section>
          </div>

          <!-- ============ pravý sloupec: souhrn ============ -->
          <aside class="hidden min-w-0 lg:block">
            <div class="sticky top-6 border border-dov-line bg-white p-5">
              <SummaryPanel
                :label="editing ? 'Upravujete výběr' : 'Váš výběr'"
                :lines="lines"
                :total="total"
                :persons="persons"
                :cta="editing ? 'Uložit změny v košíku' : 'Pokračovat do košíku'"
                :disabled="lines.length === 0"
                empty-text="Zatím nemáte vybranou žádnou vstupenku."
                :notes="[
                  'E-vstupenku dostanete e-mailem hned po zaplacení.',
                  'U vstupu stačí načíst čárový kód, pokladně se vyhnete.',
                  'Platba kartou nebo přes Apple Pay a Google Pay.',
                ]"
                @submit="submit"
              />
            </div>
          </aside>

          <!-- Mobil: souhrn v toku stránky -->
          <div class="min-w-0 border border-dov-line bg-white p-4 sm:p-5 lg:hidden">
            <SummaryPanel
              :label="editing ? 'Upravujete výběr' : 'Váš výběr'"
              :lines="lines"
              :total="total"
              :persons="persons"
              :cta="editing ? 'Uložit změny v košíku' : 'Pokračovat do košíku'"
              :disabled="lines.length === 0"
              empty-text="Zatím nemáte vybranou žádnou vstupenku."
              @submit="submit"
            />
          </div>
        </div>
      </div>

      <!-- Mobil: lepicí lišta s celkovou cenou -->
      <div
        v-if="total > 0 || persons > 0"
        class="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-dov-coal/15 bg-white px-5 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden"
      >
        <span class="flex-1">
          <span class="block font-dov-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-dov-mutedfg">
            Celkem · {{ persons }} {{ persons === 1 ? 'osoba' : persons < 5 ? 'osoby' : 'osob' }}
          </span>
          <span class="block font-dov-display text-[24px] font-black leading-tight text-dov-coal">
            {{ czk(total) }}
          </span>
        </span>
        <button
          type="button"
          class="bg-dov-rust px-5 py-3.5 font-dov-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-white"
          @click="submit"
        >
          Do košíku
        </button>
      </div>

    </DovWebFrame>
  </div>
</template>
