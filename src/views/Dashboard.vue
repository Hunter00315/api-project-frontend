<template>
  <div>
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Healthcare Appointment System — Live Overview</p>
    </div>

    <!-- API Status -->
    <div class="card mb-20" :style="{ borderLeft: `4px solid ${apiOnline ? 'var(--success)' : 'var(--danger)'}` }">
      <div class="flex items-center justify-between">
        <div>
          <div class="card-title" style="margin-bottom:2px">🔌 API Status</div>
          <div class="text-sm text-muted">Backend: http://13.53.123.150:5000</div>
        </div>
        <div v-if="apiLoading"><div class="spinner"></div></div>
        <span v-else class="badge" :class="apiOnline ? 'badge-success' : 'badge-danger'">
          {{ apiOnline ? '● Online' : '● Offline' }}
        </span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid-3 mb-20">
      <div class="card stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ stats.available }}</div>
        <div class="stat-label">Available Slots</div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">👨‍⚕️</div>
        <div class="stat-value">3</div>
        <div class="stat-label">Doctors</div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ stats.booked }}</div>
        <div class="stat-label">Slots Booked</div>
      </div>
    </div>

    <!-- Weather + AQI -->
    <div class="grid-2">

      <!-- Weather -->
      <div class="card">
        <div class="card-title">🌤️ Weather</div>
        <div class="city-row">
          <input
            v-model="weatherCity"
            class="form-control"
            placeholder="Enter city..."
            @keyup.enter="loadWeather"
          />
          <button class="btn btn-primary btn-sm" @click="loadWeather" :disabled="weatherLoading">
            <span v-if="weatherLoading" class="mini-spin"></span>
            <span v-else>Search</span>
          </button>
        </div>
        <div v-if="weatherLoading" class="loading-center" style="padding:20px">
          <div class="spinner"></div>
        </div>
        <div v-else-if="weather" class="weather-body">
          <div class="weather-temp">{{ weather.temperature_c }}<span class="weather-unit">°C</span></div>
          <div class="weather-desc">{{ weather.description }}</div>
          <div class="weather-grid">
            <div class="weather-row"><span>💧</span>Humidity: {{ weather.humidity_percent }}%</div>
            <div class="weather-row"><span>🌬️</span>Wind: {{ weather.wind_speed_kmph }} km/h</div>
            <div class="weather-row"><span>🌡️</span>Feels like {{ weather.feels_like_c }}°C</div>
            <div class="weather-row"><span>📍</span>{{ weather.city }}</div>
          </div>
        </div>
        <div v-else-if="weatherError" class="alert alert-error">{{ weatherError }}</div>
        <div v-else class="empty-hint">Search for a city to see weather data.</div>
      </div>

      <!-- AQI -->
      <div class="card">
        <div class="card-title">🌫️ Air Quality Index</div>
        <div class="city-row">
          <input
            v-model="aqiCity"
            class="form-control"
            placeholder="Enter city..."
            @keyup.enter="loadAqi"
          />
          <button class="btn btn-primary btn-sm" @click="loadAqi" :disabled="aqiLoading">
            <span v-if="aqiLoading" class="mini-spin"></span>
            <span v-else>Search</span>
          </button>
        </div>
        <div v-if="aqiLoading" class="loading-center" style="padding:20px">
          <div class="spinner"></div>
        </div>
        <div v-else-if="aqi" class="aqi-body">
          <div class="aqi-score" :style="{ color: aqiColor }">{{ aqi.aqi }}</div>
          <div class="aqi-cat"  :style="{ color: aqiColor }">{{ aqiCategory }}</div>
          <div class="aqi-meta">
            <div>📍 <strong>{{ aqi.station }}</strong></div>
            <div>🔬 Dominant: <strong>{{ aqi.dominance_pollutant?.toUpperCase() }}</strong></div>
            <div>🕐 {{ aqi.time }}</div>
          </div>
          <div class="pollutant-chips">
            <template v-for="(val, key) in aqi.pollutants" :key="key">
              <span v-if="val !== null" class="p-chip">
                <b>{{ key.toUpperCase() }}</b> {{ val }}
              </span>
            </template>
          </div>
        </div>
        <div v-else-if="aqiError" class="alert alert-error">{{ aqiError }}</div>
        <div v-else class="empty-hint">Search for a city to see air quality data.</div>
      </div>

    </div>

    <!-- Quick links -->
    <div class="quick-links mt-20">
      <router-link to="/appointments" class="btn btn-primary">📅 Book Appointment</router-link>
      <router-link to="/reservations" class="btn btn-outline">📋 View Reservations</router-link>
      <router-link to="/metrics"      class="btn btn-outline">💪 Health Metrics</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { healthApi, slotsApi, weatherApi, aqiApi } from '../api/index.js'

