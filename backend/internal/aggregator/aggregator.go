package aggregator

import (
	"math"
	"sync"
	"time"

	h3 "github.com/uber/h3-go/v4"

	"surgemap/internal/types"
)

const (
	// DefaultResolution is H3 level 7 — city-block to neighbourhood granularity
	DefaultResolution = 7
	// DefaultWindow is the sliding window for event counting
	DefaultWindow = 30 * time.Second
	// TickInterval is how often the aggregator recomputes and emits snapshots
	TickInterval = 1 * time.Second
)

// SurgeAlgorithm is the swappable surge modifier interface.
// Swap in an ML-based implementation without touching aggregator logic.
type SurgeAlgorithm interface {
	Modifier(ratio float64) float64
}

// LinearSurge is the default — simple piecewise linear mapping.
// ratio 0–1.0 → 1.0x, 1.0–2.0 → 1.0–2.0x, >2.0 → capped at 3.0x
type LinearSurge struct{}

func (LinearSurge) Modifier(ratio float64) float64 {
	switch {
	case ratio <= 1.0:
		return 1.0
	case ratio >= 2.0:
		return 3.0
	default:
		return 1.0 + (ratio-1.0)*2.0
	}
}

// timestampedEvent wraps an event time for ring buffer expiry
type timestampedEvent struct {
	t time.Time
}

// cellBuffer holds the sliding window for one H3 cell
type cellBuffer struct {
	demand []timestampedEvent
	supply []timestampedEvent
}

func (b *cellBuffer) prune(cutoff time.Time) {
	b.demand = pruneOlderThan(b.demand, cutoff)
	b.supply = pruneOlderThan(b.supply, cutoff)
}

func pruneOlderThan(events []timestampedEvent, cutoff time.Time) []timestampedEvent {
	i := 0
	for i < len(events) && events[i].t.Before(cutoff) {
		i++
	}
	return events[i:]
}

type Config struct {
	Resolution int
	Window     time.Duration
	Algorithm  SurgeAlgorithm
}

func DefaultConfig() Config {
	return Config{
		Resolution: DefaultResolution,
		Window:     DefaultWindow,
		Algorithm:  LinearSurge{},
	}
}

type Aggregator struct {
	cfg    Config
	in     <-chan types.Event
	out    chan []types.CellState
	cells  map[h3.Cell]*cellBuffer
	mu     sync.Mutex
	stopCh chan struct{}
}

func New(cfg Config, in <-chan types.Event) *Aggregator {
	return &Aggregator{
		cfg:    cfg,
		in:     in,
		out:    make(chan []types.CellState, 1),
		cells:  make(map[h3.Cell]*cellBuffer),
		stopCh: make(chan struct{}),
	}
}

// Out returns the read-only channel of cell state snapshots
func (a *Aggregator) Out() <-chan []types.CellState {
	return a.out
}

func (a *Aggregator) Start() {
	go a.ingest()
	go a.tick()
}

func (a *Aggregator) Stop() {
	close(a.stopCh)
}

// ingest reads events and appends them to the correct cell buffer
func (a *Aggregator) ingest() {
	for {
		select {
		case <-a.stopCh:
			return
		case ev := <-a.in:
			cell := h3.LatLngToCell(h3.LatLng{Lat: ev.Lat, Lng: ev.Lng}, a.cfg.Resolution)
			a.mu.Lock()
			buf, ok := a.cells[cell]
			if !ok {
				buf = &cellBuffer{}
				a.cells[cell] = buf
			}
			ts := timestampedEvent{t: ev.Time}
			switch ev.Type {
			case types.EventDemand:
				buf.demand = append(buf.demand, ts)
			case types.EventSupply:
				buf.supply = append(buf.supply, ts)
			}
			a.mu.Unlock()
		}
	}
}

// tick fires every TickInterval, prunes old events, computes ratios, emits snapshot
func (a *Aggregator) tick() {
	ticker := time.NewTicker(TickInterval)
	defer ticker.Stop()

	for {
		select {
		case <-a.stopCh:
			return
		case now := <-ticker.C:
			cutoff := now.Add(-a.cfg.Window)
			snapshot := a.snapshot(cutoff)

			// Non-blocking send — drop frame if consumer is behind
			select {
			case a.out <- snapshot:
			default:
			}
		}
	}
}

func (a *Aggregator) snapshot(cutoff time.Time) []types.CellState {
	a.mu.Lock()
	defer a.mu.Unlock()

	states := make([]types.CellState, 0, len(a.cells))
	for cell, buf := range a.cells {
		buf.prune(cutoff)

		// Skip empty cells — no point broadcasting dead zones
		if len(buf.demand) == 0 && len(buf.supply) == 0 {
			continue
		}

		ratio := computeRatio(len(buf.demand), len(buf.supply))
		center := h3.CellToLatLng(cell)

		states = append(states, types.CellState{
			Index:    cell.String(),
			Lat:      center.Lat,
			Lng:      center.Lng,
			Demand:   len(buf.demand),
			Supply:   len(buf.supply),
			Ratio:    ratio,
			Modifier: a.cfg.Algorithm.Modifier(ratio),
		})
	}
	return states
}

// computeRatio returns demand/supply ratio.
// Pure demand with no supply → ratio 2.0 (immediate surge signal, not infinity).
// Pure supply with no demand → ratio 0.0.
func computeRatio(demand, supply int) float64 {
	if supply == 0 && demand == 0 {
		return 1.0
	}
	if supply == 0 {
		return 2.0 // cap — avoids Inf in the modifier
	}
	ratio := float64(demand) / float64(supply)
	return math.Round(ratio*100) / 100 // 2 decimal places
}
