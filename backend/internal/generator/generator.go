package generator

import (
	"math"
	"math/rand"
	"time"

	"surgemap/internal/types"
)

// Hotspot represents a demand concentration point on the map
type Hotspot struct {
	Name   string
	Lat    float64
	Lng    float64
	Weight float64 // relative probability of demand events here
}

// amsterdamHotspots — real Amsterdam coordinates
var amsterdamHotspots = []Hotspot{
	{"Centraal Station", 52.3791, 4.9003, 0.30},
	{"Leidseplein", 52.3638, 4.8830, 0.20},
	{"Rembrandtplein", 52.3665, 4.8963, 0.15},
	{"Schiphol", 52.3105, 4.7683, 0.15},
	{"Zuidas", 52.3392, 4.8727, 0.10},
	{"NDSM Wharf", 52.4010, 4.8985, 0.05},
	{"Oost / Indische Buurt", 52.3603, 4.9345, 0.05},
}

// Config holds generator tuning parameters
type Config struct {
	// DemandRate: events per second across all hotspots
	DemandRate float64
	// SupplyRate: events per second (lower than demand in hotspots = surge)
	SupplyRate float64
	// SpreadMeters: Gaussian spread radius around each hotspot
	SpreadMeters float64
	// Seed: 0 = random, non-zero = reproducible
	Seed int64
}

func DefaultConfig() Config {
	return Config{
		DemandRate:   8.0,
		SupplyRate:   5.0, // supply < demand → surge in hot areas
		SpreadMeters: 600,
		Seed:         0,
	}
}

type Generator struct {
	cfg    Config
	out    chan<- types.Event
	rng    *rand.Rand
	stopCh chan struct{}
}

func New(cfg Config, out chan<- types.Event) *Generator {
	seed := cfg.Seed
	if seed == 0 {
		seed = time.Now().UnixNano()
	}
	return &Generator{
		cfg:    cfg,
		out:    out,
		rng:    rand.New(rand.NewSource(seed)),
		stopCh: make(chan struct{}),
	}
}

func (g *Generator) Start() {
	go g.emit(types.EventDemand, g.cfg.DemandRate)
	go g.emit(types.EventSupply, g.cfg.SupplyRate)
}

func (g *Generator) Stop() {
	close(g.stopCh)
}

// emit fires events at the given rate (events/sec) for the given type.
// Supply events use a uniform distribution across the city rather than
// hotspot-weighted — drivers are spread out, not clustered at demand points.
func (g *Generator) emit(et types.EventType, rate float64) {
	interval := time.Duration(float64(time.Second) / rate)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-g.stopCh:
			return
		case t := <-ticker.C:
			var lat, lng float64
			if et == types.EventDemand {
				lat, lng = g.hotspotPoint()
			} else {
				lat, lng = g.uniformPoint()
			}
			g.out <- types.Event{
				Type: et,
				Lat:  lat,
				Lng:  lng,
				Time: t,
			}
		}
	}
}

// hotspotPoint picks a hotspot weighted by demand, then adds Gaussian noise
func (g *Generator) hotspotPoint() (float64, float64) {
	hs := g.weightedHotspot()
	return g.gaussianOffset(hs.Lat, hs.Lng, g.cfg.SpreadMeters)
}

// uniformPoint returns a random point within Amsterdam's bounding box
func (g *Generator) uniformPoint() (float64, float64) {
	// Amsterdam bbox: lat 52.28–52.43, lng 4.73–5.08
	lat := 52.28 + g.rng.Float64()*(52.43-52.28)
	lng := 4.73 + g.rng.Float64()*(5.08-4.73)
	return lat, lng
}

func (g *Generator) weightedHotspot() Hotspot {
	r := g.rng.Float64()
	cumulative := 0.0
	for _, hs := range amsterdamHotspots {
		cumulative += hs.Weight
		if r <= cumulative {
			return hs
		}
	}
	return amsterdamHotspots[len(amsterdamHotspots)-1]
}

// gaussianOffset converts a meter spread into lat/lng offset and adds noise.
// 1 degree lat ≈ 111,000m; lng degree shrinks with cos(lat).
func (g *Generator) gaussianOffset(lat, lng, spreadMeters float64) (float64, float64) {
	latDeg := spreadMeters / 111000.0
	lngDeg := spreadMeters / (111000.0 * math.Cos(lat*math.Pi/180.0))

	dLat := g.rng.NormFloat64() * latDeg
	dLng := g.rng.NormFloat64() * lngDeg

	return lat + dLat, lng + dLng
}
