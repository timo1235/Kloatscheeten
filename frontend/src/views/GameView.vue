<script setup lang="ts">
import { useGameRoom } from '@/composables/useGameRoom'
import ConnectionBanner from '@/components/ConnectionBanner.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import AdminControls from '@/components/AdminControls.vue'
import GameResult from '@/components/GameResult.vue'
import type { Team } from '@cloatscheeten/shared/types'

const props = defineProps<{ id: string }>()

const {
  gameState,
  isConnected,
  isRecovering,
  isAdmin,
  isLoading,
  notFound,
  lastError,
  pendingThrow,
  throwForTeam,
  undoLastThrow,
  endGame,
} = useGameRoom(props.id)
</script>

<template>
  <div class="game">
    <ConnectionBanner :connected="isConnected" :recovering="isRecovering" />

    <!-- Loading -->
    <div v-if="isLoading" class="center-message">
      <p>Verbinde...</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="center-message">
      <h2>Spiel nicht gefunden</h2>
      <p>Pruefe den Link oder erstelle ein neues Spiel.</p>
      <RouterLink to="/" class="btn-home">Neues Spiel</RouterLink>
    </div>

    <!-- Game ended -->
    <template v-else-if="gameState?.status === 'ended'">
      <div class="game-content">
        <GameResult :gameState="gameState" />
        <RouterLink to="/" class="btn-home">Neues Spiel</RouterLink>
      </div>
    </template>

    <!-- Game active -->
    <template v-else-if="gameState">
      <div class="game-content">
        <div class="game-header">
          <h1>Kloatscheeten</h1>
          <span v-if="isAdmin" class="admin-badge">Admin</span>
        </div>

        <!-- Error toast -->
        <div v-if="lastError" class="error-toast">{{ lastError.message }}</div>

        <div class="scoreboards">
          <ScoreBoard :team="gameState.teamA" label="Team A" />
          <ScoreBoard :team="gameState.teamB" label="Team B" />
        </div>

        <AdminControls
          v-if="isAdmin"
          :gameState="gameState"
          :pending="pendingThrow"
          @throw="(team: Team) => throwForTeam(team)"
          @undo="undoLastThrow"
          @end="endGame"
        />

        <p v-else class="viewer-hint">Du schaust zu - nur der Admin kann Wuerfe zaehlen</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.game {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.game-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
  width: 100%;
  flex: 1;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.game-header h1 {
  font-size: 1.3rem;
}

.admin-badge {
  background: var(--color-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scoreboards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error-toast {
  background: rgba(229, 57, 53, 0.15);
  color: var(--color-danger);
  padding: 0.6rem 1rem;
  border-radius: var(--radius);
  border: 1px solid rgba(229, 57, 53, 0.3);
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.75rem;
}

.viewer-hint {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-top: 1.5rem;
}

.center-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.btn-home {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  margin-top: 0.5rem;
}
</style>
