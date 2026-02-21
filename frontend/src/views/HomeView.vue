<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { CreateGameRequest, CreateGameResponse } from '@cloatscheeten/shared/types'

const router = useRouter()

const teamAName = ref('')
const teamBName = ref('')
const teamAPlayers = ref(['', ''])
const teamBPlayers = ref(['', ''])
const error = ref('')
const submitting = ref(false)

// Result after creation
const created = ref<CreateGameResponse | null>(null)

function addPlayer(team: 'a' | 'b') {
  const list = team === 'a' ? teamAPlayers : teamBPlayers
  if (list.value.length < 8) list.value.push('')
}

function removePlayer(team: 'a' | 'b', index: number) {
  const list = team === 'a' ? teamAPlayers : teamBPlayers
  if (list.value.length > 2) list.value.splice(index, 1)
}

const isValid = computed(() => {
  return (
    teamAName.value.trim().length > 0 &&
    teamBName.value.trim().length > 0 &&
    teamAPlayers.value.every((p) => p.trim().length > 0) &&
    teamBPlayers.value.every((p) => p.trim().length > 0)
  )
})

async function createGame() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  error.value = ''

  try {
    const body: CreateGameRequest = {
      teamAName: teamAName.value,
      teamBName: teamBName.value,
      teamAPlayers: teamAPlayers.value,
      teamBPlayers: teamBPlayers.value,
    }

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      error.value = data.errors?.join(', ') ?? 'Fehler beim Erstellen'
      return
    }

    const data: CreateGameResponse = await res.json()

    // Save admin token
    localStorage.setItem(`adminToken:${data.gameId}`, data.adminToken)

    created.value = data
  } catch (e) {
    error.value = 'Netzwerkfehler - Server erreichbar?'
  } finally {
    submitting.value = false
  }
}

function goToGame() {
  if (created.value) {
    router.push(`/game/${created.value.gameId}`)
  }
}

async function copyLink() {
  if (!created.value) return
  try {
    await navigator.clipboard.writeText(created.value.viewerUrl)
  } catch {
    // Fallback: select text
  }
}
</script>

<template>
  <div class="home">
    <header class="header">
      <h1>Kloatscheeten</h1>
      <p class="subtitle">Neues Spiel erstellen</p>
    </header>

    <!-- Created: Show result -->
    <div v-if="created" class="created">
      <div class="success-card">
        <h2>Spiel erstellt!</h2>

        <div class="link-section">
          <label>Link fuer Mitspieler:</label>
          <div class="link-row">
            <input :value="created.viewerUrl" readonly @click="($event.target as HTMLInputElement).select()" />
            <button class="btn-copy" @click="copyLink">Kopieren</button>
          </div>
          <p class="hint">Teile diesen Link per WhatsApp</p>
        </div>

        <button class="btn-primary btn-large" @click="goToGame">Zum Spiel</button>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="form" @submit.prevent="createGame">
      <div v-if="error" class="error">{{ error }}</div>

      <div class="team-section" v-for="(team, key) in { a: { name: teamAName, players: teamAPlayers, label: 'Team A' }, b: { name: teamBName, players: teamBPlayers, label: 'Team B' } }" :key="key">
        <h2>{{ team.label }}</h2>
        <input
          :value="key === 'a' ? teamAName : teamBName"
          @input="key === 'a' ? (teamAName = ($event.target as HTMLInputElement).value) : (teamBName = ($event.target as HTMLInputElement).value)"
          :placeholder="`${team.label} Name (z.B. Die Kloater)`"
          maxlength="50"
        />

        <div class="players">
          <div v-for="(_, i) in team.players" :key="i" class="player-row">
            <input
              :value="team.players[i]"
              @input="team.players[i] = ($event.target as HTMLInputElement).value"
              :placeholder="`Spieler ${i + 1}`"
              maxlength="50"
            />
            <button
              v-if="team.players.length > 2"
              type="button"
              class="btn-remove"
              @click="removePlayer(key as 'a' | 'b', i)"
            >x</button>
          </div>
          <button
            v-if="team.players.length < 8"
            type="button"
            class="btn-add"
            @click="addPlayer(key as 'a' | 'b')"
          >+ Spieler</button>
        </div>
      </div>

      <button type="submit" class="btn-primary btn-large" :disabled="!isValid || submitting">
        {{ submitting ? 'Erstelle...' : 'Spiel starten' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.home {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.8rem;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.team-section {
  background: var(--color-surface);
  padding: 1.25rem;
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-section h2 {
  font-size: 1.1rem;
  color: var(--color-primary);
}

.players {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-row {
  display: flex;
  gap: 0.5rem;
}

.player-row input {
  flex: 1;
}

.btn-remove {
  background: var(--color-danger);
  color: white;
  width: 2.5rem;
  padding: 0;
  font-size: 1rem;
}

.btn-add {
  background: var(--color-surface-light);
  color: var(--color-text-muted);
  padding: 0.5rem;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-large {
  padding: 1rem;
  font-size: 1.1rem;
}

.error {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.created {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.success-card {
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: center;
}

.success-card h2 {
  color: var(--color-primary);
}

.link-section {
  text-align: left;
}

.link-section label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
  display: block;
}

.link-row {
  display: flex;
  gap: 0.5rem;
}

.link-row input {
  flex: 1;
  font-size: 0.85rem;
}

.btn-copy {
  background: var(--color-surface-light);
  color: var(--color-text);
  white-space: nowrap;
  padding: 0.5rem 1rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}
</style>
