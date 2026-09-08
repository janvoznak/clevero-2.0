<script setup lang="ts">
/**
 * Výpis uživatelů administrace.
 *
 * Destruktivní akce na vlastním účtu chybí záměrně — smazat sebe nebo se
 * přihlásit za sebe je vždycky chyba obsluhy. Ze stejného důvodu nemá vlastní
 * účet zaškrtávátko: hromadná akce by ho jinak zasáhla. Prototyp — akce jsou
 * předstírané (STANDARDY §11).
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckboxRoot,
  CheckboxIndicator,
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
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import {
  CMS_USERS,
  userState,
  USER_STATE_META,
  permissionCount,
  passwordExpiringSoon,
  isSuperadmin,
  isSelf,
  MODULE_PERMISSIONS,
  type CmsUser,
} from '@/data/mockUsers'

const router = useRouter()
const rows = ref<CmsUser[]>([...CMS_USERS])

/* ---------- Filtr (bez fulltextu — hledání pokrývá search v topbaru, §6) ---------- */
const filterState = ref('all')
const filterPerm = ref('all')
const stateOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'active', label: 'Aktivní' },
  { value: 'blocked', label: 'Zablokované' },
  { value: 'expired', label: 'Vypršelé' },
]
const permOptions = [
  { value: 'all', label: 'Všechna oprávnění' },
  { value: 'super', label: 'Správa všeho' },
  { value: 'limited', label: 'Vybrané moduly' },
  { value: 'none', label: 'Bez oprávnění' },
]
const hasFilters = computed(() => filterState.value !== 'all' || filterPerm.value !== 'all')
function clearFilters() {
  filterState.value = 'all'
  filterPerm.value = 'all'
}

const visible = computed(() =>
  rows.value.filter((u) => {
    if (filterState.value !== 'all' && userState(u) !== filterState.value) return false
    if (filterPerm.value === 'super' && !isSuperadmin(u)) return false
    if (filterPerm.value === 'limited' && (isSuperadmin(u) || u.permissions.length === 0)) return false
    if (filterPerm.value === 'none' && u.permissions.length > 0) return false
    return true
  }),
)

/* ---------- Řádkové akce ---------- */
const deleteTarget = ref<CmsUser | null>(null)
const impersonateTarget = ref<CmsUser | null>(null)

