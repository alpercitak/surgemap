package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"surgemap/internal/aggregator"
	"surgemap/internal/generator"
	"surgemap/internal/types"
	"surgemap/internal/ws"
)

func main() {
	port := envOr("PORT", "8080")
	resolution := envIntOr("H3_RESOLUTION", aggregator.DefaultResolution)

	// Event channel: generator → aggregator
	// Buffered to absorb bursts without blocking the generator goroutines
	events := make(chan types.Event, 256)

	// Wire up generator
	genCfg := generator.DefaultConfig()
	gen := generator.New(genCfg, events)

	// Wire up aggregator
	aggCfg := aggregator.DefaultConfig()
	aggCfg.Resolution = resolution
	agg := aggregator.New(aggCfg, events)

	// Wire up WebSocket hub
	hub := ws.NewHub()

	// Start pipeline
	agg.Start()
	gen.Start()

	// Fan out aggregator output → WebSocket hub
	go func() {
		for states := range agg.Out() {
			hub.Broadcast(states)
		}
	}()

	// HTTP routes
	http.HandleFunc("/ws", hub.ServeWS)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	log.Printf("surgemap backend listening on :%s (H3 resolution %d)", port, resolution)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envIntOr(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
