<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const route = useRoute()
const store = useEventStore()
const eventId = route.params.id

const loading = ref(true)
const mapReady = ref(false)

const LMap = ref(null)
const LTileLayer = ref(null)
const LCircleMarker = ref(null)
const LPopup = ref(null)

const colors = {
  marshal: '#3b82f6',
  medic: '#22c55e',
  legal_observer: '#f97316',
  participant: '#6366f1',
}

function roleLabel(r) {
  return { marshal: 'Marshals', medic: 'Medics', legal_observer: 'Legal Obs.', participant: 'Participants' }[r] || r
}

const pts = computed(() => store.participants.filter(p => p.checkedIn && (p.lat !== 0 || p.lng !== 0)))

const center = computed(() => {
  if (pts.value.length === 0) return [40.7128, -74.006]
  const lat = pts.value.reduce((s, p) => s + p.lat, 0) / pts.value.length
  const lng = pts.value.reduce((s, p) => s + p.lng, 0) / pts.value.length
  return [lat, lng]
})

onMounted(async () => {
  try {
    await import('leaflet/dist/leaflet.css')
    const vl = await import('@vue-leaflet/vue-leaflet')
    LMap.value = vl.LMap
    LTileLayer.value = vl.LTileLayer
    LCircleMarker.value = vl.LCircleMarker
    LPopup.value = vl.LPopup
    mapReady.value = true

    await store.fetchEvent(eventId)
    await store.fetchParticipants(eventId)
    store.connectSSE(eventId)
  } catch {} finally { loading.value = false }
})

onUnmounted(() => store.disconnectSSE())
</script>

<template>
  <div class="container">
    <!-- Header bar -->
    <div class="flex between center wrap gap">
      <div>
        <div class="live-tag"><span class="live-dot"></span> Live Map</div>
        <h1 style="margin-top:4px" v-if="store.currentEvent">{{ store.currentEvent.name }}</h1>
      </div>
      <div class="flex gap">
        <router-link v-if="store.currentEvent" :to="`/event/${eventId}/dashboard`" class="btn btn-ghost btn-sm">Dashboard</router-link>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="flex gap mt" v-if="!loading">
      <div class="mini-stat">
        <div style="font-size:18px;font-weight:700">{{ pts.length }}</div>
        <div class="xs muted">Tracked</div>
      </div>
      <div class="mini-stat" v-for="(color, role) in colors" :key="role">
        <div style="font-size:14px;font-weight:700">
          {{ store.participants.filter(p => p.role === role && p.checkedIn).length }}
        </div>
        <div class="flex center gap-sm">
          <span style="width:8px;height:8px;border-radius:50%;display:inline-block" :style="{ background: color }"></span>
          <span class="xs muted">{{ roleLabel(role) }}</span>
        </div>
      </div>
    </div>

    <!-- Map -->
    <div class="map-wrap mt">
      <div v-if="loading" class="empty"><p>Loading map...</p></div>

      <div v-else-if="pts.length === 0" class="map-overlay">
        <div style="text-align:center">
          <div class="muted" style="font-size:14px;font-weight:700">No checked-in participants yet</div>
          <div class="dim small" style="margin-top:4px">Map populates as people check in</div>
        </div>
      </div>

      <component v-if="mapReady" :is="LMap" :zoom="15" :center="center" :use-global-leaflet="false" class="the-map">
        <component :is="LTileLayer" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="OpenStreetMap, CARTO" />
        <component
          v-for="p in pts" :key="p.id" :is="LCircleMarker"
          :lat-lng="[p.lat, p.lng]" :radius="10"
          :fillColor="colors[p.role] || colors.participant"
          :color="colors[p.role] || colors.participant"
          :fillOpacity="0.85" :weight="2"
        >
          <component :is="LPopup">
            <div style="color:#171717;font-size:13px">
              <strong>{{ p.name }}</strong><br>
              <span style="color:#737373">{{ roleLabel(p.role) }}</span>
            </div>
          </component>
        </component>
      </component>
    </div>
  </div>
</template>

<style scoped>
.mini-stat {
  flex: 1;
  background: #1a2744;
  border: 1px solid #2a3a5c;
  border-radius: var(--radius-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.map-wrap {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid #1e2d4a;
  background: #1a2744;
}

.the-map { width: 100%; height: 480px; }

.map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: rgba(10, 22, 40, 0.75);
  backdrop-filter: blur(4px);
}

@media (max-width: 640px) {
  .the-map { height: 360px; }
  .mini-stat { padding: 8px 4px; }
}
</style>