/** Zablokovat / odblokovat — nejčastější zásah, proto přímo v menu řádku. */
function toggleBlock(u: CmsUser) {
  u.status = u.status === 'blocked' ? 'active' : 'blocked'
  rows.value = [...rows.value]
}
function actionsFor(u: CmsUser) {
  const base = [
    { key: 'edit', label: 'Otevřít účet', icon: 'edit' },
    { key: 'password', label: 'Poslat odkaz na změnu hesla', icon: 'mail' },
    { key: 'block', label: u.status === 'blocked' ? 'Odblokovat účet' : 'Zablokovat účet', icon: 'user' },
  ]
  if (isSelf(u)) return base
  return [
    ...base,
    { key: 'impersonate', label: 'Přihlásit se jako', icon: 'eye' },
    { key: 'delete', label: 'Smazat účet', icon: 'trash', danger: true },
  ]
}
const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3000)
}
function onRowAction(key: string, u: CmsUser) {
  if (key === 'edit') goEdit(u.id)
  else if (key === 'block') toggleBlock(u)
  else if (key === 'impersonate') impersonateTarget.value = u
  else if (key === 'delete') deleteTarget.value = u
  else if (key === 'password') fireToast(`Odkaz na změnu hesla odešel na ${u.email}`)
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((u) => u.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}

/* ---------- Hromadné akce (vlastní účet se nevybírá) ---------- */
const selected = ref<Set<string>>(new Set())
const selectable = computed(() => visible.value.filter((u) => !isSelf(u)))
const allSelected = computed(
  () => selectable.value.length > 0 && selectable.value.every((u) => selected.value.has(u.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) selectable.value.forEach((u) => next.add(u.id))
  else selectable.value.forEach((u) => next.delete(u.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
function bulkBlock(block: boolean) {
  rows.value = rows.value.map((u) =>
    selected.value.has(u.id) ? { ...u, status: block ? ('blocked' as const) : ('active' as const) } : u,
  )
  selected.value = new Set()
}
function bulkDelete() {
  rows.value = rows.value.filter((u) => !selected.value.has(u.id))
  selected.value = new Set()
}

/* ---------- Zobrazení ---------- */
function goNew() {
  router.push({ name: 'user-new' })
}
function goEdit(id: string) {
  router.push({ name: 'user-edit', params: { id } })
}
/** Krátký popis oprávnění do řádku. */
function permSummary(u: CmsUser): string {
  if (isSuperadmin(u)) return 'Správa všeho'
  const n = permissionCount(u)
  return n === 0 ? 'Bez oprávnění' : `${n} z ${MODULE_PERMISSIONS.length} modulů`
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">user</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/users</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Uživatelé</h1>
        <p class="mt-1 text-[13px] text-steel-500">
          Účty do administrace a jejich oprávnění. Zákaznické účty e-shopu jsou jinde — tyhle jsou pro redakci.
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nový uživatel
      </AppButton>
    </div>

    <!-- Filtr -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stav účtu</label>
          <AppSelect v-model="filterState" :options="stateOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Oprávnění</label>
          <AppSelect v-model="filterPerm" :options="permOptions" />
        </div>
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      </div>
    </div>

    <!-- Hromadné akce -->
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="selected.size > 0"
        class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
      >
        <span class="text-[13px] font-600 text-brand-700">
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'účet' : selected.size < 5 ? 'účty' : 'účtů' }}
        </span>
        <div class="flex items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">
            Zrušit výběr
          </button>
          <AppButton variant="secondary" size="sm" @click="bulkBlock(true)">
            <Icon name="user" :size="15" /> Zablokovat
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="bulkBlock(false)">
            <Icon name="check" :size="15" /> Odblokovat
          </AppButton>
          <DialogRoot>
            <DialogTrigger as-child>
              <AppButton variant="danger" size="sm">
                <Icon name="trash" :size="15" /> Smazat vybrané
              </AppButton>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
              <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
                  <Icon name="trash" :size="22" />
                </div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">
                  Smazat {{ selected.size }} {{ selected.size === 1 ? 'účet' : 'účtů' }}?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Účty se odstraní a jejich majitelé se nebudou moci přihlásit. Obsah, který vytvořili, zůstane —
                  u záznamů zbyde jen jméno autora.
                </DialogDescription>
                <div class="mt-5 flex justify-end gap-2">
                  <DialogClose as-child><AppButton variant="secondary">Zrušit</AppButton></DialogClose>
                  <DialogClose as-child><AppButton variant="danger" @click="bulkDelete">Smazat</AppButton></DialogClose>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </div>
      </div>
    </Transition>

    <!-- Tabulka -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-10 px-4 py-3">
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white outline-none data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                aria-label="Vybrat vše"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator><Icon name="check" :size="11" class="text-white" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Uživatel</th>
            <th class="w-44 px-2 py-3 font-600">Oprávnění</th>
            <th class="w-36 px-2 py-3 font-600">Stav</th>
            <th class="w-36 px-2 py-3 font-600">Poslední přihlášení</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in visible"
            :key="u.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
            :class="selected.has(u.id) && 'bg-brand-50/60'"
          >
            <td class="px-4 py-2.5 align-middle">
              <CheckboxRoot
                v-if="!isSelf(u)"
                :model-value="selected.has(u.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white outline-none data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                :aria-label="`Vybrat ${u.name}`"
                @update:model-value="(v) => toggleOne(u.id, v)"
              >
                <CheckboxIndicator><Icon name="check" :size="11" class="text-white" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(u.id)">
                <UserAvatar :name="u.name" :size="34" />
                <span class="min-w-0">
                  <span class="flex items-center gap-2">
                    <span class="truncate text-[13.5px] font-600 text-graphite-800 group-hover:text-brand-600">
                      {{ u.name || 'Bez jména' }}
                    </span>
                    <span v-if="isSelf(u)" class="rounded bg-steel-100 px-1.5 py-0.5 text-[10.5px] font-600 text-steel-500">
                      to jste vy
                    </span>
                  </span>
                  <span class="block truncate font-mono text-[11px] text-steel-400">{{ u.login }} · {{ u.email }}</span>
                </span>
              </button>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span
                class="text-[12.5px]"
                :class="isSuperadmin(u) ? 'font-600 text-brand-700' : u.permissions.length ? 'text-graphite-700' : 'text-steel-400'"
              >
                {{ permSummary(u) }}
              </span>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <div class="flex flex-col items-start gap-1">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                  :class="[USER_STATE_META[userState(u)].bg, USER_STATE_META[userState(u)].text]"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="USER_STATE_META[userState(u)].dot" />
                  {{ USER_STATE_META[userState(u)].label }}
                </span>
                <span v-if="passwordExpiringSoon(u)" class="inline-flex items-center gap-1 text-[10.5px] font-600 text-amber-600">
                  <Icon name="clock" :size="11" /> Heslo brzy vyprší
                </span>
              </div>
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700 tabular-nums">
              {{ fmtDate(u.lastLogin) }}
            </td>
            <td class="px-3 py-2.5 text-right align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="actionsFor(u)" label="Akce s účtem" @select="(key) => onRowAction(key, u)" />
              </div>
            </td>
          </tr>
          <tr v-if="visible.length === 0">
            <td colspan="6" class="px-4 py-14 text-center">
              <Icon name="user" :size="26" class="mx-auto mb-2 text-steel-300" />
              <p class="text-[14px] font-600 text-graphite-800">Žádný účet neodpovídá filtru</p>
              <p class="mt-1 text-[12.5px] text-steel-500">Zrušte filtry, nebo založte nový účet.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-[12px] text-steel-500">
      Zobrazeno {{ visible.length }} z {{ rows.length }} účtů.
    </p>

    <!-- Potvrzení smazání jednoho účtu -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Smazat účet {{ deleteTarget?.name }}?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Uživatel se přestane dostat do administrace. Obsah, který vytvořil, zůstane — u záznamů zbyde jen jeho jméno.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat účet</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Potvrzení přihlášení za uživatele -->
    <DialogRoot :open="!!impersonateTarget" @update:open="(v) => !v && (impersonateTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
            <Icon name="eye" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Přihlásit se jako {{ impersonateTarget?.name }}?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Uvidíte administraci jeho očima — jen moduly, na které má oprávnění. Zpět se vrátíte odhlášením.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="impersonateTarget = null">Zrušit</AppButton>
            <AppButton
              variant="primary"
              @click="fireToast(`Prototyp — přihlášení za ${impersonateTarget?.name} se nesimuluje`); impersonateTarget = null"
            >
              Přihlásit se
            </AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="check" :size="16" class="text-forge-500" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
