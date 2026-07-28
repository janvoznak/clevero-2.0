<script setup lang="ts">
import AppSidebar from '@/components/admin/AppSidebar.vue'
import AppTopbar from '@/components/admin/AppTopbar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar />
      <main class="scroll-thin flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
