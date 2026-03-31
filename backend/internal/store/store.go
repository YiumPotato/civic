package store

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"civic/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

type Store struct {
	db *sql.DB
}

func NewStore(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := createTables(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("create tables: %w", err)
	}

	return &Store{db: db}, nil
}

func createTables(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS events (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		organizer_name TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		join_code TEXT NOT NULL UNIQUE
	);

	CREATE TABLE IF NOT EXISTS participants (
		id TEXT PRIMARY KEY,
		event_id TEXT NOT NULL REFERENCES events(id),
		name TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'participant',
		checked_in BOOLEAN NOT NULL DEFAULT 0,
		lat REAL NOT NULL DEFAULT 0,
		lng REAL NOT NULL DEFAULT 0,
		checked_in_at DATETIME
	);

	CREATE TABLE IF NOT EXISTS alerts (
		id TEXT PRIMARY KEY,
		event_id TEXT NOT NULL REFERENCES events(id),
		message TEXT NOT NULL,
		severity TEXT NOT NULL DEFAULT 'info',
		created_at DATETIME NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
	CREATE INDEX IF NOT EXISTS idx_alerts_event ON alerts(event_id);
	CREATE INDEX IF NOT EXISTS idx_events_join_code ON events(join_code);
	`
	_, err := db.Exec(schema)
	return err
}

func generateID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func generateJoinCode() (string, error) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := range b {
		b[i] = chars[int(b[i])%len(chars)]
	}
	return string(b), nil
}

func (s *Store) CreateEvent(name, description, organizerName string) (models.Event, error) {
	id, err := generateID()
	if err != nil {
		return models.Event{}, fmt.Errorf("generate id: %w", err)
	}
	joinCode, err := generateJoinCode()
	if err != nil {
		return models.Event{}, fmt.Errorf("generate join code: %w", err)
	}
	now := time.Now().UTC()

	_, err = s.db.Exec(
		`INSERT INTO events (id, name, description, organizer_name, created_at, join_code)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		id, name, description, organizerName, now, joinCode,
	)
	if err != nil {
		return models.Event{}, fmt.Errorf("insert event: %w", err)
	}

	return models.Event{
		ID:            id,
		Name:          name,
		Description:   description,
		OrganizerName: organizerName,
		CreatedAt:     now,
		JoinCode:      joinCode,
	}, nil
}

func (s *Store) GetEvent(id string) (models.Event, error) {
	var e models.Event
	err := s.db.QueryRow(
		`SELECT id, name, description, organizer_name, created_at, join_code
		 FROM events WHERE id = ?`, id,
	).Scan(&e.ID, &e.Name, &e.Description, &e.OrganizerName, &e.CreatedAt, &e.JoinCode)
	if err != nil {
		return models.Event{}, fmt.Errorf("get event: %w", err)
	}
	return e, nil
}

func (s *Store) GetEventByJoinCode(code string) (models.Event, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	var e models.Event
	err := s.db.QueryRow(
		`SELECT id, name, description, organizer_name, created_at, join_code
		 FROM events WHERE join_code = ?`, code,
	).Scan(&e.ID, &e.Name, &e.Description, &e.OrganizerName, &e.CreatedAt, &e.JoinCode)
	if err != nil {
		return models.Event{}, fmt.Errorf("get event by join code: %w", err)
	}
	return e, nil
}

func (s *Store) JoinEvent(eventID, name, role string) (models.Participant, error) {
	id, err := generateID()
	if err != nil {
		return models.Participant{}, fmt.Errorf("generate id: %w", err)
	}

	_, err = s.db.Exec(
		`INSERT INTO participants (id, event_id, name, role)
		 VALUES (?, ?, ?, ?)`,
		id, eventID, name, role,
	)
	if err != nil {
		return models.Participant{}, fmt.Errorf("insert participant: %w", err)
	}

	return models.Participant{
		ID:      id,
		EventID: eventID,
		Name:    name,
		Role:    role,
	}, nil
}

func (s *Store) CheckIn(participantID string, lat, lng float64) (models.Participant, error) {
	now := time.Now().UTC()
	_, err := s.db.Exec(
		`UPDATE participants SET checked_in = 1, lat = ?, lng = ?, checked_in_at = ?
		 WHERE id = ?`,
		lat, lng, now, participantID,
	)
	if err != nil {
		return models.Participant{}, fmt.Errorf("check in: %w", err)
	}

	var p models.Participant
	var checkedInAt sql.NullTime
	err = s.db.QueryRow(
		`SELECT id, event_id, name, role, checked_in, lat, lng, checked_in_at
		 FROM participants WHERE id = ?`, participantID,
	).Scan(&p.ID, &p.EventID, &p.Name, &p.Role, &p.CheckedIn, &p.Lat, &p.Lng, &checkedInAt)
	if err != nil {
		return models.Participant{}, fmt.Errorf("get participant: %w", err)
	}
	if checkedInAt.Valid {
		p.CheckedInAt = checkedInAt.Time
	}
	return p, nil
}

func (s *Store) ListParticipants(eventID string) ([]models.Participant, error) {
	rows, err := s.db.Query(
		`SELECT id, event_id, name, role, checked_in, lat, lng, checked_in_at
		 FROM participants WHERE event_id = ? ORDER BY name`, eventID,
	)
	if err != nil {
		return nil, fmt.Errorf("list participants: %w", err)
	}
	defer rows.Close()

	var participants []models.Participant
	for rows.Next() {
		var p models.Participant
		var checkedInAt sql.NullTime
		if err := rows.Scan(&p.ID, &p.EventID, &p.Name, &p.Role, &p.CheckedIn, &p.Lat, &p.Lng, &checkedInAt); err != nil {
			return nil, fmt.Errorf("scan participant: %w", err)
		}
		if checkedInAt.Valid {
			p.CheckedInAt = checkedInAt.Time
		}
		participants = append(participants, p)
	}
	if participants == nil {
		participants = []models.Participant{}
	}
	return participants, rows.Err()
}

func (s *Store) CreateAlert(eventID, message, severity string) (models.Alert, error) {
	id, err := generateID()
	if err != nil {
		return models.Alert{}, fmt.Errorf("generate id: %w", err)
	}
	now := time.Now().UTC()

	_, err = s.db.Exec(
		`INSERT INTO alerts (id, event_id, message, severity, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		id, eventID, message, severity, now,
	)
	if err != nil {
		return models.Alert{}, fmt.Errorf("insert alert: %w", err)
	}

	return models.Alert{
		ID:        id,
		EventID:   eventID,
		Message:   message,
		Severity:  severity,
		CreatedAt: now,
	}, nil
}

func (s *Store) ListAlerts(eventID string) ([]models.Alert, error) {
	rows, err := s.db.Query(
		`SELECT id, event_id, message, severity, created_at
		 FROM alerts WHERE event_id = ? ORDER BY created_at DESC`, eventID,
	)
	if err != nil {
		return nil, fmt.Errorf("list alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		if err := rows.Scan(&a.ID, &a.EventID, &a.Message, &a.Severity, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan alert: %w", err)
		}
		alerts = append(alerts, a)
	}
	if alerts == nil {
		alerts = []models.Alert{}
	}
	return alerts, rows.Err()
}

func (s *Store) Close() error {
	return s.db.Close()
}
