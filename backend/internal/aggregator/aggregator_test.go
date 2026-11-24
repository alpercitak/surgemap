package aggregator

import (
	"testing"
	"time"

	"surgemap/internal/types"
)

func TestLinearSurge(t *testing.T) {
	cases := map[float64]float64{0: 1, 1: 1, 1.25: 1.5, 1.5: 2, 2: 3, 10: 3}
	for ratio, want := range cases {
		if got := (LinearSurge{}).Modifier(ratio); got != want {
			t.Errorf("Modifier(%v) = %v, want %v", ratio, got, want)
		}
	}
}

func TestComputeRatio(t *testing.T) {
	cases := []struct {
		demand, supply int
		want           float64
	}{
		{0, 0, 1},
		{3, 0, 2},
		{0, 4, 0},
		{2, 3, 0.67},
	}
	for _, c := range cases {
		if got := computeRatio(c.demand, c.supply); got != c.want {
			t.Errorf("computeRatio(%d, %d) = %v, want %v", c.demand, c.supply, got, c.want)
		}
	}
}

func TestSnapshotPrunesExpiredCells(t *testing.T) {
	a := New(DefaultConfig(), nil)
	now := time.Now()
	a.add(types.Event{Type: types.EventDemand, Lat: 52.37, Lng: 4.90, Time: now.Add(-time.Minute)})
	a.add(types.Event{Type: types.EventDemand, Lat: 52.37, Lng: 4.90, Time: now})
	a.add(types.Event{Type: types.EventSupply, Lat: 52.37, Lng: 4.90, Time: now})

	states := a.snapshot(now.Add(-a.cfg.Window))
	if len(states) != 1 {
		t.Fatalf("got %d cells, want 1", len(states))
	}
	if s := states[0]; s.Demand != 1 || s.Supply != 1 || s.Modifier != 1 {
		t.Fatalf("unexpected state %+v", s)
	}

	if states := a.snapshot(now.Add(time.Hour)); len(states) != 0 {
		t.Fatalf("expected all events expired, got %d cells", len(states))
	}
}
