# Surgemap

Real-time surge map. Go backend (`backend/`) aggregates simulated demand and supply into H3 cells and streams them over WebSocket (`/ws`). Vite + React frontend (`frontend/`) renders them with deck.gl on MapLibre. `VITE_RUNTIME_MODE=demo` runs the frontend without the backend.

## Commands

- `make dev`: run backend and frontend.
- `make dev-frontend-demo`: run the frontend with generated demo data.
- `make build`: build backend and frontend.
- `make lint`: run Biome on the frontend.
- `cd frontend && bun run format`: apply Biome formatting, safe fixes, and import sorting.

## Conventions

- Use Bun for frontend dependencies and scripts.
- Biome (`biome.json`) is the single formatter and linter for the frontend. Do not add ESLint or Prettier.
- Use `@/` for imports outside the current component directory; use relative imports within it.
- Components live in `src/components/<name>/index.tsx` with a co-located `index.module.css`; component-specific constants, types, and helpers sit beside them.
- Shared types live in `src/types`; data sources live in `src/hooks`.
- Keep Go code `gofmt`-formatted and inside `backend/internal/<package>`.

## TypeScript / React

- Use precise types. Avoid `any`, unnecessary assertions, and non-null assertions where types can be modeled correctly.
- Keep state minimal. Derive values instead of duplicating state or using unnecessary effects.
- Avoid memoization without a concrete performance reason.

## Verification

- Frontend changes: `make lint` and `make build-frontend`.
- Backend changes: `cd backend && go vet ./...` and `make build-backend`.
