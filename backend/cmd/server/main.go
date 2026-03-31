package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"

	backend "civic"
	"civic/internal/api"
	"civic/internal/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "civic.db"
	}

	// Initialize SQLite store
	s, err := store.NewStore(dbPath)
	if err != nil {
		log.Fatalf("failed to initialize store: %v", err)
	}
	defer s.Close()

	// Get the embedded frontend filesystem, rooted at frontend/dist
	frontendFS, err := fs.Sub(backend.FrontendFS, "frontend_dist")
	if err != nil {
		log.Fatalf("failed to create sub filesystem: %v", err)
	}

	// Get the embedded prototype filesystem
	prototypeFS, err := fs.Sub(backend.PrototypeFS, "prototype_dist")
	if err != nil {
		log.Fatalf("failed to create prototype sub filesystem: %v", err)
	}

	// Set up routes
	mux := http.NewServeMux()
	handler := api.NewHandler(s, frontendFS)
	handler.RegisterRoutes(mux)

	// Serve MVP prototype at /mvp
	mux.Handle("GET /mvp/", http.StripPrefix("/mvp/", http.FileServerFS(prototypeFS)))
	mux.HandleFunc("GET /mvp", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/mvp/", http.StatusMovedPermanently)
	})

	log.Printf("Civic server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
