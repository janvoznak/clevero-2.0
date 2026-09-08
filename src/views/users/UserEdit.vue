<script setup lang="ts">
/**
 * Detail účtu do administrace.
 *
 * Heslo se tady nezadává: nový účet dostane odkaz e-mailem, existující se řeší
 * tlačítkem „Poslat odkaz na změnu hesla". Pole na heslo v editačním formuláři
 * je zvyk ze starých administrací, který nikomu nepomáhá a svádí k posílání
 * hesel e-mailem. Prototyp — ukládání i odesílání jsou předstírané (§11).
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import {
  CMS_USERS,
  blankUser,
  userState,
  USER_STATE_META,
  MODULE_PERMISSIONS,
  PERM_ALL,
  isSuperadmin,
  isSelf,
  passwordExpiringSoon,
  type CmsUser,
} from '@/data/mockUsers'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => CMS_USERS.find((u) => u.id === props.id))
function clone(): CmsUser {
  const s = source.value
  return s ? (JSON.parse(JSON.stringify(s)) as CmsUser) : blankUser()
}
const form = reactive<CmsUser>(clone())

const state = computed(() => userState(form))
const superadmin = computed(() => isSuperadmin(form))
const self = computed(() => isEdit.value && isSelf(form))

/* ---------- Oprávnění ----------
   Moduly seskupené jako v sidebaru — plochý seznam dvaceti přepínačů se nečte. */
const permGroups = computed(() => {
  const out: { group: string; items: typeof MODULE_PERMISSIONS }[] = []
  for (const m of MODULE_PERMISSIONS) {
    const g = out.find((x) => x.group === m.group)
    if (g) g.items.push(m)
    else out.push({ group: m.group, items: [m] })
  }
  return out
})
function hasPerm(key: string): boolean {
  return form.permissions.includes(key)
}
function togglePerm(key: string) {
  form.permissions = hasPerm(key)
    ? form.permissions.filter((p) => p !== key)
    : [...form.permissions, key]
}
/** Klik na název skupiny přepne celou skupinu naráz. */
function toggleGroup(group: string) {
  const keys = MODULE_PERMISSIONS.filter((m) => m.group === group).map((m) => m.key)
  const allOn = keys.every((k) => hasPerm(k))
  form.permissions = allOn
    ? form.permissions.filter((p) => !keys.includes(p))
    : [...new Set([...form.permissions, ...keys])]
}
/** „Správa všeho" nahrazuje jednotlivá oprávnění. */
const superadminModel = computed({
  get: () => superadmin.value,
  set: (v: boolean) => {
    form.permissions = v ? [PERM_ALL] : []
  },
})

