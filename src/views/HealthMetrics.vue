<template>
  <div>
    <div class="page-header">
      <h1>Health Metrics</h1>
      <p>Calculate your BMI, calorie targets, and macronutrient breakdown</p>
    </div>

    <div class="grid-2">

      <!-- Input form -->
      <div class="card">
        <div class="card-title">📝 Your Details</div>

        <div v-if="formError" class="alert alert-error">{{ formError }}</div>

        <div class="form-group">
          <label class="form-label">Age</label>
          <input
            v-model.number="form.age"
            type="number"
            class="form-control"
            placeholder="e.g. 25"
            min="1" max="120"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Gender</label>
          <select v-model="form.gender" class="form-control">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Weight (kg)</label>
            <input
              v-model.number="form.weight"
              type="number"
              class="form-control"
              placeholder="e.g. 75"
              min="1"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Height (cm)</label>
            <input
              v-model.number="form.height"
              type="number"
              class="form-control"
              placeholder="e.g. 175"
              min="1"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Activity Level</label>
          <select v-model="form.activity_level" class="form-control">
            <option value="">Select activity level</option>
            <option value="sedentary">Sedentary — little or no exercise</option>
            <option value="light">Light — 1–3 days/week</option>
            <option value="moderate">Moderate — 3–5 days/week</option>
            <option value="active">Active — 6–7 days/week</option>
            <option value="very_active">Very Active — hard daily exercise</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Goal</label>
          <select v-model="form.goal" class="form-control">
            <option value="">Select your goal</option>
            <option value="lose">🔻 Lose Weight</option>
            <option value="cut">✂️ Cut (aggressive)</option>
            <option value="maintain">⚖️ Maintain Weight</option>
            <option value="gain">📈 Gain Weight</option>
            <option value="bulk">💪 Bulk</option>
          </select>
        </div>

        <button
          class="btn btn-primary btn-lg"
          style="width:100%;margin-top:4px"
          @click="calculate"
          :disabled="loading"
        >
          <span v-if="loading" class="mini-spin"></span>
          <span v-else>🧮 Calculate Metrics</span>
        </button>
      </div>

      <!-- Results panel -->
      <div class="card results-card">
        <div class="card-title">📊 Results</div>

        <div v-if="loading" class="loading-center" style="padding:60px">
          <div class="spinner"></div>
          <span>Calculating…</span>
        </div>

        <div v-else-if="resultError" class="alert alert-error">{{ resultError }}</div>

        <div v-else-if="!result" class="empty-hint">
          <div class="hint-icon">🧮</div>
          <p>Fill in your details and click <strong>Calculate Metrics</strong>.</p>
        </div>

        <div v-else>
          <!-- Key metric cards -->
          <div class="metrics-grid">
            <template v-for="(val, key) in scalarResult" :key="key">
              <div class="metric-tile" v-if="val !== null && val !== undefined">
                <div class="metric-key">{{ labelFor(key) }}</div>
                <div class="metric-val">{{ displayVal(key, val) }}</div>
              </div>
            </template>
          </div>

          <!-- Macros bar -->
          <div v-if="macros" class="macros-section">
            <div class="macros-title">Daily Macronutrients</div>
            <div class="macros-bar">
              <div class="macro-seg seg-protein" :style="{ flex: macros.protein }">
                Protein<br>{{ macros.protein }}g
              </div>
              <div class="macro-seg seg-carbs" :style="{ flex: macros.carbs }">
                Carbs<br>{{ macros.carbs }}g
              </div>
              <div class="macro-seg seg-fat" :style="{ flex: macros.fat }">
                Fat<br>{{ macros.fat }}g
              </div>
            </div>
            <div class="macros-legend">
              <span class="legend-dot" style="background:#1a56db"></span> Protein
              <span class="legend-dot" style="background:#057a55;margin-left:12px"></span> Carbs
              <span class="legend-dot" style="background:#c27803;margin-left:12px"></span> Fat
            </div>
          </div>

          <!-- Full API JSON (collapsed) -->
          <details class="raw-block">
            <summary>Full API Response</summary>
            <pre>{{ JSON.stringify(result, null, 2) }}</pre>
          </details>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { metricsApi } from '../api/index.js'

const showToast = inject('showToast')

const form = ref({
  age:            '',
  gender:         '',
  weight:         '',
  height:         '',
  activity_level: '',
  goal:           '',
})

const loading     = ref(false)
const result      = ref(null)
const resultError = ref('')
const formError   = ref('')

const scalarResult = computed(() => {
  if (!result.value) return {}
  const out = {}
  for (const [k, v] of Object.entries(result.value)) {
    if (typeof v !== 'object' || v === null) out[k] = v
  }
  return out
})

const macros = computed(() => result.value?.macros ?? null)

const LABELS = {
  bmi:             'BMI',
  bmi_category:    'BMI Category',
  bmr:             'Basal Metabolic Rate (BMR)',
  tdee:            'Total Daily Energy (TDEE)',
  target_calories: 'Target Calories',
  calories:        'Calories',
}

function labelFor(key) {
  return LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const CAL_KEYS = new Set(['bmr', 'tdee', 'target_calories', 'calories'])

function displayVal(key, val) {
  if (CAL_KEYS.has(key) && typeof val === 'number') return `${Math.round(val)} kcal`
  if (key === 'bmi'      && typeof val === 'number') return val.toFixed(1)
  return val
}

async function calculate() {
  formError.value = ''
  const { age, gender, weight, height, activity_level, goal } = form.value
  if (!age || !gender || !weight || !height || !activity_level || !goal) {
    formError.value = 'Please fill in all fields before calculating.'
    return
  }
  loading.value     = true
  result.value      = null
  resultError.value = ''
  try {
    const res = await metricsApi.calculate({ age, gender, weight, height, activity_level, goal })
    result.value = res.data
    showToast('Health metrics calculated!')
  } catch (e) {
    resultError.value = e.response?.data?.error || 'Failed to calculate metrics. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.results-card { min-height: 320px; }

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  color: var(--gray-400);
  text-align: center;
  gap: 12px;
}
.hint-icon { font-size: 3rem; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.metric-tile {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  padding: 12px 14px;
}
.metric-key { font-size: 0.7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-500); margin-bottom: 4px; }
.metric-val { font-size: 1.25rem; font-weight: 700; color: var(--primary); }

.macros-section { }
.macros-title { font-size: 0.9rem; font-weight: 600; color: var(--gray-700); margin-bottom: 8px; }

.macros-bar {
  display: flex;
  border-radius: var(--radius);
  overflow: hidden;
  height: 48px;
}
.macro-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  padding: 0 4px;
  text-align: center;
  line-height: 1.3;
  min-width: 0;
  overflow: hidden;
}
.seg-protein { background: #1a56db; }
.seg-carbs   { background: #057a55; }
.seg-fat     { background: #c27803; }

.macros-legend { font-size: 0.75rem; color: var(--gray-600); margin-top: 8px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; }

.raw-block { margin-top: 20px; font-size: 0.8rem; color: var(--gray-600); }
.raw-block summary { cursor: pointer; font-weight: 500; }
.raw-block pre {
  background: var(--gray-100);
  border-radius: var(--radius);
  padding: 12px;
  overflow-x: auto;
  margin-top: 8px;
  font-size: 0.75rem;
}

.mini-spin {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
</style>
