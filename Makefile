.PHONY: dev-backend dev-frontend dev build-backend build-frontend build

dev-backend:
	cd backend && go mod tidy && go run ./cmd/main.go

dev-frontend:
	cd frontend && bun install && bun dev

dev-frontend-demo:
	cd frontend && bun install && VITE_RUNTIME_MODE=demo bun dev	

dev:
	concurrently "make dev-backend" "make dev-frontend"

build-backend:
	cd backend && go build -o bin/surgemap ./cmd/main.go

build-frontend:
	cd frontend && bun install && bun run build

build:
	make build-backend
	make build-frontend

up:
	docker-compose up --build --remove-orphans -d

down:
	docker-compose down