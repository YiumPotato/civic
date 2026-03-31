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

const roleChecklists = {
  participant: [
    'Know your rights — you have the right to peacefully assemble',
    'Save the legal hotline number to your phone',
    'Bring water, snacks, and any necessary medication',
    'Wear comfortable shoes and weather-appropriate clothing',
    'Have a buddy — never go alone',
    'Keep your phone charged',
  ],
  marshal: [
    'Arrive early to survey the route and identify hazards',
    'Wear your high-visibility vest or identifier',
    'Know the rally route and all exit points',
    'Carry a charged radio or phone for coordination',
    'Keep participants within designated areas',
    'Watch for counter-protesters or agitators',
    'Know the emergency plan and rally point',
  ],
  medic: [
    'Bring your first aid kit and supplies',
    'Wear your medic cross identifier clearly',
    'Carry water for flushing eyes (pepper spray, tear gas)',
    'Know the nearest hospitals and urgent care locations',
    'Set up a visible medic station if possible',
    'Document any injuries with photos (with consent)',
  ],
  legal_observer: [
    'Bring a notepad, pens, and a charged camera/phone',
    'Wear your legal observer identifier (green hat/vest)',
    'Document police activity, badge numbers, and vehicle IDs',
    'Record timestamps for all significant events',
    'Do not participate in the action — observe only',
    'Know the NLG hotline number by heart',
    'Collect witness contact info for any incidents',
  ],
}

const checklist = computed(() => {
  const role = participant.value?.role || 'participant'
  return roleChecklists[role] || roleChecklists.participant
})

function roleLabel(role) {
  const map = { marshal: 'Marshal', medic: 'Medic', legal_observer: 'Legal Observer', participant: 'Participant' }
  return map[role] || role
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function handleCheckIn() {
  checkingIn.value = true
  checkInError.value = ''
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    })
    await store.checkIn(participantId, pos.coords.latitude, pos.coords.longitude)
    checkedIn.value = true
  } catch (e) {
    if (e.code) {
      // GeolocationPositionError
      checkInError.value = 'Location access denied. Please enable location services.'
    } else {
      checkInError.value = e.message || 'Check-in failed'
    }
  } finally {
    checkingIn.value = false
  }
}

onMounted(async () => {
  try {
    await store.fetchEvent(eventId)
    const participants = await store.fetchParticipants(eventId)
    participant.value = participants.find((p) => p.id === participantId) || null
    if (participant.value?.checkedIn) {
      checkedIn.value = true
    }
    await store.fetchAlerts(eventId)
    store.connectSSE(eventId)
  } catch {
    // error
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
    <div v-if="loading" class="empty-state">
      <p>Loading...</p>
    </div>

    <template v-else-if="store.currentEvent && participant">
      <!-- Header -->
      <div class="participant-header">
        <div>
          <p class="text-muted text-sm">You are attending</p>
          <h1>{{ store.currentEvent.name }}</h1>
        </div>
        <div class="role-display">
          <span :class="`badge badge-${participant.role}`">
            {{ roleLabel(participant.role) }}
          </span>
        </div>
      </div>

      <!-- Check-in -->
      <div class="card mt-2 check-in-card">
        <div v-if="checkedIn" class="checked-in-status">
          <span class="check-mark">&#10003;</span>
          <div>
            <strong>You are checked in</strong>
            <p class="text-muted text-sm">Your location has been shared with organizers</p>
          </div>
        </div>
        <div v-else class="check-in-prompt">
          <div>
            <strong>Check in to confirm your presence</strong>
            <p class="text-muted text-sm">This shares your location with event organizers</p>
          </div>
          <button
            class="btn btn-primary"
            :disabled="checkingIn"
            @click="handleCheckIn"
          >
            {{ checkingIn ? 'Getting location...' : 'Check In' }}
          </button>
        </div>
        <p v-if="checkInError" class="error-text mt-1">{{ checkInError }}</p>
      </div>

      <div class="grid-2 mt-3">
        <!-- Checklist -->
        <div class="card">
          <h3 class="mb-2">{{ roleLabel(participant.role) }} Checklist</h3>
          <ul class="checklist">
            <li v-for="(item, i) in checklist" :key="i" class="checklist-item">
              <input type="checkbox" :id="`check-${i}`" class="checklist-check" />
              <label :for="`check-${i}`" class="checklist-label">{{ item }}</label>
            </li>
          </ul>
        </div>

        <!-- Alerts Feed -->
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <h3>Alert Feed</h3>
            <span class="live-indicator">
              <span class="live-dot"></span>
              Live
            </span>
          </div>

          <div v-if="store.alerts.length === 0" class="empty-state">
            <p>No alerts yet. Stay tuned.</p>
          </div>

          <div class="alerts-feed">
            <div
              v-for="a in store.alerts"
              :key="a.id"
              class="alert-item"
              :class="`alert-${a.severity}`"
            >
              <div class="flex items-center justify-between">
                <strong class="alert-msg">{{ a.message }}</strong>
                <span class="text-muted text-sm">{{ formatTime(a.createdAt || a.timestamp) }}</span>
              </div>
            </div>
          </div>

          <router-link
            :to="`/event/${eventId}/map`"
            class="btn btn-secondary mt-2"
            style="width: 100%"
          >
            Open Live Map
          </router-link>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <h2>Participant not found</h2>
      <p>
        <router-link to="/">Go back home</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.participant-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.role-display {
  padding-top: 0.25rem;
}

.role-display .badge {
  font-size: 0.9rem;
  padding: 0.4rem 1rem;
}

.check-in-card {
  border-color: var(--accent);
}

.checked-in-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.check-mark {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #0f172a;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 800;
  flex-shrink: 0;
}

.check-in-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.error-text {
  color: var(--severity-emergency);
  font-size: 0.85rem;
}

.checklist {
  list-style: none;
  padding: 0;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
}

.checklist-item:last-child {
  border-bottom: none;
}

.checklist-check {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--accent);
  flex-shrink: 0;
  cursor: pointer;
}

.checklist-label {
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  line-height: 1.4;
  text-transform: none;
  font-weight: 400;
  letter-spacing: 0;
  margin-bottom: 0;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse-live 2s ease-in-out infinite;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.alerts-feed {
  max-height: 350px;
  overflow-y: auto;
}

.alert-msg {
  font-weight: 500;
}
</style>
