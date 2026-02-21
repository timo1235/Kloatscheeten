<script setup lang="ts">
import { ref } from 'vue'
import type { GameState, Team } from '@cloatscheeten/shared/types'

const props = defineProps<{
  gameState: GameState
}>()

const emit = defineEmits<{
  addPlayer: [team: Team, name: string]
  removePlayer: [team: Team, index: number]
  reorderPlayers: [team: Team, newOrder: string[]]
  setThrower: [team: Team, index: number]
}>()

const newPlayerA = ref('')
const newPlayerB = ref('')

function addPlayer(team: Team) {
  const input = team === 'a' ? newPlayerA : newPlayerB
  const name = input.value.trim()
  if (!name) return
  emit('addPlayer', team, name)
  input.value = ''
}

function onRemovePlayer(team: Team, index: number) {
  emit('removePlayer', team, index)
}

function movePlayer(team: Team, fromIndex: number, direction: -1 | 1) {
  const players = team === 'a'
    ? [...props.gameState.teamA.players]
    : [...props.gameState.teamB.players]
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= players.length) return
  ;[players[fromIndex], players[toIndex]] = [players[toIndex], players[fromIndex]]
  emit('reorderPlayers', team, players)
}

function onSetThrower(team: Team, index: number) {
  emit('setThrower', team, index)
}
</script>

<template>
  <div class="player-manager">
    <div class="manager-content">
      <div
        v-for="(entry, idx) in ([
          { team: 'a' as Team, state: gameState.teamA, newPlayer: newPlayerA },
          { team: 'b' as Team, state: gameState.teamB, newPlayer: newPlayerB },
        ])"
        :key="idx"
        class="team-section"
      >
        <h3 class="team-title" :style="{ color: entry.state.color }">{{ entry.state.name }}</h3>
        <ul class="manage-list">
          <li
            v-for="(player, i) in entry.state.players"
            :key="i"
            class="manage-item"
          >
            <span class="manage-name">{{ player }}</span>
            <button
              class="badge-thrower"
              :class="{ active: i === entry.state.currentThrowerIndex % entry.state.players.length }"
              :style="i === entry.state.currentThrowerIndex % entry.state.players.length ? { background: `color-mix(in srgb, ${entry.state.color} 15%, transparent)`, color: entry.state.color } : {}"
              @click="onSetThrower(entry.team, i)"
              title="Als Werfer setzen"
            >Wirft</button>
            <button
              class="btn-icon"
              :disabled="i === 0"
              @click="movePlayer(entry.team, i, -1)"
              title="Nach oben"
            >&#9650;</button>
            <button
              class="btn-icon"
              :disabled="i === entry.state.players.length - 1"
              @click="movePlayer(entry.team, i, 1)"
              title="Nach unten"
            >&#9660;</button>
            <button
              class="btn-icon btn-remove"
              :disabled="entry.state.players.length <= 2"
              @click="onRemovePlayer(entry.team, i)"
              title="Entfernen"
            >&#10005;</button>
          </li>
        </ul>
        <form
          v-if="entry.state.players.length < 8"
          class="add-form"
          @submit.prevent="addPlayer(entry.team)"
        >
          <input
            v-if="entry.team === 'a'"
            v-model="newPlayerA"
            class="add-input"
            placeholder="Neuer Spieler"
            maxlength="50"
          />
          <input
            v-else
            v-model="newPlayerB"
            class="add-input"
            placeholder="Neuer Spieler"
            maxlength="50"
          />
          <button type="submit" class="btn-add">+</button>
        </form>
        <p v-else class="max-hint">Max. 8 Spieler erreicht</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-manager {
  margin-top: 0.25rem;
}

.manager-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-section {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 0.75rem;
}

.team-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.manage-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.manage-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0;
}

.manage-name {
  flex: 1;
  font-size: 0.85rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-thrower {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-surface-light);
  color: var(--color-text-muted);
  cursor: pointer;
  border: none;
}

.badge-thrower.active {
  /* color set via inline style */
}

.btn-icon {
  background: var(--color-surface-light);
  color: var(--color-text-muted);
  border: none;
  width: 1.8rem;
  height: 1.8rem;
  font-size: 0.7rem;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.btn-icon:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.btn-remove:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
}

.add-form {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.add-input {
  flex: 1;
  background: var(--color-surface-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.add-input::placeholder {
  color: var(--color-text-muted);
}

.btn-add {
  background: var(--color-primary);
  color: white;
  width: 2.2rem;
  font-size: 1.2rem;
  font-weight: 700;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.max-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.4rem;
}
</style>
