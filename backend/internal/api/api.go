package api

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"civic/internal/store"
)

// SSE event types
const (
	EventParticipantJoined  = "participant_joined"
	EventParticipantCheckin = "participant_checkin"
	EventAlertCreated       = "alert_created"
)

// SSEMessage is the payload sent over SSE connections.
type SSEMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Broker manages SSE subscriptions per event.
type Broker struct {
	mu          sync.RWMutex
	subscribers map[string]map[chan SSEMessage]struct{}
}

func NewBroker() *Broker {
	return &Broker{
		subscribers: make(map[string]map[chan SSEMessage]struct{}),
	}
}

func (b *Broker) Subscribe(eventID string) chan SSEMessage {
	b.mu.Lock()
	defer b.mu.Unlock()
	ch := make(chan SSEMessage, 16)
	if b.subscribers[eventID] == nil {
		b.subscribers[eventID] = make(map[chan SSEMessage]struct{})
	}
	b.subscribers[eventID][ch] = struct{}{}
	return ch
}

func (b *Broker) Unsubscribe(eventID string, ch chan SSEMessage) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if subs, ok := b.subscribers[eventID]; ok {
		delete(subs, ch)
		if len(subs) == 0 {
			delete(b.subscribers, eventID)
		}
	}
	close(ch)
}

func (b *Broker) Broadcast(eventID string, msg SSEMessage) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch := range b.subscribers[eventID] {
		select {
		case ch <- msg:
		default:
			// drop message if subscriber is slow
		}
	}
}

// Handler holds dependencies for the HTTP API.
type Handler struct {
	store      *store.Store
	broker     *Broker
	frontendFS fs.FS
}

// NewHandler creates a new API handler.
func NewHandler(s *store.Store, frontendFS fs.FS) *Handler {
	return &Handler{
		store:      s,
		broker:     NewBroker(),
		frontendFS: frontendFS,
	}
}

// RegisterRoutes registers all API and frontend routes on the given mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	// API routes (Go 1.22 method-based routing)
	mux.HandleFunc("POST /api/events", h.cors(h.createEvent))
	mux.HandleFunc("GET /api/join/{code}", h.cors(h.getEventByJoinCode))
	mux.HandleFunc("GET /api/events/{id}", h.cors(h.getEvent))
	mux.HandleFunc("POST /api/events/{id}/join", h.cors(h.joinEvent))
	mux.HandleFunc("POST /api/events/{id}/checkin", h.cors(h.checkIn))
	mux.HandleFunc("GET /api/events/{id}/participants", h.cors(h.listParticipants))
	mux.HandleFunc("POST /api/events/{id}/alerts", h.cors(h.createAlert))
	mux.HandleFunc("GET /api/events/{id}/alerts", h.cors(h.listAlerts))
	mux.HandleFunc("GET /api/events/{id}/stream", h.cors(h.stream))

	// CORS preflight for all /api/ routes
	mux.HandleFunc("OPTIONS /api/", h.cors(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	// SPA fallback: serve frontend files, fall back to index.html
	mux.HandleFunc("GET /", h.serveFrontend)
}

// cors wraps a handler with CORS headers.
func (h *Handler) cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		next(w, r)
	}
}

func (h *Handler) serveFrontend(w http.ResponseWriter, r *http.Request) {
	// Try to serve the requested file from the embedded FS
	path := r.URL.Path
	if path == "/" {
		path = "index.html"
	} else {
		path = strings.TrimPrefix(path, "/")
	}

	// Check if file exists in the embedded FS
	f, err := h.frontendFS.Open(path)
	if err == nil {
		f.Close()
		http.ServeFileFS(w, r, h.frontendFS, path)
		return
	}

	// SPA fallback: serve index.html for client-side routing
	http.ServeFileFS(w, r, h.frontendFS, "index.html")
}

// --- API handlers ---

