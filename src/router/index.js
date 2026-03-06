import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Appointments from '../views/Appointments.vue'
import Reservations from '../views/Reservations.vue'
import HealthMetrics from '../views/HealthMetrics.vue'

const routes = [
  { path: '/', component: Dashboard, meta: { title: 'Dashboard' } },
  { path: '/appointments', component: Appointments, meta: { title: 'Appointments' } },
  { path: '/reservations', component: Reservations, meta: { title: 'Reservations' } },
  { path: '/metrics', component: HealthMetrics, meta: { title: 'Health Metrics' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'Healthcare'} — Healthcare Appointment System`
})

export default router
