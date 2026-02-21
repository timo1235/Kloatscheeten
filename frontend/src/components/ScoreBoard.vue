<script setup lang="ts">
import type { TeamState } from '@cloatscheeten/shared/types'
import { getCurrentThrower } from '@cloatscheeten/shared/types'

defineProps<{
  team: TeamState
  label: string
}>()
</script>

<template>
  <div class="score-card">
    <div class="team-name">{{ team.name }}</div>
    <div class="throws">{{ team.throws }}</div>
    <div class="throws-label">Wuerfe</div>
    <div class="thrower">
      Naechster: <strong>{{ getCurrentThrower(team) }}</strong>
    </div>
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

.thrower {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.thrower strong {
  color: var(--color-text);
}
</style>
