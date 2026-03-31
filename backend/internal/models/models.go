package models

import "time"

type Event struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	OrganizerName string    `json:"organizerName"`
	CreatedAt     time.Time `json:"createdAt"`
	JoinCode      string    `json:"joinCode"`
}

type Participant struct {
	ID          string    `json:"id"`
	EventID     string    `json:"eventId"`
	Name        string    `json:"name"`
	Role        string    `json:"role"`
	CheckedIn   bool      `json:"checkedIn"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	CheckedInAt time.Time `json:"checkedInAt"`
}

type Alert struct {
	ID        string    `json:"id"`
	EventID   string    `json:"eventId"`
	Message   string    `json:"message"`
	Severity  string    `json:"severity"`
	CreatedAt time.Time `json:"createdAt"`
}