/* ---------- Stav účtu ---------- */
const statusOptions = [
  { value: 'active', label: 'Aktivní' },
  { value: 'blocked', label: 'Zablokovaný' },
]
const statusModel = computed({
  get: () => form.status,
  set: (v: string) => (form.status = v === 'blocked' ? 'blocked' : 'active'),
})
const expiresAt = computed({
  get: () => form.expiresAt ?? '',
  set: (v: string) => (form.expiresAt = v || null),
})
const passwordExpiresAt = computed({
  get: () => form.passwordExpiresAt ?? '',
  set: (v: string) => (form.passwordExpiresAt = v || null),
})
function fmtDate(iso: string | null): string {
  if (!iso) return 'zatím nikdy'
  const [y, m, d] = iso.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

/* ---------- Akce (prototyp) ---------- */
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
function saveBack() {
  save()
  router.push({ name: 'users-list' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky hlavička -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'users-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">user</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/users/${form.id}/edit` : '/admin/users/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.name || 'Bez jména' : 'Nový uživatel' }}
          </h1>
        </div>
        <DetailActions
          :name="form.name"
          entity="účet"
          :is-edit="isEdit"
          :saved="saved"
          :can-delete="!self"
          @save="save"
          @save-back="saveBack"
          @duplicate="router.push({ name: 'user-new' })"
          @delete="router.push({ name: 'users-list' })"
        />
      </div>
    </div>

    <!-- Dvousloupcové tělo -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="min-w-0 space-y-5">
        <!-- Účet -->
        <FormSection title="Účet" icon="user" tag="user-account">
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <UserAvatar :name="form.name || '?'" :size="56" />
              <div class="min-w-0 flex-1">
                <p class="text-[12.5px] leading-relaxed text-steel-500">
                  Profilová fotka se zatím nenahrává — dokud není, ukazuje se barevný monogram ze jména.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Jméno a příjmení *</span>
                  <span class="field-tag">user-name</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Např. Jana Svobodová"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[14px] text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <p class="mt-1.5 text-[11.5px] leading-relaxed text-steel-500">
                  Pod tímhle jménem se uživatel podepisuje u záznamů, které vytvoří.
                </p>
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                    Přihlašovací jméno *
                    <HelpTip text="Slouží k přihlášení a už se nemění — je to identita účtu." />
                  </span>
                  <span class="field-tag">user-login</span>
                </label>
                <input
                  v-model="form.login"
                  type="text"
                  :disabled="isEdit"
                  placeholder="např. jsvobodova"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 font-mono text-[13px] text-graphite-900 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none disabled:bg-steel-50 disabled:text-steel-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">E-mail *</span>
                  <span class="field-tag">user-email</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="jmeno@dolnivitkovice.cz"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[14px] text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <p class="mt-1.5 text-[11.5px] leading-relaxed text-steel-500">
                  Chodí sem odkaz na nastavení hesla a systémová upozornění.
                </p>
              </div>
              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Telefon</span>
                  <span class="field-tag">user-phone</span>
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+420 601 234 567"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[14px] text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Heslo se nezadává ve formuláři -->
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-steel-200 bg-steel-50 px-3.5 py-3">
              <p class="min-w-[220px] flex-1 text-[12.5px] leading-relaxed text-steel-600">
                <span class="font-600 text-graphite-800">Heslo se tu nezadává.</span>
                {{ isEdit
                  ? 'Uživateli pošlete odkaz, kterým si nastaví nové heslo sám.'
                  : 'Po založení účtu odejde uživateli e-mail s odkazem pro nastavení hesla.' }}
              </p>
              <AppButton
                v-if="isEdit"
                variant="secondary"
                size="sm"
                :disabled="!form.email"
                @click="fireToast(`Odkaz na změnu hesla odešel na ${form.email}`)"
              >
                <Icon name="mail" :size="15" /> Poslat odkaz na změnu hesla
              </AppButton>
            </div>
          </div>
        </FormSection>

        <!-- Oprávnění -->
        <FormSection
          title="Oprávnění"
          icon="layers"
          tag="user-permissions"
          hint="Klikem na název skupiny přepnete celou skupinu. Bez jediného oprávnění se uživatel přihlásí, ale neuvidí žádný modul."
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-steel-200 bg-steel-50/60 p-3">
            <p class="flex min-w-[220px] flex-1 items-center gap-1.5 text-[13px] font-600 text-graphite-900">
              Správa všeho
              <HelpTip text="Přístup do všech modulů včetně uživatelů a nastavení. Nahrazuje jednotlivá oprávnění — dávejte jen lidem, kteří web opravdu spravují." />
            </p>
            <AppSwitch v-model="superadminModel" aria-label="Správa všeho" />
          </div>

          <div class="space-y-3.5" :class="superadmin && 'pointer-events-none opacity-45'">
            <div v-for="g in permGroups" :key="g.group">
              <button
                type="button"
                class="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-700 uppercase tracking-wider text-steel-500 outline-none transition-colors hover:text-brand-600"
                @click="toggleGroup(g.group)"
              >
                {{ g.group }}
                <Icon name="check" :size="11" />
              </button>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="m in g.items"
                  :key="m.key"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none transition-colors"
                  :class="
                    hasPerm(m.key)
                      ? 'border-brand-400 bg-brand-50 font-600 text-brand-700'
                      : 'border-steel-200 bg-white text-steel-600 hover:border-steel-300 hover:bg-steel-50'
                  "
                  @click="togglePerm(m.key)"
                >
                  <Icon :name="hasPerm(m.key) ? 'check' : 'plus'" :size="12" />
                  {{ m.label }}
                </button>
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Stav účtu" icon="settings" tag="user-status">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[USER_STATE_META[state].bg, USER_STATE_META[state].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="USER_STATE_META[state].dot" />
                {{ USER_STATE_META[state].label }}
              </span>
              <span v-if="self" class="rounded bg-steel-100 px-1.5 py-0.5 text-[10.5px] font-600 text-steel-500">
                to jste vy
              </span>
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[12.5px] font-600 text-graphite-800">Přístup do administrace</span>
                <span class="field-tag">user-status</span>
              </label>
              <AppSelect v-model="statusModel" :options="statusOptions" :disabled="self" />
              <p v-if="self" class="mt-1.5 text-[11.5px] leading-relaxed text-steel-500">
                Vlastní účet si zablokovat nelze.
              </p>
            </div>

            <div class="border-t border-steel-100 pt-3">
              <label class="mb-1.5 flex items-center justify-between">
                <span class="flex items-center gap-1.5 text-[12.5px] font-600 text-graphite-800">
                  Platnost účtu
                  <HelpTip text="Po tomto datu se uživatel nepřihlásí — hodí se u brigád a externí spolupráce. Prázdné = bez omezení." />
                </span>
                <span class="field-tag">user-expires_at</span>
              </label>
              <input
                v-model="expiresAt"
                type="date"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[12.5px] font-600 text-graphite-800">Konec platnosti hesla</span>
                <span class="field-tag">user-password_expires_at</span>
              </label>
              <input
                v-model="passwordExpiresAt"
                type="date"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
              <p
                v-if="passwordExpiringSoon(form)"
                class="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-700"
              >
                <Icon name="clock" :size="13" class="mt-0.5 shrink-0" />
                Heslo brzy vyprší — uživatel dostane výzvu ke změně.
              </p>
            </div>

            <div class="flex items-center justify-between gap-2 border-t border-steel-100 pt-3 text-[12px]">
              <span class="text-steel-500">Poslední přihlášení</span>
              <span class="font-600 text-graphite-800 tabular-nums">{{ fmtDate(form.lastLogin) }}</span>
            </div>
          </div>
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
