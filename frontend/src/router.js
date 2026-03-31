import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/Home.vue'),
  },
  {
    path: '/event/:id/dashboard',
    name: 'Dashboard',
    component: () => import('./views/Dashboard.vue'),
  },
  {
    path: '/event/:id/participant/:participantId',
    name: 'ParticipantView',
    component: () => import('./views/ParticipantView.vue'),
  },
  {
    path: '/event/:id/map',
    name: 'LiveMap',
    component: () => import('./views/LiveMap.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
