.PHONY: dev dev-frontend dev-backend build clean

# Run both frontend and backend in dev mode
dev:
	@echo "Starting backend on :8080 and frontend on :5173..."
	@make dev-backend & make dev-frontend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && CGO_ENABLED=1 go run ./cmd/server

# Production build: compile SPA into Go binary
build:
	cd frontend && npm run build
	rm -rf backend/frontend_dist
	cp -r frontend/dist backend/frontend_dist
	cd backend && CGO_ENABLED=1 go build -o civic-server ./cmd/server
	@echo "Built: backend/civic-server"

clean:
	rm -rf frontend/dist frontend/node_modules backend/frontend_dist backend/civic-server backend/civic.db
