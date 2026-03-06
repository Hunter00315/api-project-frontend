<template>
  <div class="layout">
    <NavBar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global toast notifications -->
    <div class="toast-container">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
      >
        <span>{{ t.icon }}</span>
        <span>{{ t.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import NavBar from './components/NavBar.vue'

const toasts = ref([])
let nextId = 0

function showToast(message, type = 'success', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  const id = ++nextId
  toasts.value.push({ id, message, type, icon: icons[type] ?? 'ℹ️' })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

provide('showToast', showToast)
</script>
