<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const route = useRoute()
const store = useEventStore()
const eventId = route.params.id

const loading = ref(true)
const mapReady = ref(false)

// Dynamically import leaflet components to avoid SSR issues
const LMap = ref(null)
const LTileLayer = ref(null)
const LMarker = ref(null)
const LPopup = ref(null)
const LCircleMarker = ref(null)

const roleColors = {
  marshal: '#3b82f6',
  medic: '#22c55e',
  legal_observer: '#f97316',
  participant: '#94a3b8',
}

function roleLabel(role) {
  const map = { marshal: 'Marshal', medic: 'Medic', legal_observer: 'Legal Observer', participant: 'Participant' }
  return map[role] || role
}

const checkedInParticipants = computed(() =>
  store.participants.filter((p) => p.checkedIn && p.latitude && p.longitude)
)

const mapCenter = computed(() => {
  const pts = checkedInParticipants.value
  if (pts.length === 0) return [40.7128, -74.006] // default NYC
  const lat = pts.reduce((s, p) => s + p.latitude, 0) / pts.length
  const lng = pts.reduce((s, p) => s + p.longitude, 0) / pts.length
  return [lat, lng]
})

const zoom = ref(15)

onMounted(async () => {
  try {
    // Load leaflet CSS
    await import('leaflet/dist/leaflet.css')

    // Load vue-leaflet components
    const vueLeaflet = await import('@vue-leaflet/vue-leaflet')
    LMap.value = vueLeaflet.LMap
    LTileLayer.value = vueLeaflet.LTileLayer
    LMarker.value = vueLeaflet.LMarker
    LPopup.value = vueLeaflet.LPopup
    LCircleMarker.value = vueLeaflet.LCircleMarker

    mapReady.value = true

    await store.fetchEvent(eventId)
    await store.fetchParticipants(eventId)
    store.connectSSE(eventId)
  } catch {
    // error loading
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  store.disconnectSSE()
})
</script>

<template>
  <div class="container">
    <div class="map-header">
      <div>
        <h1>Live Map</h1>
        <p class="text-muted text-sm" v-if="store.currentEvent">
          {{ store.currentEvent.name }} &mdash; {{ checkedInParticipants.length }} checked in
        </p>
      </div>
      <div class="flex gap-1">
        <router-link
          v-if="store.currentEvent"
          :to="`/event/${eventId}/dashboard`"
          class="btn btn-secondary btn-sm"
        >
          Dashboard
        </router-link>
        <router-link to="/" class="btn btn-secondary btn-sm">Home</router-link>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend mt-2">
      <div class="legend-item" v-for="(color, role) in roleColors" :key="role">
        <span class="legend-dot" :style="{ background: color }"></span>
        <span class="text-sm">{{ roleLabel(role) }}</span>
      </div>
    </div>

    <div class="map-container mt-2">
      <div v-if="loading" class="empty-state">
        <p>Loading map...</p>
      </div>

      <div v-else-if="checkedInParticipants.length === 0 && !loading" class="map-empty-overlay">
        <div class="empty-state">
          <h3>No checked-in participants yet</h3>
          <p>The map will populate as participants check in and share their location.</p>
        </div>
      </div>

      <component
        v-if="mapReady"
        :is="LMap"
        :zoom="zoom"
        :center="mapCenter"
        :use-global-leaflet="false"
        class="leaflet-map"
      >
        <component
          :is="LTileLayer"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          :options="{ maxZoom: 19 }"
        />
        <component
          v-for="p in checkedInParticipants"
          :key="p.id"
          :is="LCircleMarker"
          :lat-lng="[p.latitude, p.longitude]"
          :radius="10"
          :fillColor="roleColors[p.role] || roleColors.participant"
          :color="roleColors[p.role] || roleColors.participant"
          :fillOpacity="0.8"
          :weight="2"
        >
          <component :is="LPopup">
            <div class="marker-popup">
              <strong>{{ p.name }}</strong>
              <br />
              <span>{{ roleLabel(p.role) }}</span>
            </div>
          </component>
        </component>
      </component>
    </div>
  </div>
</template>

<style scoped>
.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.map-container {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.leaflet-map {
  width: 100%;
  height: 550px;
}

.map-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
}

.marker-popup {
  color: #1e293b;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .leaflet-map {
    height: 400px;
  }
}
</style>
