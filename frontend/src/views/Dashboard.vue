<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const route = useRoute()
const router = useRouter()
const store = useEventStore()

const eventId = route.params.id
const alertMessage = ref('')
const alertSeverity = ref('info')
const sendingAlert = ref(false)
const copied = ref(false)
const loading = ref(true)

const checkedIn = computed(() =>
  store.participants.filter((p) => p.checkedIn)
)

const roleCounts = computed(() => {
  const counts = { marshal: 0, medic: 0, legal_observer: 0, participant: 0 }
  for (const p of store.participants) {
    if (counts[p.role] !== undefined) counts[p.role]++
    else counts.participant++
  }
  return counts
})

const severityOptions = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'emergency', label: 'Emergency' },
]

async function copyCode() {
  if (!store.currentEvent?.joinCode) return
  try {
    await navigator.clipboard.writeText(store.currentEvent.joinCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // fallback: the user-select: all on the element lets them copy manually
  }
}

async function handleSendAlert() {
  if (!alertMessage.value.trim()) return
  sendingAlert.value = true
  try {
    await store.sendAlert(eventId, alertMessage.value.trim(), alertSeverity.value)
    alertMessage.value = ''
    alertSeverity.value = 'info'
  } catch {
    // could show error
  } finally {
    sendingAlert.value = false
  }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function roleLabel(role) {
  const map = { marshal: 'Marshal', medic: 'Medic', legal_observer: 'Legal Observer', participant: 'Participant' }
  return map[role] || role
}

onMounted(async () => {
  try {
    await store.fetchEvent(eventId)
    await Promise.all([
      store.fetchParticipants(eventId),
      store.fetchAlerts(eventId),
    ])
    store.connectSSE(eventId)
  } catch {
    // event not found
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
      <p>Loading event...</p>
    </div>

    <template v-else-if="store.currentEvent">
      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1>{{ store.currentEvent.name }}</h1>
          <p class="text-muted text-sm" v-if="store.currentEvent.description">
            {{ store.currentEvent.description }}
          </p>
        </div>
        <router-link :to="`/event/${eventId}/map`" class="btn btn-secondary">
          Live Map
        </router-link>
      </div>

      <!-- Join Code -->
      <div class="code-section mt-2">
        <label>Share this code with participants</label>
        <div class="join-code" @click="copyCode" :title="'Click to copy'">
          {{ store.currentEvent.joinCode }}
        </div>
        <div class="copy-toast" :class="{ show: copied }">Copied to clipboard!</div>
      </div>

      <!-- Stats -->
      <div class="stats-bar mt-3">
        <div class="stat card">
          <div class="stat-value">{{ store.participants.length }}</div>
          <div class="stat-label">Total Joined</div>
        </div>
        <div class="stat card">
          <div class="stat-value" style="color: var(--accent)">{{ checkedIn.length }}</div>
          <div class="stat-label">Checked In</div>
        </div>
        <div class="stat card" v-for="(count, role) in roleCounts" :key="role">
          <div class="stat-value">
            <span :class="`badge badge-${role}`">{{ count }}</span>
          </div>
          <div class="stat-label">{{ roleLabel(role) }}s</div>
        </div>
      </div>

      <div class="grid-2 mt-3">
        <!-- Participants -->
        <div class="card">
          <h3 class="mb-2">Participants</h3>
          <div v-if="store.participants.length === 0" class="empty-state">
            <p>No participants yet. Share the join code above.</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in store.participants" :key="p.id">
                  <td>
                    <span
                      class="status-dot"
                      :class="p.checkedIn ? 'checked-in' : 'not-checked-in'"
                    ></span>
                  </td>
                  <td>{{ p.name }}</td>
                  <td>
                    <span :class="`badge badge-${p.role}`">{{ roleLabel(p.role) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerts -->
        <div class="card">
          <h3 class="mb-2">Alerts</h3>

          <form class="alert-form" @submit.prevent="handleSendAlert">
            <div class="form-group">
              <input
                v-model="alertMessage"
                placeholder="Type alert message..."
              />
            </div>
            <div class="alert-form-row">
              <select v-model="alertSeverity" class="severity-select">
                <option v-for="s in severityOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
              <button
                type="submit"
                class="btn btn-sm"
                :class="alertSeverity === 'emergency' ? 'btn-danger' : 'btn-primary'"
                :disabled="sendingAlert || !alertMessage.trim()"
              >
                {{ sendingAlert ? 'Sending...' : 'Send Alert' }}
              </button>
            </div>
          </form>

          <div class="alerts-list mt-2">
            <div v-if="store.alerts.length === 0" class="empty-state">
              <p>No alerts sent yet.</p>
            </div>
            <div
              v-for="a in store.alerts"
              :key="a.id"
              class="alert-item"
              :class="`alert-${a.severity}`"
            >
              <div class="flex items-center justify-between">
                <span class="alert-msg">{{ a.message }}</span>
                <span class="text-muted text-sm">{{ formatTime(a.createdAt || a.timestamp) }}</span>
              </div>
              <div class="text-sm text-muted mt-1">
                <span :class="`badge badge-severity-${a.severity}`">{{ a.severity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <h2>Event not found</h2>
      <p>
        <router-link to="/">Go back home</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.code-section {
  text-align: center;
}

.code-section label {
  display: block;
  margin-bottom: 0.75rem;
  text-align: center;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.alert-form-row {
  display: flex;
  gap: 0.5rem;
}

.severity-select {
  flex: 0 0 auto;
  width: auto;
  min-width: 120px;
}

.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-msg {
  font-weight: 500;
}

.badge-severity-info {
  background: rgba(59, 130, 246, 0.15);
  color: var(--severity-info);
}

.badge-severity-warning {
  background: rgba(234, 179, 8, 0.15);
  color: var(--severity-warning);
}

.badge-severity-emergency {
  background: rgba(239, 68, 68, 0.15);
  color: var(--severity-emergency);
}
</style>
