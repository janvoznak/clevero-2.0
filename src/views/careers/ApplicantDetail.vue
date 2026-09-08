<script setup lang="ts">
/**
 * Detail přihlášky.
 *
 * Levý sloupec je **přesně to, co uchazeč odeslal** — needituje se. Přepisovat
 * cizí přihlášku by znamenalo ztratit, co člověk doopravdy napsal. V CMS se
 * mění jen stav, kdo ji řeší, a interní poznámka (rail).
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FormSection from '@/components/admin/FormSection.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import { CMS_USERS } from '@/data/mockUsers'
import {
  MOCK_APPLICANTS,
  APPLICANT_STATUS_META,
  APPLICANT_STATUS_OPTIONS,
  FILE_KIND_META,
  consentExpiringSoon,
  fmtSubmitted,
  position,
  type Applicant,
  type ApplicantStatus,
} from '@/data/mockCareers'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const source = computed(() => MOCK_APPLICANTS.find((a) => a.id === props.id))
const form = reactive<Applicant>(
  source.value
    ? (JSON.parse(JSON.stringify(source.value)) as Applicant)
    : (JSON.parse(JSON.stringify(MOCK_APPLICANTS[0])) as Applicant),
)

const statusMeta = computed(() => APPLICANT_STATUS_META[form.status])
const linkedPosition = computed(() => (form.positionId ? position(form.positionId) : undefined))

const ASSIGNEE_NONE = '__none__'
const assigneeOptions = [
  { value: ASSIGNEE_NONE, label: '— nepřiřazeno' },
  ...CMS_USERS.map((u) => ({ value: u.name, label: u.name })),
]
const assigneeModel = computed({
  get: () => form.assignee || ASSIGNEE_NONE,
  set: (v: string) => (form.assignee = v === ASSIGNEE_NONE ? '' : v),
})

function setStatus(s: ApplicantStatus) {
  form.status = s
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3000)
}
const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky hlavička -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'applicants-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">applicant</span>
            <span class="font-mono text-[11px] text-steel-400">/admin/careers/applicants/{{ form.id }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ form.name }}
          </h1>
        </div>
        <AppButton variant="secondary" @click="fireToast(`Otevírám e-mail na ${form.email}`)">
          <Icon name="mail" :size="16" /> Odpovědět
        </AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit' }}
        </AppButton>
      </div>
    </div>

    <!-- Dvousloupcové tělo -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0 space-y-5">
        <!-- Co uchazeč odeslal (read-only) -->
        <FormSection
          title="Odeslaná přihláška"
          icon="send"
          tag="applicant-values · read-only"
          hint="Přesně to, co uchazeč odeslal ve formuláři. Needituje se — je to jeho text, ne náš."
        >
          <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md bg-steel-50 px-3.5 py-2.5 text-[12.5px]">
            <span class="flex items-center gap-1.5 text-steel-600">
              <Icon name="briefcase" :size="14" class="text-steel-400" />
              <button
                v-if="linkedPosition"
                class="font-600 text-brand-600 hover:underline"
                @click="router.push({ name: 'position-edit', params: { id: linkedPosition.id } })"
              >
                {{ form.positionTitle }}
              </button>
              <span v-else class="italic text-steel-500">{{ form.positionTitle }}</span>
            </span>
            <span class="flex items-center gap-1.5 text-steel-600">
              <Icon name="clock" :size="14" class="text-steel-400" /> {{ fmtSubmitted(form.createdAt) }}
            </span>
          </div>

          <dl class="divide-y divide-steel-100">
            <div v-for="(v, i) in form.values" :key="i" class="grid gap-1 py-2.5 sm:grid-cols-[190px_1fr] sm:gap-4">
              <dt class="text-[12.5px] font-600 text-steel-500">{{ v.label }}</dt>
              <dd class="whitespace-pre-line text-[13.5px] leading-relaxed text-graphite-800">
                <template v-if="v.value">
                  <a v-if="v.label === 'E-mail'" :href="`mailto:${v.value}`" class="text-brand-600 hover:underline">{{ v.value }}</a>
                  <a v-else-if="v.label === 'Telefon'" :href="`tel:${v.value}`" class="text-brand-600 hover:underline">{{ v.value }}</a>
                  <span v-else>{{ v.value }}</span>
                </template>
                <span v-else class="text-steel-400">nevyplněno</span>
              </dd>
            </div>
          </dl>
        </FormSection>

        <!-- Přílohy -->
        <FormSection
          title="Přílohy"
          icon="paperclip"
          tag="applicant-files"
          hint="Životopis a motivační dopis z formuláře. Prototyp — stahování se nesimuluje."
        >
          <ul v-if="form.files.length" class="space-y-2">
            <li
              v-for="f in form.files"
              :key="f.id"
              class="flex items-center gap-3 rounded-md border border-steel-200 px-3 py-2.5"
            >
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-steel-100 text-steel-500">
                <Icon :name="FILE_KIND_META[f.kind].icon" :size="16" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px] font-500 text-graphite-800">{{ f.name }}</span>
                <span class="block font-mono text-[11px] text-steel-400">
                  {{ FILE_KIND_META[f.kind].label }} · {{ f.ext.toUpperCase() }} · {{ f.size }}
                </span>
              </span>
              <AppButton variant="secondary" size="sm" @click="fireToast('Prototyp — stahování příloh se nesimuluje')">
                Stáhnout
              </AppButton>
            </li>
          </ul>
          <p v-else class="text-[12.5px] text-steel-400">Uchazeč nepřiložil žádný soubor.</p>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <!-- Stav náboru -->
        <FormSection title="Stav" icon="user" tag="applicant-status">
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="s in APPLICANT_STATUS_OPTIONS"
              :key="s.value"
              type="button"
              class="rounded-md border px-2 py-2 text-[12.5px] font-600 outline-none transition-colors"
              :class="
                form.status === s.value
                  ? [APPLICANT_STATUS_META[s.value].bg, APPLICANT_STATUS_META[s.value].text, 'border-current']
                  : 'border-steel-200 bg-white text-steel-500 hover:border-steel-300 hover:text-graphite-800'
              "
              @click="setStatus(s.value)"
            >
              {{ s.label }}
            </button>
          </div>
          <p class="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :class="statusMeta.dot" />
            Stav je interní — uchazeči se nikam nezobrazuje. Odpovídá se e-mailem.
          </p>
        </FormSection>

        <!-- Kdo přihlášku řeší -->
        <FormSection title="Řeší" icon="user" tag="applicant-assignee">
          <AppSelect v-model="assigneeModel" :options="assigneeOptions" />
          <p v-if="form.assignee" class="mt-2 flex items-center gap-2 text-[12px] text-steel-500">
            <UserAvatar :name="form.assignee" :size="22" />
            {{ form.assignee }}
          </p>
        </FormSection>

        <!-- Interní poznámka -->
        <FormSection
          title="Interní poznámka"
          icon="text"
          tag="applicant-note"
          hint="Jediné, co se u přihlášky v CMS píše. Uchazeč ji nevidí."
        >
          <textarea
            v-model="form.note"
            rows="4"
            placeholder="Např. Domluvena schůzka 5. 8. v 10:00, infocentrum."
            class="w-full resize-y rounded-md border border-steel-200 px-3 py-2.5 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          />
        </FormSection>

        <!-- Souhlas se zpracováním -->
        <FormSection title="Osobní údaje" icon="cookie" tag="applicant-consent">
          <div class="flex items-center justify-between gap-2 text-[12.5px]">
            <span class="flex items-center gap-1.5 text-steel-500">
              Souhlas do
              <HelpTip text="Do kdy uchazeč souhlasil se zpracováním údajů. Po vypršení je potřeba přihlášku i přílohy smazat." />
            </span>
            <span class="font-600 text-graphite-800 tabular-nums">{{ fmtDate(form.consentUntil) }}</span>
          </div>
          <p
            v-if="consentExpiringSoon(form)"
            class="mt-2 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-700"
          >
            <Icon name="clock" :size="13" class="mt-0.5 shrink-0" />
            Souhlas brzy vyprší — přihlášku i přílohy bude potřeba smazat.
          </p>
        </FormSection>
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="mail" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
