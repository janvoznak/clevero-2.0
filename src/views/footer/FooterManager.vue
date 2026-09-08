<script setup lang="ts">
/**
 * Patička webu — sloupce odkazů, kontakt, sítě, partneři a spodní řádek.
 *
 * Odkazy používají stejný výběr cíle jako Navigace (`NavTargetPicker`), takže
 * se nerozbijí při změně URL stránky. Prototyp — „Uložit" je jen potvrzení.
 */
import { computed, reactive, ref } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import FormSection from '@/components/admin/FormSection.vue'
import LangBar from '@/components/admin/LangBar.vue'
import NavTargetPicker from '@/components/admin/NavTargetPicker.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { MOCK_PAGES } from '@/data/mockPages'
import { navTargetLabel, navItemIncomplete } from '@/data/mockNavigation'
import {
  MOCK_FOOTER,
  SOCIAL_ICON_OPTIONS,
  blankFooterColumn,
  blankFooterLink,
  blankSocialLink,
  blankPartner,
  type FooterConfig,
} from '@/data/mockFooter'

/* Lokální kopie (prototyp). */
const form = reactive<FooterConfig>(JSON.parse(JSON.stringify(MOCK_FOOTER)))
const activeLang = ref<LangCode>('cs')
const activeTab = ref('columns')

const filledLangs = computed(() =>
  LANGS.filter((l) => form.about[l.code].trim() || form.columns.some((c) => c.heading[l.code].trim())).map((l) => l.code),
)
function pageTitle(id: string): string {
  return MOCK_PAGES.find((p) => p.id === id)?.title.cs ?? '— smazaná stránka —'
}
const incompleteLinks = computed(() =>
  form.columns.reduce((n, c) => n + c.items.filter((i) => navItemIncomplete(i)).length, 0),
)

/* ---------- Sloupce a odkazy ---------- */
function addColumn() {
  form.columns.push(blankFooterColumn())
}
function removeColumn(i: number) {
  form.columns.splice(i, 1)
}
function moveColumn(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= form.columns.length) return
  const [c] = form.columns.splice(i, 1)
  form.columns.splice(j, 0, c)
}
function addLink(ci: number) {
  form.columns[ci].items.push(blankFooterLink())
}
function removeLink(ci: number, li: number) {
  form.columns[ci].items.splice(li, 1)
}
function moveLink(ci: number, li: number, dir: -1 | 1) {
  const list = form.columns[ci].items
  const j = li + dir
  if (j < 0 || j >= list.length) return
  const [it] = list.splice(li, 1)
  list.splice(j, 0, it)
}

