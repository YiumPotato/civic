<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/event.js'

const router = useRouter()
const store = useEventStore()

// Create event form
const eventName = ref('')
const eventDesc = ref('')
const organizerName = ref('')
const createLoading = ref(false)
const createError = ref('')

// Join event form
const joinCode = ref('')
const joinStep = ref(1) // 1 = enter code, 2 = enter name/role
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
    const event = await store.createEvent(
      eventName.value.trim(),
      eventDesc.value.trim(),
      organizerName.value.trim()
    )
    router.push(`/event/${event.id}/dashboard`)
  } catch (e) {
    createError.value = e.message || 'Something went wrong'
  } finally {
    createLoading.value = false
  }
}

async function handleLookupCode() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length < 4) return
  joinLoading.value = true
  joinError.value = ''
  try {
    const event = await store.fetchEventByCode(code)
    foundEvent.value = event
    joinStep.value = 2
  } catch (e) {
    joinError.value = 'Event not found. Check the code and try again.'
  } finally {
    joinLoading.value = false
  }
}

async function handleJoin() {
  if (!joinName.value.trim()) return
  joinLoading.value = true
  joinError.value = ''
  try {
    const participant = await store.joinEvent(
      foundEvent.value.id,
      joinName.value.trim(),
      joinRole.value
    )
    router.push(`/event/${foundEvent.value.id}/participant/${participant.id}`)
  } catch (e) {
    joinError.value = e.message || 'Failed to join'
  } finally {
    joinLoading.value = false
  }
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
      <h1>Coordinate. Mobilize. <span class="accent">Protect.</span></h1>
      <p class="text-muted">
        Real-time coordination for demonstrations, rallies, and community actions.
      </p>
    </div>

    <div class="grid-2 mt-3">
      <!-- Create Event Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-icon">+</span>
          <h2>Create Event</h2>
        </div>
        <p class="text-muted text-sm mb-2">
          Organize a new event and get a shareable join code.
        </p>

        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label for="event-name">Event Name</label>
            <input
              id="event-name"
              v-model="eventName"
              placeholder="March for Climate Justice"
              required
            />
          </div>
          <div class="form-group">
            <label for="event-desc">Description</label>
            <textarea
              id="event-desc"
              v-model="eventDesc"
              placeholder="Brief description of the event..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="organizer-name">Your Name</label>
            <input
              id="organizer-name"
              v-model="organizerName"
              placeholder="Alex Rivera"
              required
            />
          </div>
          <p v-if="createError" class="error-text">{{ createError }}</p>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="createLoading || !eventName.trim() || !organizerName.trim()"
          >
            {{ createLoading ? 'Creating...' : 'Create Event' }}
          </button>
        </form>
      </div>

      <!-- Join Event Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-icon">&rarr;</span>
          <h2>Join Event</h2>
        </div>
        <p class="text-muted text-sm mb-2">
          Enter the 6-character code shared by your organizer.
        </p>

        <!-- Step 1: Enter code -->
        <form v-if="joinStep === 1" @submit.prevent="handleLookupCode">
          <div class="form-group">
            <label for="join-code">Join Code</label>
            <input
              id="join-code"
              v-model="joinCode"
              placeholder="ABC123"
              maxlength="6"
              class="code-input"
              autocomplete="off"
            />
          </div>
          <p v-if="joinError" class="error-text">{{ joinError }}</p>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="joinLoading || joinCode.trim().length < 4"
          >
            {{ joinLoading ? 'Looking up...' : 'Find Event' }}
          </button>
        </form>

        <!-- Step 2: Found event, enter details -->
        <div v-else>
          <div class="found-event mb-2">
            <div class="found-event-name">{{ foundEvent?.name }}</div>
            <div class="text-muted text-sm">{{ foundEvent?.description }}</div>
          </div>

          <form @submit.prevent="handleJoin">
            <div class="form-group">
              <label for="join-name">Your Name</label>
              <input
                id="join-name"
                v-model="joinName"
                placeholder="Your name"
                required
              />
            </div>
            <div class="form-group">
              <label for="join-role">Your Role</label>
              <select id="join-role" v-model="joinRole">
                <option v-for="r in roles" :key="r.value" :value="r.value">
                  {{ r.label }}
                </option>
              </select>
            </div>
            <p v-if="joinError" class="error-text">{{ joinError }}</p>
            <div class="flex gap-1">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="joinLoading || !joinName.trim()"
              >
                {{ joinLoading ? 'Joining...' : 'Join Event' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="resetJoin">
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 2rem 0 0;
}

.hero h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.hero .accent {
  color: var(--accent);
}

.hero p {
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-glow);
  color: var(--accent);
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.code-input {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-align: center;
  text-transform: uppercase;
}

.found-event {
  background: var(--bg-primary);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 1rem;
}

.found-event-name {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.error-text {
  color: var(--severity-emergency);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 1.75rem;
  }
}
</style>
