<script setup lang="ts">
/** Minimalistická sada ikon (stroke, feather-styl). */
const props = defineProps<{ name: string; size?: number }>()

const paths: Record<string, string> = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  news: 'M4 4h13v16H4zM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h5',
  blog: 'M12 20h9M3 20h4M4 4h16v9H4zM8 8h8',
  page: 'M6 2h9l5 5v15H6zM15 2v5h5',
  faq: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5M12 17h.01',
  gallery: 'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-5-5L5 21',
  reference: 'M8 6h11M8 12h11M8 18h11M3 6h.01M3 12h.01M3 18h.01',
  media: 'M3 5h18v14H3zM3 9h18M8 5v4M16 5v4M9 14l3 2-3 2z',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1.1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.9-1.1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.9 1.1l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.1l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.9 1.1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.6c.06-.36.1-.73.1-1.1z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  edit: 'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  star: 'M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-5-4.9 6.9-1z',
  upload: 'M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  image: 'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-5-5L5 21',
  paperclip: 'M21 11.5l-8.8 8.8a5 5 0 0 1-7.1-7.1l8.8-8.8a3.3 3.3 0 0 1 4.7 4.7l-8.8 8.8a1.7 1.7 0 0 1-2.4-2.4l8.1-8.1',
  calendar: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  sparkles: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 14l.6 1.4L7 16l-1.4.6L5 18l-.6-1.4L3 16l1.4-.6z',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  popup: 'M3 5h18v14H3zM11 11h7v5h-7z',
  layout: 'M4 4h16v16H4zM4 10h16M10 10v10',
  resize: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  cursor: 'M4 4l7 16 2-7 7-2z',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  code: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14',
  cookie: 'M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4M9 12h.01M13 15h.01M15 9h.01',
  subpage: 'M9 5H5v14h14v-8M14 4h6v6M20 4l-8 8',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  file: 'M6 2h9l5 5v15H6zM15 2v5h5',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  layers: 'M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  ticket: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4zM15 6v12',
  briefcase: 'M4 7h16v13H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16',
  education: 'M12 4L2 9l10 5 10-5zM5 11v5c0 1.5 3 3 7 3s7-1.5 7-3v-5M21 9v6',
  grant: 'M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6.5 9h.01M17.5 15h.01',
  integration: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 3v6M12 15v6M3 12h6M15 12h6',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2',
}
</script>

<template>
  <svg
    :width="props.size ?? 18"
    :height="props.size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[props.name] ?? ''" />
  </svg>
</template>
