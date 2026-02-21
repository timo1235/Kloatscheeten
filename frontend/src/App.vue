<script setup lang="ts">
</script>

<template>
  <RouterView />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #0f1115;
  --color-surface: #1a1d23;
  --color-surface-light: #252830;
  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-danger: #ef4444;
  --color-danger-hover: #f87171;
  --color-warning: #f59e0b;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-border: #2d3140;
  --radius: 10px;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  min-height: 100dvh;
  -webkit-tap-highlight-color: transparent;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: background 0.15s, transform 0.1s;
}

button:active {
  transform: scale(0.97);
}

input {
  font-family: inherit;
  font-size: 1rem;
  padding: 0.65rem 0.9rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
  width: 100%;
}

input:focus {
  border-color: var(--color-primary);
}

input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}
</style>
