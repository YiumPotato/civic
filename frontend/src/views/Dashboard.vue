<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const route = useRoute()
const store = useEventStore()
const eventId = route.params.id

const alertMsg = ref('')
const alertSev = ref('info')
const sending = ref(false)
const copied = ref(false)
const loading = ref(true)

const checkedIn = computed(() => store.participants.filter(p => p.checkedIn))

const roleCounts = computed(() => {
  const c = { marshal: 0, medic: 0, legal_observer: 0, participant: 0 }
  store.participants.forEach(p => { if (c[p.role] !== undefined) c[p.role]++; else c.participant++ })
  return c
})

function roleLabel(r) {
  return { marshal: 'Marshals', medic: 'Medics', legal_observer: 'Legal Obs.', participant: 'Participants' }[r] || r
}

function roleLabelSingle(r) {
  return { marshal: 'Marshal', medic: 'Medic', legal_observer: 'Legal Obs.', participant: 'Participant' }[r] || r
}

function time(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(store.currentEvent.joinCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
}

async function sendAlert() {
  if (!alertMsg.value.trim()) return
  sending.value = true
  try {
    await store.sendAlert(eventId, alertMsg.value.trim(), alertSev.value)
    alertMsg.value = ''
    alertSev.value = 'info'
  } catch {} finally { sending.value = false }
}

onMounted(async () => {
  try {
    await store.fetchEvent(eventId)
    await Promise.all([store.fetchParticipants(eventId), store.fetchAlerts(eventId)])
    store.connectSSE(eventId)
  } catch {} finally { loading.value = false }
})

onUnmounted(() => store.disconnectSSE())
</script>

<template>
  <div class="container">
    <div v-if="loading" class="empty"><p>Loading...</p></div>

    <template v-else-if="store.currentEvent">
      <!-- Live header -->
      <div class="flex between" style="align-items:flex-start">
        <div>
          <div class="live-tag"><span class="live-dot"></span> Live Now</div>
          <h1 style="margin-top:4px">{{ store.currentEvent.name }}</h1>
          <p class="muted small" v-if="store.currentEvent.description" style="margin-top:4px">
            {{ store.currentEvent.description }}
          </p>
        </div>
        <div class="stat-box">
          <div style="font-size:22px;font-weight:700">{{ store.participants.length }}</div>
          <div class="xs indigo-sub">JOINED</div>
        </div>
      </div>

      <!-- Role breakdown -->
      <div class="card mt" style="display:flex;justify-content:space-around;align-items:center;padding:12px 8px">
        <div v-for="(count, role) in roleCounts" :key="role" class="role-col">
          <span :class="`badge badge-${role}`">{{ count }}</span>
          <span class="xs muted">{{ roleLabel(role) }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap mt">
        <router-link :to="`/event/${eventId}/map`" class="btn btn-blue" style="flex:1">
          View Map
        </router-link>
        <button class="btn btn-primary" style="flex:1" @click="$refs.alertInput?.focus()">
          Broadcast Alert
        </button>
      </div>

      <!-- Join code -->
      <div class="code-bar mt" @click="copyCode">
        <span class="xs muted" style="letter-spacing:0.05em">JOIN CODE</span>
        <span class="join-code">{{ store.currentEvent.joinCode }}</span>
        <span class="xs" :style="{ color: copied ? 'var(--green)' : 'var(--text-dim)' }">
          {{ copied ? 'Copied!' : 'Click to copy' }}
        </span>
      </div>

      <!-- Participants -->
      <div class="card mt">
        <div class="flex between center" style="margin-bottom:12px">
          <h3>Participants</h3>
          <span class="badge badge-indigo">{{ checkedIn.length }} checked in</span>
        </div>
        <div v-if="store.participants.length === 0" class="empty" style="padding:16px"><p class="small muted">No participants yet. Share the join code.</p></div>
        <div v-else class="table-scroll">
          <table>
            <thead><tr><th></th><th>Name</th><th>Role</th></tr></thead>
            <tbody>
              <tr v-for="p in store.participants" :key="p.id">
                <td style="width:30px"><span class="dot" :class="p.checkedIn ? 'dot-on' : 'dot-off'"></span></td>
                <td style="font-weight:700">{{ p.name }}</td>
                <td><span :class="`badge badge-${p.role}`">{{ roleLabelSingle(p.role) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerts -->
      <div class="card mt">
        <h3 style="margin-bottom:12px">Broadcast Alert</h3>
        <form @submit.prevent="sendAlert">
          <input ref="alertInput" v-model="alertMsg" placeholder="Type alert message..." />
          <div class="flex gap" style="margin-top:8px">
            <select v-model="alertSev" style="width:auto;flex:0 0 auto">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="emergency">Emergency</option>
            </select>
            <button type="submit" class="btn btn-sm" :class="alertSev === 'emergency' ? 'btn-danger' : 'btn-primary'" :disabled="sending || !alertMsg.trim()" style="flex:1">
              {{ sending ? 'Sending...' : 'Send Alert' }}
            </button>
          </div>
        </form>

        <div style="margin-top:16px">
          <div class="flex between center mb">
            <span class="xs bold muted" style="letter-spacing:0.05em">RECENT ALERTS</span>
            <span class="live-tag"><span class="live-dot"></span> Live</span>
          </div>
          <div v-if="store.alerts.length === 0" class="dim small" style="text-align:center;padding:12px 0">No alerts sent</div>
          <div class="alert-scroll">
            <div v-for="a in store.alerts" :key="a.id" class="alert-item">
              <div class="alert-icon" :class="`alert-icon-${a.severity}`">
                <span v-if="a.severity==='info'" style="color:#fff;font-size:12px">i</span>
                <span v-else-if="a.severity==='warning'" style="color:#0a1628;font-size:14px;font-weight:800">!</span>
                <span v-else style="color:#fff;font-size:14px;font-weight:800">!</span>
              </div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700">{{ a.message }}</div>
                <div class="xs dim" style="margin-top:2px">{{ time(a.createdAt) }} &middot; {{ a.severity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      <p>Event not found. <router-link to="/">Go home</router-link></p>
    </div>

    <div class="toast" :class="{ show: copied }">Copied!</div>
  </div>
</template>

<style scoped>
.role-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.code-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 150ms;
}
.code-bar:hover { border-color: var(--indigo); }

.table-scroll { max-height: 350px; overflow-y: auto; }
.alert-scroll { max-height: 300px; overflow-y: auto; }

@media (max-width: 640px) {
  .code-bar { flex-direction: column; gap: 4px; }
}
</style>
