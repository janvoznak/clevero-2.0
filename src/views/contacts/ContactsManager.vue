<script setup lang="ts">
/**
 * Kontakty — jeden záznam za web (organizace má jednu identitu).
 *
 * Skupina „Pro návštěvníky“ nekopíruje objekty z Areálu, jen si je vybere:
 * otevírací doba i kontakt zůstávají tam, kde se spravují. Prototyp — „Uložit“
 * je jen potvrzení.
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
import RelationPicker from '@/components/admin/RelationPicker.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { PLACE_ITEMS, areaPlace, OPEN_STATE_META } from '@/data/mockVenues'
import {
  MOCK_CONTACTS,
  CONTACT_GROUP_KIND_OPTIONS,
  blankContactGroup,
  blankContactPerson,
  groupSize,
  type ContactsConfig,
  type ContactGroupKind,
} from '@/data/mockContacts'

/* Lokální kopie (prototyp). */
const form = reactive<ContactsConfig>(JSON.parse(JSON.stringify(MOCK_CONTACTS)))
const activeLang = ref<LangCode>('cs')
const activeTab = ref('org')

const filledLangs = computed(() =>
  LANGS.filter((l) => form.tagline[l.code].trim() || form.groups.some((g) => g.name[l.code].trim())).map((l) => l.code),
)

