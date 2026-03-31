import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEventStore = defineStore('event', () => {
  const currentEvent = ref(null)
  const participants = ref([])
  const alerts = ref([])
  const connection = ref(null)

  async function createEvent(name, description, organizerName) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, organizerName }),
    })
    if (!res.ok) throw new Error('Failed to create event')
    const data = await res.json()
    currentEvent.value = data
    return data
  }

  async function fetchEvent(id) {
    const res = await fetch(`/api/events/${id}`)
    if (!res.ok) throw new Error('Failed to fetch event')
    const data = await res.json()
    currentEvent.value = data
    return data
  }

  async function fetchEventByCode(code) {
    const res = await fetch(`/api/events/code/${code}`)
    if (!res.ok) throw new Error('Event not found')
    const data = await res.json()
    currentEvent.value = data
    return data
  }

  async function joinEvent(eventId, name, role) {
    const res = await fetch(`/api/events/${eventId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role }),
    })
    if (!res.ok) throw new Error('Failed to join event')
    return await res.json()
  }

  async function checkIn(participantId, lat, lng) {
    const res = await fetch(`/api/participants/${participantId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    if (!res.ok) throw new Error('Failed to check in')
    return await res.json()
  }

  async function sendAlert(eventId, message, severity) {
    const res = await fetch(`/api/events/${eventId}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, severity }),
    })
    if (!res.ok) throw new Error('Failed to send alert')
    const data = await res.json()
    alerts.value.unshift(data)
    return data
  }

  async function fetchParticipants(eventId) {
    const res = await fetch(`/api/events/${eventId}/participants`)
    if (!res.ok) throw new Error('Failed to fetch participants')
    const data = await res.json()
    participants.value = data
    return data
  }

  async function fetchAlerts(eventId) {
    const res = await fetch(`/api/events/${eventId}/alerts`)
    if (!res.ok) throw new Error('Failed to fetch alerts')
    const data = await res.json()
    alerts.value = data
    return data
  }

  function connectSSE(eventId) {
    // Close existing connection if any
    if (connection.value) {
      connection.value.close()
      connection.value = null
    }

    const es = new EventSource(`/api/events/${eventId}/stream`)
    connection.value = es

    es.addEventListener('participant_update', (e) => {
      try {
        const participant = JSON.parse(e.data)
        const idx = participants.value.findIndex((p) => p.id === participant.id)
        if (idx >= 0) {
          participants.value[idx] = participant
        } else {
          participants.value.push(participant)
        }
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('alert', (e) => {
      try {
        const alert = JSON.parse(e.data)
        const exists = alerts.value.some((a) => a.id === alert.id)
        if (!exists) {
          alerts.value.unshift(alert)
        }
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener('checkin', (e) => {
      try {
        const data = JSON.parse(e.data)
        const idx = participants.value.findIndex((p) => p.id === data.participantId || p.id === data.id)
        if (idx >= 0) {
          participants.value[idx] = { ...participants.value[idx], ...data, checkedIn: true }
        }
      } catch {
        // ignore parse errors
      }
    })

    es.onerror = () => {
      // Auto-reconnect is handled by the browser for SSE
    }

    return es
  }

  function disconnectSSE() {
    if (connection.value) {
      connection.value.close()
      connection.value = null
    }
  }

  return {
    currentEvent,
    participants,
    alerts,
    connection,
    createEvent,
    fetchEvent,
    fetchEventByCode,
    joinEvent,
    checkIn,
    sendAlert,
    fetchParticipants,
    fetchAlerts,
    connectSSE,
    disconnectSSE,
  }
})
