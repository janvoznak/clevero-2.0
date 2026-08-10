<script setup lang="ts">
/**
 * Sjednocená galerie modulu = dvě vizuálně oddělené karty nad sebou:
 *  1) Připojené galerie z modulu Galerie (RelationPicker nad `galleryIds`)
 *  2) Fotky nahrané přímo v tomto modulu (GalleryManager nad `photos`)
 * Jeden prvek = jedna komponenta → záložka Galerie vypadá a chová se všude stejně.
 * Karty staví na sdílené FormSection (jednotná hlavička s ikonou + tag).
 * Prototyp — nahrávání i připojování je jen vizuální.
 */
import { galleryOptionsList } from '@/data/mockGalleries'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import FormSection from '@/components/admin/FormSection.vue'
import type { GalleryImage } from '@/data/types'

withDefaults(
  defineProps<{
    /** field-tag chip u připojených galerií, např. „news-gallery_ids". */
    linkTag?: string
    /** field-tag chip u přímo nahraných fotek, např. „news-gallery". */
    photosTag?: string
  }>(),
  { linkTag: '', photosTag: '' },
)

const galleries = defineModel<string[]>('galleries', { default: () => [] })
const photos = defineModel<GalleryImage[]>('photos', { default: () => [] })

const galleryItems = galleryOptionsList()
</script>

<template>
  <div class="space-y-5">
    <!-- 1) Připojené galerie z modulu Galerie -->
    <FormSection
      title="Připojené galerie z modulu Galerie"
      icon="gallery"
      hint="Vyber existující galerie z modulu Galerie — fotky se nahrávají tam, tady se jen připojí a zobrazí na webu."
      :tag="linkTag"
    >
      <RelationPicker
        v-model="galleries"
        :items="galleryItems"
        add-label="Připojit galerii"
        empty-label="Zatím žádná připojená galerie."
        search-placeholder="Hledat galerii…"
        icon="gallery"
        item-route-name="gallery-edit"
        create-route-name="gallery-new"
        create-label="Založit novou galerii"
      />
    </FormSection>

    <!-- 2) Fotky nahrané přímo v tomto modulu -->
    <FormSection
      title="Fotky nahrané přímo zde"
      icon="upload"
      hint="Fotky nahrané přímo do tohoto záznamu. První obrázek (★) je hlavní."
      :tag="photosTag"
    >
      <GalleryManager v-model="photos" />
    </FormSection>
  </div>
</template>