/* ---------- Skupiny ---------- */
function addGroup() {
  form.groups.push(blankContactGroup())
}
function removeGroup(i: number) {
  form.groups.splice(i, 1)
}
function moveGroup(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= form.groups.length) return
  const [g] = form.groups.splice(i, 1)
  form.groups.splice(j, 0, g)
}
function addPerson(gi: number) {
  form.groups[gi].people.push(blankContactPerson())
}
function removePerson(gi: number, pi: number) {
  form.groups[gi].people.splice(pi, 1)
}
function movePerson(gi: number, pi: number, dir: -1 | 1) {
  const list = form.groups[gi].people
  const j = pi + dir
  if (j < 0 || j >= list.length) return
  const [p] = list.splice(pi, 1)
  list.splice(j, 0, p)
}
function kindModel(gi: number) {
  return computed({
    get: () => form.groups[gi].kind,
    set: (v: string) => (form.groups[gi].kind = v as ContactGroupKind),
  })
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
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">contacts</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/contacts</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Kontakty</h1>
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
        <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce kontaktů">
          <TabsTrigger
            v-for="t in [
              { value: 'org', label: 'Organizace', icon: 'home' },
              { value: 'groups', label: 'Skupiny kontaktů', icon: 'user' },
            ]"
            :key="t.value"
            :value="t.value"
            class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
          >
            <Icon :name="t.icon" :size="16" />
            {{ t.label }}
            <span v-if="t.value === 'groups'" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">
              {{ form.groups.length }}
            </span>
          </TabsTrigger>
        </TabsList>

        <!-- Organizace -->
        <TabsContent value="org" class="space-y-5 p-5 outline-none">
          <FormSection title="Identita" icon="home" tag="contacts-identity">
            <div class="space-y-4">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Název organizace</span>
                  <span class="field-tag">contacts-name</span>
                </label>
                <input
                  v-model="form.organizationName"
                  type="text"
                  placeholder="Dolní oblast VÍTKOVICE, z.s."
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[14px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <p class="mt-1.5 text-[11.5px] text-steel-500">
                  Právní název se nepřekládá — na fakturách i v rejstříku je jen jeden.
                </p>
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Doplněk názvu · {{ activeLang.toUpperCase() }}</span>
                  <span class="field-tag">contacts-tagline</span>
                </label>
                <input
                  v-model="form.tagline[activeLang]"
                  type="text"
                  placeholder="Např. Národní kulturní památka a centrum kultury"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Sídlo" icon="map" tag="contacts-address">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Ulice a číslo</span>
                  <span class="field-tag">contacts-street</span>
                </label>
                <input v-model="form.street" type="text" placeholder="Vítkovice 3004" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Město</span>
                  <span class="field-tag">contacts-city</span>
                </label>
                <input v-model="form.city" type="text" placeholder="Ostrava" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">PSČ</span>
                  <span class="field-tag">contacts-zip</span>
                </label>
                <input v-model="form.zip" type="text" placeholder="703 00" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-[12.5px] font-600 text-graphite-800">
                    Odkaz na mapu
                    <HelpTip text="Na webu z něj bude tlačítko „Navigovat“. Mapa se vkládá odkazem, ne vlastním mapovým podkladem." />
                  </span>
                  <span class="field-tag">contacts-map_url</span>
                </label>
                <input v-model="form.mapUrl" type="text" placeholder="https://mapy.cz/…" class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[12px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Spojení"
            icon="mail"
            tag="contacts-reach"
            hint="Obecný kontakt organizace. Objekty i skupiny mají vlastní — tenhle je záložní."
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">E-mail</span>
                  <span class="field-tag">contacts-email</span>
                </label>
                <input v-model="form.email" type="email" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Telefon</span>
                  <span class="field-tag">contacts-phone</span>
                </label>
                <input v-model="form.phone" type="tel" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Identifikační a fakturační údaje"
            icon="file"
            tag="contacts-legal"
            hint="Povinné údaje na webu i na dokladech. Nepřekládají se."
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">IČO</span>
                  <span class="field-tag">contacts-reg_no</span>
                </label>
                <input v-model="form.regNo" type="text" class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">DIČ</span>
                  <span class="field-tag">contacts-vat_no</span>
                </label>
                <input v-model="form.vatNo" type="text" class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Bankovní spojení</span>
                  <span class="field-tag">contacts-bank_account</span>
                </label>
                <input v-model="form.bankAccount" type="text" placeholder="5899880036/5500" class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Banka</span>
                  <span class="field-tag">contacts-bank_name</span>
                </label>
                <input v-model="form.bankName" type="text" placeholder="Raiffeisenbank a.s." class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">ID datové schránky</span>
                  <span class="field-tag">contacts-data_box</span>
                </label>
                <input v-model="form.dataBox" type="text" placeholder="r2q9v5j" class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[12.5px] font-600 text-graphite-800">Zápis v rejstříku · {{ activeLang.toUpperCase() }}</span>
                  <span class="field-tag">contacts-registry</span>
                </label>
                <input
                  v-model="form.registryNote[activeLang]"
                  type="text"
                  placeholder="Zapsáno ve spolkovém rejstříku vedeném Krajským soudem v Ostravě."
                  class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </FormSection>
        </TabsContent>

        <!-- Skupiny kontaktů -->
        <TabsContent value="groups" class="space-y-4 p-5 outline-none">
          <div v-for="(g, gi) in form.groups" :key="g.id" class="rounded-md border border-steel-200">
            <!-- Hlavička skupiny -->
            <div class="flex flex-wrap items-center gap-2 border-b border-steel-100 bg-steel-50/60 px-3 py-2.5">
              <span class="field-tag shrink-0">skupina {{ gi + 1 }}</span>
              <input
                v-model="g.name[activeLang]"
                type="text"
                placeholder="Název skupiny"
                class="h-9 min-w-[180px] flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] font-600 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
              <span class="rounded-full bg-steel-200 px-2 py-0.5 font-mono text-[10.5px] text-steel-600">
                {{ groupSize(g) }}
              </span>
              <AppSwitch v-model="g.published" aria-label="Zobrazovat skupinu" />
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                :disabled="gi === 0"
                title="Posunout nahoru"
                @click="moveGroup(gi, -1)"
              >
                <Icon name="chevronUp" :size="15" />
              </button>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40"
                :disabled="gi === form.groups.length - 1"
                title="Posunout dolů"
                @click="moveGroup(gi, 1)"
              >
                <Icon name="chevronDown" :size="15" />
              </button>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                title="Odebrat skupinu"
                @click="removeGroup(gi)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </div>

            <div class="space-y-4 p-3" :class="!g.published && 'opacity-50'">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[12.5px] font-600 text-graphite-800">Popis · {{ activeLang.toUpperCase() }}</span>
                    <span class="field-tag">group-description</span>
                  </label>
                  <input
                    v-model="g.description[activeLang]"
                    type="text"
                    placeholder="Nepovinná věta pod nadpisem skupiny"
                    class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-[12.5px] font-600 text-graphite-800">
                      Čím je skupina naplněná
                      <HelpTip text="Objekty z Areálu se jen vyberou — otevírací dobu i kontakt si drží samy, tady se nepřepisují." />
                    </span>
                    <span class="field-tag">group-kind</span>
                  </label>
                  <AppSelect :model-value="g.kind" :options="CONTACT_GROUP_KIND_OPTIONS" @update:model-value="(v) => (g.kind = v as ContactGroupKind)" />
                </div>
              </div>

              <!-- Skupina lidí -->
              <template v-if="g.kind === 'people'">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[12.5px] font-600 text-graphite-800">E-mail skupiny</span>
                      <span class="field-tag">group-email</span>
                    </label>
                    <input v-model="g.email" type="email" placeholder="Nepovinný — např. pronajem@…" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[12.5px] font-600 text-graphite-800">Telefon skupiny</span>
                      <span class="field-tag">group-phone</span>
                    </label>
                    <input v-model="g.phone" type="tel" placeholder="Nepovinný" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                </div>

                <ul class="space-y-2">
                  <li v-for="(p, pi) in g.people" :key="p.id" class="rounded-md border border-steel-200 p-3" :class="!p.published && 'bg-steel-50/60'">
                    <div class="mb-3 flex flex-wrap items-center gap-2">
                      <UserAvatar :name="p.name || '?'" :size="32" />
                      <input
                        v-model="p.name"
                        type="text"
                        placeholder="Jméno a příjmení"
                        class="h-9 min-w-[160px] flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] font-600 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      />
                      <AppSwitch v-model="p.published" aria-label="Zobrazovat osobu" />
                      <button type="button" class="grid h-8 w-8 place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40" :disabled="pi === 0" title="Nahoru" @click="movePerson(gi, pi, -1)">
                        <Icon name="chevronUp" :size="14" />
                      </button>
                      <button type="button" class="grid h-8 w-8 place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 disabled:opacity-40" :disabled="pi === g.people.length - 1" title="Dolů" @click="movePerson(gi, pi, 1)">
                        <Icon name="chevronDown" :size="14" />
                      </button>
                      <button type="button" class="grid h-8 w-8 place-items-center rounded text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600" title="Odebrat osobu" @click="removePerson(gi, pi)">
                        <Icon name="trash" :size="14" />
                      </button>
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label class="mb-1 block field-tag">Pozice · {{ activeLang.toUpperCase() }}</label>
                        <input v-model="p.role[activeLang]" type="text" placeholder="Např. Krátkodobé pronájmy" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      </div>
                      <div>
                        <label class="mb-1 block field-tag">E-mail</label>
                        <input v-model="p.email" type="email" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                      </div>
                      <div>
                        <label class="mb-1 block field-tag">Telefon</label>
                        <input v-model="p.phone" type="tel" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                      </div>
                      <div>
                        <label class="mb-1 block field-tag">Poznámka · {{ activeLang.toUpperCase() }}</label>
                        <input v-model="p.note[activeLang]" type="text" placeholder="Čemu se věnuje, kdy je k zastižení" class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      </div>
                    </div>
                  </li>
                  <li v-if="!g.people.length" class="rounded-md border border-dashed border-steel-300 px-3 py-6 text-center text-[12.5px] text-steel-400">
                    Ve skupině zatím není nikdo.
                  </li>
                </ul>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
                  @click="addPerson(gi)"
                >
                  <Icon name="plus" :size="15" /> Přidat osobu
                </button>
              </template>

              <!-- Skupina objektů z Areálu -->
              <template v-else>
                <RelationPicker
                  v-model="g.venueIds"
                  :items="PLACE_ITEMS"
                  add-label="Přidat objekt"
                  empty-label="Zatím žádný objekt — skupina by na webu zůstala prázdná."
                  search-placeholder="Hledat objekt v areálu…"
                  icon="home"
                  item-route-name="area-edit"
                  create-route-name="area-new"
                  create-label="Založit objekt"
                />
                <div v-if="g.venueIds.length" class="rounded-md border border-steel-200 bg-steel-50/60 p-3">
                  <p class="mb-2 field-tag">Co web u objektů ukáže (zrcadlí se z Areálu)</p>
                  <ul class="space-y-1.5">
                    <li
                      v-for="vid in g.venueIds"
                      :key="vid"
                      class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded bg-white px-2.5 py-2 text-[12px]"
                    >
                      <span class="font-600 text-graphite-800">{{ areaPlace(vid)?.title.cs ?? '— smazaný objekt —' }}</span>
                      <span v-if="areaPlace(vid)?.email" class="text-steel-500">{{ areaPlace(vid)?.email }}</span>
                      <span v-if="areaPlace(vid)?.phone" class="text-steel-500">{{ areaPlace(vid)?.phone }}</span>
                      <span
                        v-if="areaPlace(vid)"
                        class="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-600"
                        :class="[OPEN_STATE_META[areaPlace(vid)!.openState].bg, OPEN_STATE_META[areaPlace(vid)!.openState].text]"
                      >
                        <span class="h-1.5 w-1.5 rounded-full" :class="OPEN_STATE_META[areaPlace(vid)!.openState].dot" />
                        {{ OPEN_STATE_META[areaPlace(vid)!.openState].label }}
                      </span>
                      <span v-if="!areaPlace(vid)?.email && !areaPlace(vid)?.phone" class="text-amber-600">
                        objekt nemá vyplněný kontakt
                      </span>
                    </li>
                  </ul>
                  <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">
                    Otevírací dobu i kontakt objektu upravíte v modulu Areál — tady se jen zobrazují.
                  </p>
                </div>
              </template>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
            @click="addGroup"
          >
            <Icon name="plus" :size="15" /> Přidat skupinu
          </button>
        </TabsContent>
      </TabsRoot>
    </div>
  </div>
</template>
