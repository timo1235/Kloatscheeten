<script setup lang="ts">
import { ref } from 'vue'
import type { GameState, Team } from '@cloatscheeten/shared/types'

const props = defineProps<{
  gameState: GameState
  pending: boolean
}>()

const emit = defineEmits<{
  throw: [team: Team]
  undo: []
  end: []
}>()

const showConfirmEnd = ref(false)

const canUndo = () => props.gameState.teamA.throws > 0 || props.gameState.teamB.throws > 0

function confirmEnd() {
  showConfirmEnd.value = true
}

function doEnd() {
  showConfirmEnd.value = false
  emit('end')
}
</script>

<template>
  <div class="controls">
    <div class="throw-buttons">
      <button
        class="btn-throw"
        :disabled="pending"
        @click="emit('throw', 'a')"
      >
        Wurf {{ gameState.teamA.name }}
      </button>
      <button
        class="btn-throw"
        :disabled="pending"
        @click="emit('throw', 'b')"
      >
        Wurf {{ gameState.teamB.name }}
      </button>
    </div>

    <button
      class="btn-undo"
      :disabled="pending || !canUndo()"
      @click="emit('undo')"
    >
      Rueckgaengig
    </button>

    <div v-if="!showConfirmEnd">
      <button class="btn-end" @click="confirmEnd">Spiel beenden</button>
    </div>
    <div v-else class="confirm-end">
      <p>Spiel wirklich beenden?</p>
      <div class="confirm-buttons">
        <button class="btn-confirm-yes" @click="doEnd">Ja, beenden</button>
        <button class="btn-confirm-no" @click="showConfirmEnd = false">Abbrechen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0;
}

.throw-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-throw {
  background: var(--color-primary);
  color: white;
  padding: 1.25rem 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  min-height: 64px;
}

.btn-throw:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-throw:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-undo {
  background: var(--color-surface-light);
  color: var(--color-text-muted);
  padding: 0.65rem;
}

.btn-undo:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-end {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  width: 100%;
  padding: 0.65rem;
  font-size: 0.9rem;
}

.confirm-end {
  background: rgba(229, 57, 53, 0.1);
  border: 1px solid rgba(229, 57, 53, 0.3);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
}

.confirm-end p {
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.confirm-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-confirm-yes {
  flex: 1;
  background: var(--color-danger);
  color: white;
}

.btn-confirm-no {
  flex: 1;
  background: var(--color-surface-light);
  color: var(--color-text);
}
</style>
