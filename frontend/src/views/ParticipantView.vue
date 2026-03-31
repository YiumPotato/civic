<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const route = useRoute()
const store = useEventStore()
const eventId = route.params.id
const participantId = route.params.participantId

const loading = ref(true)
const checkingIn = ref(false)
const checkedIn = ref(false)
const checkInError = ref('')
const participant = ref(null)

const checklists = {
  participant: [
    'Know your rights — right to peacefully assemble',
    'Save the legal hotline number',
    'Bring water, snacks, and medication',
    'Have a buddy — never go alone',
    'Keep your phone charged',
  ],
  marshal: [
    'Arrive early to survey the route',
    'Wear your high-visibility vest',
    'Know all exit points',
    'Keep participants in designated areas',
    'Know the emergency plan and rally point',
  ],
  medic: [
    'Bring your first aid kit',
    'Wear your medic cross clearly',
    'Carry water for flushing eyes',
    'Know nearest hospitals',
    'Document injuries with consent',
  ],
  legal_observer: [
    'Bring notepad, pens, charged camera',
    'Wear legal observer identifier',
    'Document police activity & badge numbers',
    'Record timestamps for significant events',
    'Observe only — do not participate',
  ],
}

const checklist = computed(() => checklists[participant.value?.role] || checklists.participant)

function roleLabel(r) {
  return { marshal: 'Marshal', medic: 'Medic', legal_observer: 'Legal Observer', participant: 'Participant' }[r] || r
}

function time(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function handleCheckIn() {
  checkingIn.value = true
  checkInError.value = ''
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
    })
    await store.checkIn(participantId, eventId, pos.coords.latitude, pos.coords.longitude)
    checkedIn.value = true
  } catch (e) {
    checkInError.value = e.code ? 'Location access denied. Enable location services.' : (e.message || 'Check-in failed')
  } finally { checkingIn.value = false }
}

onMounted(async () => {
  try {
    await store.fetchEvent(eventId)
    const pts = await store.fetchParticipants(eventId)
    participant.value = pts.find(p => p.id === participantId) || null
    if (participant.value?.checkedIn) checkedIn.value = true
    await store.fetchAlerts(eventId)
    store.connectSSE(eventId)
  } catch {} finally { loading.value = false }
})

onUnmounted(() => store.disconnectSSE())
</script>

<template>
  <div class="container">
    <div v-if="loading" class="empty"><p>Loading...</p></div>

    <template v-else-if="store.currentEvent && participant">
      <!-- Role header card -->
      <div class="card card-accent">
        <div class="flex center gap">
          <div class="role-icon" :class="`role-icon-${participant.role}`">
            <span v-if="participant.role==='marshal'" style="font-size:16px">&#128737;</span>
            <span v-else-if="participant.role==='medic'" style="font-size:16px">&#9764;</span>
            <span v-else-if="participant.role==='legal_observer'" style="font-size:16px">&#9878;</span>
            <span v-else style="font-size:16px">&#9734;</span>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700">{{ roleLabel(participant.role) }}</div>
            <div class="indigo-sub small">{{ store.currentEvent.name }}</div>
          </div>
        </div>
      </div>

      <!-- Check-in -->
      <div v-if="checkedIn" class="success-banner mt">
        <div class="success-icon">&#10003;</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--green)">Successfully Checked In</div>
          <div style="font-size:12px;color:var(--green-light);margin-top:2px">Location shared with organizers</div>
        </div>
      </div>

      <button v-else class="btn btn-primary btn-block mt" :disabled="checkingIn" @click="handleCheckIn" style="height:56px;font-size:16px">
        {{ checkingIn ? 'Getting location...' : 'Check In Now' }}
      </button>
      <p v-if="checkInError" class="err mt">{{ checkInError }}</p>

      <!-- Actions -->
      <div class="flex gap mt">
        <router-link :to="`/event/${eventId}/map`" class="btn btn-blue" style="flex:1">
          View Map
        </router-link>
        <router-link :to="`/event/${eventId}/dashboard`" class="btn btn-ghost" style="flex:1">
          Dashboard
        </router-link>
      </div>

      <!-- Checklist -->
      <div class="card mt">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px">Pre-Event Readiness</div>
        <ul class="cklist">
          <li v-for="(item, i) in checklist" :key="i">
            <input type="checkbox" :id="`c${i}`" />
            <label :for="`c${i}`" style="flex:1">{{ item }}</label>
          </li>
        </ul>
      </div>

      <!-- Alerts -->
      <div class="card mt">
        <div class="flex between center" style="margin-bottom:12px">
          <h3>Alerts</h3>
          <span class="live-tag"><span class="live-dot"></span> Live</span>
        </div>

        <!-- Active emergency banner -->
        <template v-for="a in store.alerts" :key="'banner-'+a.id">
          <div v-if="a.severity === 'emergency'" class="alert-banner mb">
            <div style="width:36px;height:36px;background:var(--yellow);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="color:#0a1628;font-size:16px;font-weight:800">!</span>
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--yellow)">EMERGENCY</div>
              <div style="font-size:12px;color:#fbbf24;margin-top:4px">{{ a.message }}</div>
            </div>
          </div>
        </template>

        <div v-if="store.alerts.length === 0" class="dim small" style="text-align:center;padding:16px 0">
          No alerts yet. Stay tuned.
        </div>

        <div class="alert-scroll">
          <div v-for="a in store.alerts" :key="a.id" class="alert-item">
            <div class="alert-icon" :class="`alert-icon-${a.severity}`">
              <span v-if="a.severity==='info'" style="color:#fff;font-size:12px">i</span>
              <span v-else style="color:#fff;font-size:14px;font-weight:800">!</span>
            </div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700">{{ a.message }}</div>
              <div class="xs dim" style="margin-top:2px">{{ time(a.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <p>Participant not found. <router-link to="/">Go home</router-link></p>
    </div>
  </div>
</template>

<style scoped>
.role-icon {
  width: 44px;
  height: 44px;
  background: var(--indigo);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.role-icon-marshal { background: var(--blue-bg); }
.role-icon-medic { background: var(--green-bg); }
.role-icon-legal_observer { background: var(--orange-bg); }

.err { color: var(--red-light); font-size: 12px; }

.alert-scroll { max-height: 300px; overflow-y: auto; }
</style>
