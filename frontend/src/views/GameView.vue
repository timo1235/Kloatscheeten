<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameRoom } from '@/composables/useGameRoom'
import ConnectionBanner from '@/components/ConnectionBanner.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import AdminControls from '@/components/AdminControls.vue'
import GameResult from '@/components/GameResult.vue'
import PlayerManager from '@/components/PlayerManager.vue'
import type { Team } from '@cloatscheeten/shared/types'

const props = defineProps<{ id: string }>()

// Consume admin token from URL query before useGameRoom reads localStorage
const route = useRoute()
const router = useRouter()
const adminQueryToken = route.query.admin as string | undefined
if (adminQueryToken) {
  localStorage.setItem(`adminToken:${props.id}`, adminQueryToken)
  router.replace({ path: route.path })
}

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
  addPlayer,
  removePlayer,
  reorderPlayers,
  setThrower,
} = useGameRoom(props.id)

const shareMsg = ref('')
const activeTab = ref<'spiel' | 'spieler' | 'teilen'>('spiel')

function copyViewerLink() {
  const url = `${location.origin}/game/${props.id}`
  navigator.clipboard.writeText(url).then(() => {
    shareMsg.value = 'Link kopiert!'
    setTimeout(() => shareMsg.value = '', 2000)
  })
}

function copyAdminLink() {
  const token = localStorage.getItem(`adminToken:${props.id}`)
  if (!token) return
  const url = `${location.origin}/game/${props.id}?admin=${token}`
  navigator.clipboard.writeText(url).then(() => {
    shareMsg.value = 'Admin-Link kopiert! Nur an Vertrauenspersonen weitergeben.'
    setTimeout(() => shareMsg.value = '', 3000)
  })
}
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
      <div class="game-content" :class="{ 'has-bottom-nav': isAdmin }">
        <div class="game-header">
          <h1>Kloatscheeten</h1>
          <span v-if="isAdmin" class="admin-badge">Admin</span>
        </div>

        <!-- Error toast -->
        <div v-if="lastError" class="error-toast">{{ lastError.message }}</div>

        <!-- Tab: Spiel -->
        <template v-if="!isAdmin || activeTab === 'spiel'">
          <div class="scoreboards">
            <ScoreBoard
              :team="gameState.teamA"
              label="Team A"
              teamKey="a"
              :lastThrowTeam="gameState.lastThrowTeam"
            />
            <ScoreBoard
              :team="gameState.teamB"
              label="Team B"
              teamKey="b"
              :lastThrowTeam="gameState.lastThrowTeam"
            />
          </div>

          <AdminControls
            v-if="isAdmin"
            :gameState="gameState"
            :pending="pendingThrow"
            @throw="(team: Team) => throwForTeam(team)"
            @undo="undoLastThrow"
            @end="endGame"
          />

          <p v-if="!isAdmin" class="viewer-hint">Du schaust zu - nur der Admin kann Wuerfe zaehlen</p>
        </template>

        <!-- Tab: Spieler -->
        <template v-if="isAdmin && activeTab === 'spieler'">
          <PlayerManager
            :gameState="gameState"
            @addPlayer="addPlayer"
            @removePlayer="removePlayer"
            @reorderPlayers="reorderPlayers"
            @setThrower="setThrower"
          />
        </template>

        <!-- Tab: Teilen -->
        <template v-if="isAdmin && activeTab === 'teilen'">
          <div class="share-section">
            <h2 class="share-title">Link teilen</h2>
            <p class="share-desc">Teile den Link, damit andere das Spiel live verfolgen koennen.</p>
            <button class="btn-share-full" @click="copyViewerLink">Zuschauer-Link kopieren</button>
            <button class="btn-share-full btn-share-admin" @click="copyAdminLink">Admin-Link kopieren</button>
            <div v-if="shareMsg" class="share-msg">{{ shareMsg }}</div>
          </div>
        </template>
      </div>

      <!-- Bottom Tab Navigation (Admin only) -->
      <nav v-if="isAdmin" class="bottom-nav">
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'spiel' }"
          @click="activeTab = 'spiel'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Spiel</span>
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'spieler' }"
          @click="activeTab = 'spieler'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Spieler</span>
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'teilen' }"
          @click="activeTab = 'teilen'"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span>Teilen</span>
        </button>
      </nav>
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

.game-content.has-bottom-nav {
  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
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
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  padding: 0.6rem 1rem;
  border-radius: var(--radius);
  border: 1px solid rgba(239, 68, 68, 0.3);
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

/* Share tab */
.share-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.share-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.share-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.btn-share-full {
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
  width: 100%;
  text-align: center;
}

.btn-share-admin {
  color: var(--color-primary);
  border-color: rgba(99, 102, 241, 0.3);
}

.share-msg {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-primary);
  padding: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius);
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 100;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.6rem 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 0;
  transition: color 0.15s;
}

.nav-tab.active {
  color: var(--color-primary);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