/* ---------- Sítě a partneři ---------- */
function addSocial() {
  form.social.push(blankSocialLink())
}
function removeSocial(i: number) {
  form.social.splice(i, 1)
}
function addPartner() {
  form.partners.push(blankPartner())
}
function removePartner(i: number) {
  form.partners.splice(i, 1)
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="px-8 py-6 pb-16">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">footer</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/footer</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Patička</h1>
      </div>
      <div class="flex items-center gap-3">
        <LangBar v-model="activeLang" :filled="filledLangs" class="hidden lg:block" />
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit' }}
        </AppButton>
      </div>
    </div>

    <div class="rounded-lg border border-steel-200 bg-white">
      <TabsRoot v-model="activeTab">
        <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce patičky">
          <TabsTrigger
            v-for="t in [
              { value: 'columns', label: 'Sloupce odkazů', icon: 'layout' },
              { value: 'contact', label: 'Kontakt a sítě', icon: 'mail' },
              { value: 'partners', label: 'Partneři', icon: 'image' },
            ]"
            :key="t.value"
            :value="t.value"
            class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
          >
            <Icon :name="t.icon" :size="16" />
            {{ t.label }}
            <span
              v-if="t.value === 'columns' && incompleteLinks"
              class="rounded-full bg-amber-500/15 px-1.5 font-mono text-[10px] text-amber-700"
              title="Odkazy bez cíle"
            >
              {{ incompleteLinks }}
            </span>
          </TabsTrigger>
        </TabsList>

        <!-- Sloupce odkazů -->
        <TabsContent value="columns" class="space-y-4 p-5 outline-none">
          <div v-for="(col, ci) in form.columns" :key="col.id" class="rounded-md border border-steel-200">
            <div class="flex flex-wrap items-center gap-2 border-b border-steel-100 bg-steel-50/60 px-3 py-2.5">
              <span class="field-tag shrink-0">sloupec {{ ci + 1 }}</span>
              <input
                v-model="col.heading[activeLang]"
                type="text"
                placeholder="Nadpis sloupce (nepovinný)"
                class="h-9 min-w-[180px] flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] font-600 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                :disabled="ci === 0"
                title="Posunout doleva"
                @click="moveColumn(ci, -1)"
              >
                <Icon name="chevronLeft" :size="15" />
              </button>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                :disabled="ci === form.columns.length - 1"
                title="Posunout doprava"
                @click="moveColumn(ci, 1)"
              >
                <Icon name="chevronRight" :size="15" />
              </button>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                title="Odebrat sloupec"
                @click="removeColumn(ci)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </div>

            <ul class="divide-y divide-steel-100">
              <li v-for="(item, li) in col.items" :key="item.id" class="grid gap-3 p-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] font-600 text-graphite-800">Popisek · {{ activeLang.toUpperCase() }}</span>
                    <span class="field-tag">footer-link_label</span>
                  </label>
                  <input
                    v-model="item.label[activeLang]"
                    type="text"
                    placeholder="Např. Návštěvní řád"
                    class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                  <p
                    class="mt-1.5 truncate text-[11.5px]"
                    :class="navItemIncomplete(item) ? 'text-amber-600' : 'text-steel-500'"
                  >
                    <template v-if="navItemIncomplete(item)">chybí cíl — odkaz by nikam nevedl</template>
                    <template v-else>→ {{ navTargetLabel(item, pageTitle) }}</template>
                  </p>
                </div>
                <div>
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] font-600 text-graphite-800">Kam odkaz vede</span>
                    <span class="flex items-center gap-1">
                      <button
                        type="button"
                        class="grid h-7 w-7 place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                        :disabled="li === 0"
                        title="Nahoru"
                        @click="moveLink(ci, li, -1)"
                      >
                        <Icon name="chevronUp" :size="14" />
                      </button>
                      <button
                        type="button"
                        class="grid h-7 w-7 place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                        :disabled="li === col.items.length - 1"
                        title="Dolů"
                        @click="moveLink(ci, li, 1)"
                      >
                        <Icon name="chevronDown" :size="14" />
                      </button>
                      <button
                        type="button"
                        class="grid h-7 w-7 place-items-center rounded text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                        title="Odebrat odkaz"
                        @click="removeLink(ci, li)"
                      >
                        <Icon name="trash" :size="14" />
                      </button>
                    </span>
                  </div>
                  <NavTargetPicker v-model="col.items[li]" />
                </div>
              </li>
              <li v-if="!col.items.length" class="px-3 py-6 text-center text-[12.5px] text-steel-400">
                Sloupec je prázdný.
              </li>
            </ul>

            <div class="border-t border-steel-100 p-3">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
                @click="addLink(ci)"
              >
                <Icon name="plus" :size="15" /> Přidat odkaz
              </button>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
            @click="addColumn"
          >
            <Icon name="plus" :size="15" /> Přidat sloupec
          </button>
        </TabsContent>

        <!-- Kontakt a sítě -->
        <TabsContent value="contact" class="space-y-5 p-5 outline-none">
          <FormSection title="O organizaci" icon="text" tag="footer-about">
            <label class="mb-1.5 flex items-center justify-between">
              <span class="text-[12.5px] font-600 text-graphite-800">Text pod logem · {{ activeLang.toUpperCase() }}</span>
              <span class="field-tag">footer-about</span>
            </label>
            <textarea
              v-model="form.about[activeLang]"
              rows="3"
              placeholder="Dvě věty o organizaci."
              class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
          </FormSection>

          <FormSection title="Kontakt v patičce" icon="mail" tag="footer-contact">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Telefon</span>
                  <span class="field-tag">footer-phone</span>
                </label>
                <input
                  v-model="form.contactPhone"
                  type="tel"
                  placeholder="+420 724 955 121"
                  class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">E-mail</span>
                  <span class="field-tag">footer-email</span>
                </label>
                <input
                  v-model="form.contactEmail"
                  type="email"
                  placeholder="infocentrum@dolnivitkovice.cz"
                  class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Sociální sítě"
            icon="share"
            tag="footer-social"
            hint="Ikona se vybírá ze sady administrace — sítě bez vlastní ikony dostanou obecný glóbus."
          >
            <ul class="space-y-2">
              <li v-for="(s, i) in form.social" :key="s.id" class="flex flex-wrap items-center gap-2">
                <span class="w-40 shrink-0">
                  <AppSelect v-model="s.icon" :options="SOCIAL_ICON_OPTIONS" />
                </span>
                <input
                  v-model="s.name"
                  type="text"
                  placeholder="Název sítě"
                  class="h-9 w-40 shrink-0 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <input
                  v-model="s.url"
                  type="text"
                  placeholder="https://…"
                  class="h-9 min-w-[200px] flex-1 rounded-md border border-steel-200 px-3 font-mono text-[12px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                  title="Odebrat síť"
                  @click="removeSocial(i)"
                >
                  <Icon name="trash" :size="15" />
                </button>
              </li>
            </ul>
            <button
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
              @click="addSocial"
            >
              <Icon name="plus" :size="15" /> Přidat síť
            </button>
          </FormSection>

          <FormSection title="Odběr novinek" icon="send" tag="footer-newsletter">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3">
                <AppSwitch
                  v-model="form.newsletterEnabled"
                  label="Zobrazovat přihlášení k odběru"
                  hint="Souhlas se zpracováním údajů je pevnou součástí formuláře."
                />
                <span class="field-tag shrink-0">footer-newsletter</span>
              </div>
              <div v-if="form.newsletterEnabled">
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Text u formuláře · {{ activeLang.toUpperCase() }}</span>
                  <span class="field-tag">footer-newsletter_text</span>
                </label>
                <input
                  v-model="form.newsletterText[activeLang]"
                  type="text"
                  placeholder="Např. Přihlaste se k odběru novinek."
                  class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Spodní řádek" icon="page" tag="footer-copyright">
            <label class="mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-[12.5px] font-600 text-graphite-800">
                Copyright · {{ activeLang.toUpperCase() }}
                <HelpTip text="Rok se na webu doplní automaticky — sem patří jen název organizace." />
              </span>
              <span class="field-tag">footer-copyright</span>
            </label>
            <input
              v-model="form.copyright[activeLang]"
              type="text"
              placeholder="Dolní oblast VÍTKOVICE, z.s."
              class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
            <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">
              Odkaz na správu cookies je pevná součást spodního řádku — vyžaduje ho zákon, proto se nevypíná.
            </p>
          </FormSection>
        </TabsContent>

        <!-- Partneři -->
        <TabsContent value="partners" class="p-5 outline-none">
          <ul class="space-y-2">
            <li v-for="(p, i) in form.partners" :key="p.id" class="flex flex-wrap items-center gap-2">
              <button
                class="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded border border-dashed border-steel-300 text-[10px] font-700 uppercase tracking-wider text-steel-400 transition-colors hover:border-brand-400 hover:text-brand-600"
                title="Nahrát logo (prototyp)"
              >
                <img v-if="p.logo" :src="p.logo" alt="" class="h-full w-full object-contain" />
                <span v-else>{{ initials(p.name) }}</span>
              </button>
              <input
                v-model="p.name"
                type="text"
                placeholder="Název partnera"
                class="h-9 min-w-[180px] flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
              <input
                v-model="p.url"
                type="text"
                placeholder="https://… (nepovinné)"
                class="h-9 min-w-[200px] flex-1 rounded-md border border-steel-200 px-3 font-mono text-[12px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                title="Odebrat partnera"
                @click="removePartner(i)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </li>
          </ul>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
            @click="addPartner"
          >
            <Icon name="plus" :size="15" /> Přidat partnera
          </button>
        </TabsContent>
      </TabsRoot>
    </div>
  </div>
</template>
