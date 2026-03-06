import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://13.53.123.150:5000'
const API_KEY  = import.meta.env.VITE_API_KEY  || 'healthcare-api-key-2024'

const http = axios.create({ baseURL: BASE_URL, timeout: 15000 })

const authHttp = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'X-API-Key': API_KEY },
})

export const healthApi = {
  check: () => http.get('/health'),
}

export const slotsApi = {
  getAll: (doctor = null) =>
    http.get('/slots', { params: doctor ? { doctor } : {} }),
}

export const reservationApi = {
  create: (data)  => authHttp.post('/reserve', data),
  cancel: (id)    => authHttp.delete(`/reserve/${id}`),
  getAll: (doctor = null) =>
    authHttp.get('/reservations', { params: doctor ? { doctor } : {} }),
}

export const weatherApi = {
  get: (city) => http.get('/weather', { params: { city } }),
}

export const aqiApi = {
  get: (city) => http.get('/aqi', { params: { city } }),
}

export const metricsApi = {
  calculate: (data) => http.post('/metrics', data),
}
