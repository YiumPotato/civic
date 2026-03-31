<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="app-shell">
    <nav class="top-nav">
      <div class="container flex items-center justify-between">
        <router-link to="/" class="brand">
          <span class="brand-icon">&#x270A;</span>
          <span class="brand-text">Civic</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.brand-icon {
  font-size: 1.25rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: color var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}
</style>
