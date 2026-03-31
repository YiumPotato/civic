<script setup>
</script>

<template>
  <div class="shell">
    <nav class="top-nav">
      <div class="container flex center between">
        <router-link to="/" class="brand">
          <div class="logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">Civic</div>
            <div class="brand-sub">Coordination Platform</div>
          </div>
        </router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; }

.top-nav {
  background: #171717;
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo-box {
  width: 40px;
  height: 40px;
  background: var(--indigo);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
.brand-sub { font-size: 12px; color: var(--indigo-sub); line-height: 1.2; }

.main-content { flex: 1; padding: 16px 0 40px; }
</style>
