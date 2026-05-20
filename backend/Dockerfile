FROM golang:1.26.3-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN CGO_ENABLED=1 go build -o bin/surgemap ./cmd/main.go

FROM debian:bookworm-slim

WORKDIR /app
COPY --from=builder /app/bin/surgemap .

EXPOSE 8080
CMD ["./surgemap"]