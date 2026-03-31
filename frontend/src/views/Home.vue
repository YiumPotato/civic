<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const router = useRouter()
const store = useEventStore()
const tab = ref('create')

const eventName = ref('')
const eventDesc = ref('')
const organizerName = ref('')
const createLoading = ref(false)
const createError = ref('')

const joinCode = ref('')
const joinStep = ref(1)
const joinName = ref('')
const joinRole = ref('participant')
const joinLoading = ref(false)
const joinError = ref('')
const foundEvent = ref(null)

async function handleCreate() {
  if (!eventName.value.trim() || !organizerName.value.trim()) return
  createLoading.value = true
  createError.value = ''
  try {
    const event = await store.createEvent(eventName.value.trim(), eventDesc.value.trim(), organizerName.value.trim())
    router.push(`/event/${event.id}/dashboard`)
  } catch (e) {
    createError.value = e.message || 'Something went wrong'
  } finally { createLoading.value = false }
}

async function handleLookup() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length < 4) return
  joinLoading.value = true
  joinError.value = ''
  try {
    const event = await store.fetchEventByCode(code)
    foundEvent.value = event
    joinStep.value = 2
  } catch {
    joinError.value = 'Event not found. Check the code and try again.'
  } finally { joinLoading.value = false }
}

async function handleJoin() {
  if (!joinName.value.trim()) return
  joinLoading.value = true
  joinError.value = ''
  try {
    const p = await store.joinEvent(foundEvent.value.id, joinName.value.trim(), joinRole.value)
    router.push(`/event/${foundEvent.value.id}/participant/${p.id}`)
  } catch (e) {
    joinError.value = e.message || 'Failed to join'
  } finally { joinLoading.value = false }
}

function resetJoin() {
  joinStep.value = 1
  joinCode.value = ''
  joinName.value = ''
  joinRole.value = 'participant'
  foundEvent.value = null
  joinError.value = ''
}

const roles = [
  { value: 'participant', label: 'Participant' },
  { value: 'marshal', label: 'Marshal' },
  { value: 'medic', label: 'Medic' },
  { value: 'legal_observer', label: 'Legal Observer' },
]
</script>

<template>
  <div class="container">
    <div class="hero">
      <div class="hero-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <h1>Real-time coordination<br>for civic actions</h1>
      <p class="muted" style="margin-top:6px;font-size:14px">
        Create or join an event to get started.
      </p>
    </div>

    <div class="home-card card">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'create' }" @click="tab = 'create'">Create Event</button>
        <button class="tab" :class="{ active: tab === 'join' }" @click="tab = 'join'; resetJoin()">Join Event</button>
      </div>

      <!-- Create -->
      <form v-if="tab === 'create'" @submit.prevent="handleCreate" class="form-body">
        <div class="form-group">
          <label>Event Name</label>
          <input v-model="eventName" placeholder="March for Climate Justice" required />
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <input v-model="eventDesc" placeholder="Brief description..." />
        </div>
        <div class="form-group">
          <label>Your Name</label>
          <input v-model="organizerName" placeholder="Alex Rivera" required />
        </div>
        <p v-if="createError" class="err">{{ createError }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="createLoading || !eventName.trim() || !organizerName.trim()">
          {{ createLoading ? 'Creating...' : 'Create Event' }}
        </button>
      </form>

      <!-- Join step 1 -->
      <form v-else-if="joinStep === 1" @submit.prevent="handleLookup" class="form-body">
        <div class="form-group">
          <label>6-character Join Code</label>
          <input v-model="joinCode" placeholder="ABC123" maxlength="6" class="code-input" autocomplete="off" />
        </div>
        <p v-if="joinError" class="err">{{ joinError }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="joinLoading || joinCode.trim().length < 4">
          {{ joinLoading ? 'Looking up...' : 'Find Event' }}
        </button>
      </form>

      <!-- Join step 2 -->
      <div v-else class="form-body">
        <div class="found-event">
          <strong>{{ foundEvent?.name }}</strong>
          <span class="muted small" v-if="foundEvent?.description"> &mdash; {{ foundEvent.description }}</span>
        </div>
        <form @submit.prevent="handleJoin">
          <div class="form-group">
            <label>Your Name</label>
            <input v-model="joinName" placeholder="Your name" required />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="joinRole">
              <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>
          <p v-if="joinError" class="err">{{ joinError }}</p>
          <div class="flex gap">
            <button type="submit" class="btn btn-primary" style="flex:1" :disabled="joinLoading || !joinName.trim()">
              {{ joinLoading ? 'Joining...' : 'Join Event' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="resetJoin">Back</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding-top: 24px;
}

.hero-icon {
  width: 56px;
  height: 56px;
  background: var(--indigo);
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.home-card {
  max-width: 420px;
  margin: 20px auto 0;
  padding: 0;
  overflow: hidden;
}

.tabs {
  display: flex;
  background: #0e0e0e;
}

.tab {
  flex: 1;
  padding: 14px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: color 150ms;
  border-bottom: 2px solid transparent;
}
.tab:hover { color: var(--text-muted); }
.tab.active { color: var(--indigo-light); border-bottom-color: var(--indigo); background: var(--bg-card); }

.form-body { padding: 20px; }

.code-input {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-align: center;
  text-transform: uppercase;
}

.found-event {
  padding: 12px 16px;
  background: var(--indigo-bg);
  border: 1px solid var(--indigo-border);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 14px;
}

.err { color: var(--red-light); font-size: 12px; margin-bottom: 12px; }
</style>
