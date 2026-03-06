<template>
  <div>
    <div class="page-header flex items-center justify-between">
      <div>
        <h1>Reservations</h1>
        <p>Manage all booked appointments</p>
      </div>
      <button class="btn btn-outline btn-sm" @click="loadReservations" :disabled="loading">
        ↻ Refresh
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-center">
        <div class="spinner"></div>
        <span>Loading reservations…</span>
      </div>

      <div v-else-if="error" class="alert alert-error">{{ error }}</div>

      <!-- Empty state -->
      <div v-else-if="!reservations.length" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Reservations Yet</h3>
        <p>When appointments are booked they will appear here.</p>
        <router-link to="/appointments" class="btn btn-primary mt-16">
          📅 Book an Appointment
        </router-link>
      </div>

      <!-- Table -->
      <div v-else>
        <div class="res-summary text-sm text-muted mb-16">
          {{ reservations.length }} reservation{{ reservations.length !== 1 ? 's' : '' }} found
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reservation ID</th>
                <th>Patient Name</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in reservations" :key="r.reservation_id">
                <td class="text-muted text-sm">{{ idx + 1 }}</td>
                <td>
                  <code class="res-id">{{ r.reservation_id?.slice(0, 8) }}…</code>
                </td>
                <td><strong>{{ r.patient_name }}</strong></td>
                <td>{{ r.doctor }}</td>
                <td><span class="badge badge-primary">{{ r.time }}</span></td>
                <td>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="promptCancel(r)"
                    :disabled="cancelling === r.reservation_id"
                  >
                    <span v-if="cancelling === r.reservation_id" class="mini-spin"></span>
                    <span v-else>✕ Cancel</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm cancel modal -->
    <transition name="fade">
      <div v-if="confirmTarget" class="modal-overlay" @click.self="confirmTarget = null">
        <div class="modal" style="max-width:420px">
          <div class="modal-header">
            <h3>Cancel Appointment</h3>
            <button class="modal-close" @click="confirmTarget = null">✕</button>
          </div>
          <div class="confirm-body">
            <div class="confirm-icon">⚠️</div>
            <p>
              Are you sure you want to cancel the appointment for
              <strong>{{ confirmTarget.patient_name }}</strong> with
              <strong>{{ confirmTarget.doctor }}</strong> at
              <strong>{{ confirmTarget.time }}</strong>?
            </p>
            <p class="text-sm text-muted" style="margin-top:8px">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="confirmTarget = null">Keep It</button>
            <button class="btn btn-danger" @click="doCancel">Yes, Cancel</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { reservationApi } from '../api/index.js'

const showToast = inject('showToast')

const reservations  = ref([])
const loading       = ref(false)
const error         = ref('')
const cancelling    = ref(null)
const confirmTarget = ref(null)

async function loadReservations() {
  loading.value = true
  error.value   = ''
  try {
    const res = await reservationApi.getAll()
    reservations.value = res.data.reservations || []
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load reservations.'
  } finally {
    loading.value = false
  }
}

function promptCancel(r) {
  confirmTarget.value = r
}

async function doCancel() {
  const r = confirmTarget.value
  confirmTarget.value = null
  cancelling.value    = r.reservation_id
  try {
    await reservationApi.cancel(r.reservation_id)
    showToast(`Appointment for ${r.patient_name} has been cancelled.`, 'info')
    await loadReservations()
  } catch (e) {
    const msg = e.response?.data?.error || 'Failed to cancel. Please try again.'
    showToast(msg, 'error')
  } finally {
    cancelling.value = null
  }
}

onMounted(loadReservations)
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 56px 24px;
  color: var(--gray-500);
}
.empty-icon  { font-size: 3.5rem; margin-bottom: 12px; }
.empty-state h3 { color: var(--gray-700); margin-bottom: 6px; }

.res-summary { margin-bottom: 12px; }

.res-id {
  font-family: monospace;
  font-size: 0.75rem;
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--gray-600);
}

.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 8px 0 4px;
}
.confirm-icon { font-size: 2.5rem; }

.mini-spin {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
</style>
