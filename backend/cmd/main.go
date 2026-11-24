package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"surgemap/internal/aggregator"
	"surgemap/internal/generator"
	"surgemap/internal/types"
	"surgemap/internal/ws"
)

func main() {
	port := envOr("PORT", "8080")

	genCfg := generator.DefaultConfig()
	genCfg.DemandRate = envFloatOr("DEMAND_RATE", genCfg.DemandRate)
	genCfg.SupplyRate = envFloatOr("SUPPLY_RATE", genCfg.SupplyRate)

	aggCfg := aggregator.DefaultConfig()
	aggCfg.Resolution = envIntOr("H3_RESOLUTION", aggCfg.Resolution)
	aggCfg.Window = time.Duration(envIntOr("WINDOW_SECONDS", int(aggCfg.Window/time.Second))) * time.Second

	if aggCfg.Resolution < 0 || aggCfg.Resolution > 15 {
		log.Fatalf("H3_RESOLUTION must be 0–15, got %d", aggCfg.Resolution)
	}
	if aggCfg.Window <= 0 {
		log.Fatalf("WINDOW_SECONDS must be > 0")
	}
	if genCfg.DemandRate <= 0 || genCfg.SupplyRate <= 0 {
		log.Fatalf("DEMAND_RATE and SUPPLY_RATE must be > 0")
	}

	// Event channel: generator → aggregator
	// Buffered to absorb bursts without blocking the generator goroutines
	events := make(chan types.Event, 256)

	gen := generator.New(genCfg, events)
	agg := aggregator.New(aggCfg, events)
	hub := ws.NewHub()

	agg.Start()
	gen.Start()

	// Fan out aggregator output → WebSocket hub
	go func() {
		for states := range agg.Out() {
			hub.Broadcast(states)
		}
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.ServeWS)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("surgemap backend listening on :%s (H3 resolution %d, window %s, demand %.1f/s, supply %.1f/s)",
			port, aggCfg.Resolution, aggCfg.Window, genCfg.DemandRate, genCfg.SupplyRate)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	log.Printf("shutting down")
	gen.Stop()
	agg.Stop()

	// Shutdown does not close hijacked WebSocket conns; they end when the process exits
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envIntOr(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Fatalf("%s: invalid integer %q", key, v)
	}
	return n
}

func envFloatOr(key string, fallback float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		log.Fatalf("%s: invalid number %q", key, v)
	}
	return f
}
