.PHONY: dev dev-backend dev-frontend dev-frontend-demo build build-backend build-frontend lint test up down

dev-backend:
	cd backend && go run ./cmd/main.go

dev-frontend:
	cd frontend && bun install && bun dev

dev-frontend-demo:
	cd frontend && bun install && VITE_RUNTIME_MODE=demo bun dev

dev:
	$(MAKE) -j2 dev-backend dev-frontend

build-backend:
	cd backend && go build -o bin/surgemap ./cmd/main.go

build-frontend:
	cd frontend && bun install && bun run build

lint:
	cd backend && go vet ./...
	cd frontend && bun install && bun run lint && bun run typecheck

test:
	cd backend && go test -race ./...

build:
	$(MAKE) build-backend
	$(MAKE) build-frontend

up:
	docker-compose up --build --remove-orphans -d

down:
	docker-compose down
