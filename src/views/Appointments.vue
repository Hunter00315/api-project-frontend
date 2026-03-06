<template>
  <div>
    <div class="page-header flex items-center justify-between">
      <div>
        <h1>Appointments</h1>
        <p>Browse available slots and book your appointment</p>
      </div>
      <button class="btn btn-outline btn-sm" @click="loadSlots" :disabled="loading">
        ↻ Refresh
      </button>
    </div>

    <!-- Doctor filter tabs -->
    <div class="filter-tabs mb-20">
      <button
        v-for="doc in doctors"
        :key="doc"
        class="filter-tab"
        :class="{ active: filter === doc }"
        @click="filter = doc"
      >
        {{ doc }}
        <span v-if="doc !== 'All'" class="tab-count">
          {{ slotCounts[doc] ?? 0 }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card loading-center">
      <div class="spinner"></div>
      <span>Loading slots…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Slots -->
    <div v-else>
      <template v-if="filteredDoctors.length">
        <div v-for="doctor in filteredDoctors" :key="doctor" class="doctor-section">
          <div class="doctor-header">
            <span class="doctor-avatar">👨‍⚕️</span>
            <h3>{{ doctor }}</h3>
            <span class="badge badge-primary">
              {{ slotsByDoctor[doctor].filter(s => s.available).length }} available
            </span>
          </div>
          <div class="grid-4">
            <div
              v-for="slot in slotsByDoctor[doctor]"
              :key="`${slot.doctor}-${slot.time}`"
              class="slot-card"
              :class="slot.available ? 'slot-open' : 'slot-booked'"
            >
              <div class="slot-time">{{ slot.time }}</div>
              <span class="badge" :class="slot.available ? 'badge-success' : 'badge-danger'">
                {{ slot.available ? 'Available' : 'Booked' }}
              </span>
              <button
                v-if="slot.available"
                class="btn btn-primary btn-sm slot-btn"
                @click="openModal(slot)"
              >
                Book Now
              </button>
              <div v-else class="slot-na">—</div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="card" style="text-align:center;padding:48px;color:var(--gray-400)">
        No slots found for the selected filter.
      </div>
    </div>

    <!-- Booking modal -->
    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>Book Appointment</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <div v-if="bookError" class="alert alert-error">{{ bookError }}</div>

          <div class="form-group">
            <label class="form-label">Doctor</label>
            <input class="form-control" :value="form.doctor" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Time Slot</label>
            <input class="form-control" :value="form.time" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Patient Name <span style="color:var(--danger)">*</span></label>
            <input
              ref="nameInput"
              v-model="form.patient_name"
              class="form-control"
              placeholder="Enter your full name"
              @keyup.enter="submitBooking"
            />
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              @click="submitBooking"
              :disabled="submitting || !form.patient_name.trim()"
            >
              <span v-if="submitting" class="mini-spin"></span>
              <span v-else>✓ Confirm Booking</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { slotsApi, reservationApi } from '../api/index.js'

const showToast = inject('showToast')

const slots   = ref([])
const loading = ref(false)
const error   = ref('')
const filter  = ref('All')

const showModal   = ref(false)
const bookError   = ref('')
const submitting  = ref(false)
const nameInput   = ref(null)
const form = ref({ doctor: '', time: '', patient_name: '' })

const doctors = ['All', 'Dr Smith', 'Dr Jones', 'Dr Williams']

const slotsByDoctor = computed(() => {
  const src = filter.value === 'All' ? slots.value : slots.value.filter(s => s.doctor === filter.value)
  const map = {}
  for (const slot of src) {
    if (!map[slot.doctor]) map[slot.doctor] = []
    map[slot.doctor].push(slot)
  }
  return map
})

const filteredDoctors = computed(() => Object.keys(slotsByDoctor.value))

const slotCounts = computed(() => {
  const counts = {}
  for (const slot of slots.value) {
    if (!counts[slot.doctor]) counts[slot.doctor] = 0
    if (slot.available) counts[slot.doctor]++
  }
  return counts
})

async function loadSlots() {
  loading.value = true
  error.value   = ''
  try {
    const res = await slotsApi.getAll()
    slots.value = res.data.slots || []
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load slots. Is the backend running?'
  } finally {
    loading.value = false
  }
}

function openModal(slot) {
  form.value = { doctor: slot.doctor, time: slot.time, patient_name: '' }
  bookError.value = ''
  showModal.value = true
  nextTick(() => nameInput.value?.focus())
}

function closeModal() {
  showModal.value = false
  bookError.value = ''
}

async function submitBooking() {
  if (!form.value.patient_name.trim()) return
  submitting.value = true
  bookError.value  = ''
  try {
    const res = await reservationApi.create({
      patient_name: form.value.patient_name.trim(),
      doctor:       form.value.doctor,
      time:         form.value.time,
    })
    showToast(`Booked! ID: ${res.data.reservation_id?.slice(0, 8)}…`)
    closeModal()
    await loadSlots()
  } catch (e) {
    const msg = e.response?.data?.error
    if (msg === 'Slot is already booked') {
      bookError.value = 'This slot was just taken. Please choose another.'
      await loadSlots()
    } else {
      bookError.value = msg || 'Booking failed. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadSlots)
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }

.filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-tab {
  padding: 6px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 999px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}
.filter-tab:hover  { border-color: var(--primary); color: var(--primary); }
.filter-tab.active { background: var(--primary); color: white; border-color: var(--primary); }

.tab-count {
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-weight: 700;
}
.filter-tab:not(.active) .tab-count {
  background: var(--gray-100);
  color: var(--gray-500);
}

.doctor-section { margin-bottom: 32px; }

.doctor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.doctor-avatar { font-size: 1.5rem; }

.slot-card {
  padding: 18px 12px;
  border-radius: var(--radius);
  border: 2px solid var(--gray-200);
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  transition: var(--transition);
}
.slot-open  { border-color: #d1fae5; }
.slot-open:hover { border-color: var(--success); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.slot-booked { opacity: 0.55; background: var(--gray-50); }

.slot-time { font-size: 1.375rem; font-weight: 700; color: var(--gray-800); }
.slot-btn  { width: 100%; }
.slot-na   { color: var(--gray-300); font-size: 1.2rem; }

.mini-spin {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
</style>
