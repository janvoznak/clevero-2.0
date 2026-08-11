<script setup lang="ts">
/**
 * Centrální správa taxonomie (štítky + kategorie) — vícejazyčné názvy.
 * Rozhodnutí: taxonomie se překládá JEDNOU tady, ne v pravém panelu detailu.
 * V záznamech se pojem referencuje českým názvem; ostatní jazyky jsou pro web.
 * Prototyp — pracuje jen s lokální kopií, „Uložit" je jen potvrzení.
 */
import { reactive, ref } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TaxonomyTable from './TaxonomyTable.vue'
import { NEWS_TAGS, NEWS_CATEGORIES, blankTerm, type TaxonomyTerm } from '@/data/mockTaxonomy'

/* Lokální kopie (prototyp — needitujeme sdílená data přímo). */
const tags = reactive<TaxonomyTerm[]>(JSON.parse(JSON.stringify(NEWS_TAGS)))
const categories = reactive<TaxonomyTerm[]>(JSON.parse(JSON.stringify(NEWS_CATEGORIES)))

const activeTab = ref<'tags' | 'categories'>('tags')

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function addTerm(list: TaxonomyTerm[]) {
  const t = blankTerm()
  t.id = `new-${list.length + 1}`
  list.push(t)
}
function removeTerm(list: TaxonomyTerm[], idx: number) {
  list.splice(idx, 1)
}

const saved = ref(false)
function save() {
  // Prototyp: doplníme chybějící id ze slugu CS názvu.
  ;[...tags, ...categories].forEach((t) => {
    if (!t.id || t.id.startsWith('new-')) t.id = slugify(t.label.cs) || t.id
  })
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="px-8 py-6 pb-16">
    <!-- Page header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">settings</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/taxonomy</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Štítky a kategorie
        </h1>
        <p class="mt-1.5 max-w-2xl text-[13.5px] text-steel-500">
          Centrální překlady taxonomie — přeložíte jednou tady a projeví se všude na webu.
          V detailu záznamu se štítky jen vybírají (jazykově nezávisle).
        </p>
      </div>
      <AppButton variant="primary" @click="save">
        <Icon :name="saved ? 'check' : 'save'" :size="16" />
        {{ saved ? 'Uloženo' : 'Uložit změny' }}
      </AppButton>
    </div>

    <div class="rounded-lg border border-steel-200 bg-white">
      <TabsRoot v-model="activeTab">
        <TabsList
          class="flex gap-1.5 border-b border-steel-200 bg-steel-50/60 px-3 pt-2"
          aria-label="Typ taxonomie"
        >
          <TabsTrigger
            v-for="t in [{ v: 'tags', label: 'Štítky' }, { v: 'categories', label: 'Kategorie' }]"
            :key="t.v"
            :value="t.v"
            class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
          >
            <Icon name="filter" :size="16" /> {{ t.label }}
          </TabsTrigger>
        </TabsList>

        <div class="p-5">
          <TabsContent value="tags" class="outline-none">
            <TaxonomyTable :list="tags" entity="štítek" @add="addTerm(tags)" @remove="(i) => removeTerm(tags, i)" />
          </TabsContent>
          <TabsContent value="categories" class="outline-none">
            <TaxonomyTable :list="categories" entity="kategorii" @add="addTerm(categories)" @remove="(i) => removeTerm(categories, i)" />
          </TabsContent>
        </div>
      </TabsRoot>
    </div>

    <!-- Toast -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="saved"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"
      >
        <Icon name="check" :size="16" class="text-forge-400" /> Překlady uloženy
      </div>
    </Transition>
  </div>
</template>
