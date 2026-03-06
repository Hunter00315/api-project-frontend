<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="navbar-brand">
        🏥 <span>HealthCare</span>
      </router-link>

      <button class="navbar-toggle" @click="open = !open" aria-label="Toggle navigation">
        <span>{{ open ? '✕' : '☰' }}</span>
      </button>

      <div class="navbar-links" :class="{ open }">
        <router-link to="/" @click="open = false">
          <span class="nav-icon">📊</span> Dashboard
        </router-link>
        <router-link to="/appointments" @click="open = false">
          <span class="nav-icon">📅</span> Appointments
        </router-link>
        <router-link to="/reservations" @click="open = false">
          <span class="nav-icon">📋</span> Reservations
        </router-link>
        <router-link to="/metrics" @click="open = false">
          <span class="nav-icon">💪</span> Health Metrics
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<style scoped>
.navbar {
  background: var(--primary);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.navbar-brand {
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.navbar-links {
  display: flex;
  gap: 2px;
}

.navbar-links a {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  padding: 7px 14px;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}
.navbar-links a:hover { background: rgba(255,255,255,0.15); color: white; }
.navbar-links a.router-link-active { background: rgba(255,255,255,0.22); color: white; }

.nav-icon { font-size: 0.9rem; }

.navbar-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
}

@media (max-width: 700px) {
  .navbar-toggle { display: block; }
  .navbar-links {
    display: none;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background: var(--primary-dark);
    flex-direction: column;
    padding: 8px 12px 12px;
    gap: 2px;
    box-shadow: var(--shadow-md);
  }
  .navbar-links.open { display: flex; }
  .navbar-links a { padding: 10px 12px; }
}
</style>
