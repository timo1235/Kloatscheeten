<script setup lang="ts">
defineProps<{
  connected: boolean
  recovering: boolean
}>()
</script>

<template>
  <div v-if="!connected" class="banner">
    <span v-if="recovering">Verbindung wird wiederhergestellt...</span>
    <span v-else>Verbindung unterbrochen</span>
  </div>
</template>

<style scoped>
.banner {
  background: var(--color-warning);
  color: #0f1115;
  text-align: center;
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