const apiOnline    = ref(false)
const apiLoading   = ref(true)
const stats        = ref({ available: 0, booked: 0 })

const weatherCity    = ref('Dublin')
const weather        = ref(null)
const weatherLoading = ref(false)
const weatherError   = ref('')

const aqiCity    = ref('Dublin')
const aqi        = ref(null)
const aqiLoading = ref(false)
const aqiError   = ref('')

const aqiColor = computed(() => {
  if (!aqi.value) return '#6b7280'
  const v = aqi.value.aqi
  if (v <= 50)  return '#057a55'
  if (v <= 100) return '#9f580a'
  if (v <= 150) return '#c27803'
  if (v <= 200) return '#c81e1e'
  return '#7e3af2'
})

const aqiCategory = computed(() => {
  if (!aqi.value) return ''
  const v = aqi.value.aqi
  if (v <= 50)  return 'Good'
  if (v <= 100) return 'Moderate'
  if (v <= 150) return 'Unhealthy for Sensitive Groups'
  if (v <= 200) return 'Unhealthy'
  return 'Very Unhealthy'
})

async function checkHealth() {
  try { await healthApi.check(); apiOnline.value = true }
  catch { apiOnline.value = false }
  finally { apiLoading.value = false }
}

async function loadStats() {
  try {
    const res = await slotsApi.getAll()
    const slots = res.data.slots || []
    stats.value.available = slots.filter(s =>  s.available).length
    stats.value.booked    = slots.filter(s => !s.available).length
  } catch {}
}

async function loadWeather() {
  if (!weatherCity.value.trim()) return
  weatherLoading.value = true
  weatherError.value   = ''
  weather.value        = null
  try {
    const res = await weatherApi.get(weatherCity.value.trim())
    weather.value = res.data
  } catch (e) {
    weatherError.value = e.response?.data?.error || 'Failed to load weather data'
  } finally { weatherLoading.value = false }
}

async function loadAqi() {
  if (!aqiCity.value.trim()) return
  aqiLoading.value = true
  aqiError.value   = ''
  aqi.value        = null
  try {
    const res = await aqiApi.get(aqiCity.value.trim())
    if (res.data.error) { aqiError.value = res.data.error; return }
    aqi.value = res.data
  } catch (e) {
    aqiError.value = e.response?.data?.error || 'Failed to load AQI data'
  } finally { aqiLoading.value = false }
}

onMounted(() => {
  checkHealth()
  loadStats()
  loadWeather()
  loadAqi()
})
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }

.stat-card { text-align: center; transition: var(--transition); }
.stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.stat-icon  { font-size: 2rem; margin-bottom: 8px; }
.stat-value { font-size: 2.25rem; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 0.875rem; color: var(--gray-500); margin-top: 2px; }

.city-row { display: flex; gap: 8px; margin-bottom: 16px; }

.weather-body { }
.weather-temp { font-size: 3rem; font-weight: 700; color: var(--primary); line-height: 1; }
.weather-unit { font-size: 1.5rem; }
.weather-desc { color: var(--gray-500); margin: 4px 0 12px; text-transform: capitalize; }
.weather-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.weather-row  { font-size: 0.875rem; color: var(--gray-600); display: flex; align-items: center; gap: 6px; }

.aqi-body  { }
.aqi-score { font-size: 3.5rem; font-weight: 800; line-height: 1; }
.aqi-cat   { font-size: 0.9rem; font-weight: 600; margin: 4px 0 12px; }
.aqi-meta  { font-size: 0.8rem; color: var(--gray-600); display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.pollutant-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.p-chip {
  background: var(--gray-100);
  border-radius: var(--radius-sm);
  padding: 2px 7px;
  font-size: 0.75rem;
  color: var(--gray-600);
}

.empty-hint { color: var(--gray-400); font-size: 0.875rem; padding: 16px 0; }

.quick-links { display: flex; gap: 12px; flex-wrap: wrap; }

.mini-spin {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
</style>