func (h *Handler) createEvent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name          string `json:"name"`
		Description   string `json:"description"`
		OrganizerName string `json:"organizerName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" || req.OrganizerName == "" {
		writeError(w, http.StatusBadRequest, "name and organizerName are required")
		return
	}

	event, err := h.store.CreateEvent(req.Name, req.Description, req.OrganizerName)
	if err != nil {
		log.Printf("create event error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create event")
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (h *Handler) getEvent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	event, err := h.store.GetEvent(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	writeJSON(w, http.StatusOK, event)
}

func (h *Handler) getEventByJoinCode(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	event, err := h.store.GetEventByJoinCode(code)
	if err != nil {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}
	writeJSON(w, http.StatusOK, event)
}

func (h *Handler) joinEvent(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")

	// Verify event exists
	if _, err := h.store.GetEvent(eventID); err != nil {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}

	var req struct {
		Name string `json:"name"`
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if !isValidRole(req.Role) {
		writeError(w, http.StatusBadRequest, "invalid role")
		return
	}

	participant, err := h.store.JoinEvent(eventID, req.Name, req.Role)
	if err != nil {
		log.Printf("join event error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to join event")
		return
	}

	// Broadcast to SSE listeners
	h.broker.Broadcast(eventID, SSEMessage{
		Type: EventParticipantJoined,
		Data: participant,
	})

	writeJSON(w, http.StatusCreated, participant)
}

func (h *Handler) checkIn(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")

	var req struct {
		ParticipantID string  `json:"participantId"`
		Lat           float64 `json:"lat"`
		Lng           float64 `json:"lng"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ParticipantID == "" {
		writeError(w, http.StatusBadRequest, "participantId is required")
		return
	}

	participant, err := h.store.CheckIn(req.ParticipantID, req.Lat, req.Lng)
	if err != nil {
		log.Printf("check in error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to check in")
		return
	}

	// Broadcast to SSE listeners
	h.broker.Broadcast(eventID, SSEMessage{
		Type: EventParticipantCheckin,
		Data: participant,
	})

	writeJSON(w, http.StatusOK, participant)
}

func (h *Handler) listParticipants(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")
	participants, err := h.store.ListParticipants(eventID)
	if err != nil {
		log.Printf("list participants error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to list participants")
		return
	}
	writeJSON(w, http.StatusOK, participants)
}

func (h *Handler) createAlert(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")

	// Verify event exists
	if _, err := h.store.GetEvent(eventID); err != nil {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}

	var req struct {
		Message  string `json:"message"`
		Severity string `json:"severity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}
	if !isValidSeverity(req.Severity) {
		writeError(w, http.StatusBadRequest, "invalid severity (must be info, warning, or emergency)")
		return
	}

	alert, err := h.store.CreateAlert(eventID, req.Message, req.Severity)
	if err != nil {
		log.Printf("create alert error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create alert")
		return
	}

	// Broadcast to SSE listeners
	h.broker.Broadcast(eventID, SSEMessage{
		Type: EventAlertCreated,
		Data: alert,
	})

	writeJSON(w, http.StatusCreated, alert)
}

func (h *Handler) listAlerts(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")
	alerts, err := h.store.ListAlerts(eventID)
	if err != nil {
		log.Printf("list alerts error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to list alerts")
		return
	}
	writeJSON(w, http.StatusOK, alerts)
}

func (h *Handler) stream(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	flusher.Flush()

	ch := h.broker.Subscribe(eventID)
	defer h.broker.Unsubscribe(eventID, ch)

	// Send keepalive comment immediately so the client knows the connection is live
	fmt.Fprintf(w, ": connected\n\n")
	flusher.Flush()

	ctx := r.Context()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			data, err := json.Marshal(msg)
			if err != nil {
				log.Printf("marshal SSE message: %v", err)
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		case <-ticker.C:
			// Keepalive comment
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func isValidRole(role string) bool {
	switch role {
	case "organizer", "marshal", "medic", "legal_observer", "participant":
		return true
	}
	return false
}

func isValidSeverity(severity string) bool {
	switch severity {
	case "info", "warning", "emergency":
		return true
	}
	return false
}
