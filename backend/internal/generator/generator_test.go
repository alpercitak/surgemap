package generator

import (
	"math"
	"testing"
	"time"

	"surgemap/internal/types"
)

func TestHotspotWeightsSumToOne(t *testing.T) {
	sum := 0.0
	for _, hs := range amsterdamHotspots {
		sum += hs.Weight
	}
	if math.Abs(sum-1) > 1e-9 {
		t.Fatalf("hotspot weights sum to %v, want 1", sum)
	}
}

func TestPointsStayNearAmsterdam(t *testing.T) {
	g := New(Config{SpreadMeters: 600, Seed: 1}, nil)
	for range 10000 {
		for _, et := range []types.EventType{types.EventDemand, types.EventSupply} {
			lat, lng := g.point(et)
			// Uniform bbox plus a generous Gaussian margin around hotspots
			if lat < 52.2 || lat > 52.5 || lng < 4.6 || lng > 5.2 {
				t.Fatalf("%s point (%v, %v) outside Amsterdam", et, lat, lng)
			}
		}
	}
}

func TestSeedIsReproducible(t *testing.T) {
	a := New(Config{SpreadMeters: 600, Seed: 42}, nil)
	b := New(Config{SpreadMeters: 600, Seed: 42}, nil)
	for range 100 {
		alat, alng := a.point(types.EventSupply)
		blat, blng := b.point(types.EventSupply)
		if alat != blat || alng != blng {
			t.Fatal("same seed produced different points")
		}
	}
}

// Run with -race: demand and supply goroutines share one RNG.
func TestConcurrentEmit(t *testing.T) {
	out := make(chan types.Event, 64)
	cfg := DefaultConfig()
	cfg.DemandRate, cfg.SupplyRate = 2000, 2000
	g := New(cfg, out)
	g.Start()
	deadline := time.After(100 * time.Millisecond)
	seen := map[types.EventType]int{}
	for {
		select {
		case ev := <-out:
			seen[ev.Type]++
		case <-deadline:
			g.Stop()
			if seen[types.EventDemand] == 0 || seen[types.EventSupply] == 0 {
				t.Fatalf("expected both event types, got %v", seen)
			}
			return
		}
	}
}
