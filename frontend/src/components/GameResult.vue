<script setup lang="ts">
import type { GameState } from '@cloatscheeten/shared/types'

defineProps<{
  gameState: GameState
}>()
</script>

<template>
  <div class="result">
    <h2 class="result-title">Spiel beendet!</h2>

    <div
      class="winner"
      v-if="gameState.winner"
      :style="{ color: gameState.winner === 'a' ? gameState.teamA.color : gameState.teamB.color }"
    >
      {{ gameState.winner === 'a' ? gameState.teamA.name : gameState.teamB.name }} gewinnt!
    </div>
    <div class="winner draw" v-else>Unentschieden!</div>

    <div class="scores">
      <div class="score-row">
        <span class="team-name" :style="gameState.winner === 'a' ? { color: gameState.teamA.color, fontWeight: 700 } : {}">
          {{ gameState.teamA.name }}
        </span>
        <span class="score">{{ gameState.teamA.throws }}</span>
      </div>
      <div class="vs">vs</div>
      <div class="score-row">
        <span class="team-name" :style="gameState.winner === 'b' ? { color: gameState.teamB.color, fontWeight: 700 } : {}">
          {{ gameState.teamB.name }}
        </span>
        <span class="score">{{ gameState.teamB.throws }}</span>
      </div>
    </div>

    <p class="fewer-wins">Weniger Wuerfe = Gewinner</p>
  </div>
</template>

<style scoped>
.result {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 2rem 1.5rem;
  text-align: center;
}

.result-title {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.winner {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

.winner.draw {
  color: var(--color-warning);
}

.scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.score-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 280px;
  font-size: 1.2rem;
}

.team-name {
  color: var(--color-text-muted);
}

.score {
  font-weight: 800;
  font-size: 1.4rem;
}

.vs {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.fewer-wins {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
