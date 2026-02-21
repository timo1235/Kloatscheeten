<script setup lang="ts">
import { computed } from 'vue'
import type { TeamState, Team } from '@cloatscheeten/shared/types'
import { getLastThrowerIndex } from '@cloatscheeten/shared/types'

const props = defineProps<{
  team: TeamState
  label: string
  teamKey: Team
  lastThrowTeam: Team | null
}>()

const len = computed(() => props.team.players.length)
const currentIdx = computed(() => props.team.currentThrowerIndex % len.value)
const nextIdx = computed(() => (currentIdx.value + 1) % len.value)
const lastIdx = computed(() => getLastThrowerIndex(props.team))
const showLast = computed(() => props.lastThrowTeam === props.teamKey)

function badgeFor(i: number): 'wirft' | 'danach' | 'zuletzt' | null {
  if (i === currentIdx.value) return 'wirft'
  if (i === nextIdx.value) return 'danach'
  if (showLast.value && i === lastIdx.value) return 'zuletzt'
  return null
}
</script>

<template>
  <div class="score-card">
    <div class="team-name">{{ team.name }}</div>
    <div class="throws">{{ team.throws }}</div>
    <div class="throws-label">Wuerfe</div>
    <ul class="player-list">
      <li
        v-for="(player, i) in team.players"
        :key="i"
        class="player-item"
        :class="{
          'is-wirft': badgeFor(i) === 'wirft',
          'is-danach': badgeFor(i) === 'danach',
        }"
      >
        <span class="player-name">{{ player }}</span>
        <span v-if="badgeFor(i) === 'wirft'" class="badge badge-wirft">Wirft</span>
        <span v-else-if="badgeFor(i) === 'danach'" class="badge badge-danach">Danach</span>
        <span v-else-if="badgeFor(i) === 'zuletzt'" class="badge badge-zuletzt">Zuletzt</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.score-card {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 1.25rem;
  text-align: center;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.throws {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.throws-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.player-item.is-wirft {
  color: var(--color-text);
  font-weight: 600;
  background: rgba(99, 102, 241, 0.15);
  border-left-color: #6366f1;
}

.player-item.is-danach {
  color: var(--color-text);
  background: rgba(56, 189, 248, 0.1);
  border-left-color: rgba(56, 189, 248, 0.4);
}

.player-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-wirft {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border: 1px solid #6366f1;
}

.badge-danach {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.badge-zuletzt {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}
</style>
