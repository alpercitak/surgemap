.PHONY: run-backend run-frontend run build-backend build-frontend build

run-backend:
	cd backend && go mod tidy && go run ./cmd/main.go

run-frontend:
	cd frontend && bun install && bun dev

run:
	concurrently "make run-backend" "make run-frontend"

build-backend:
	cd backend && go build -o bin/surgemap ./cmd/main.go

build-frontend:
	cd frontend && bun install && bun run build

build:
	make build-backend
	make build-frontend
