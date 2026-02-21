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
  --color-bg: #0f1a0f;
  --color-surface: #1a2e1a;
  --color-surface-light: #243824;
  --color-primary: #4caf50;
  --color-primary-hover: #66bb6a;
  --color-danger: #e53935;
  --color-danger-hover: #ef5350;
  --color-warning: #ff9800;
  --color-text: #e8f5e9;
  --color-text-muted: #a5d6a7;
  --color-border: #2e5a2e;
  --radius: 12px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
