package types

import "time"

// EventType distinguishes demand (ride/food requests) from supply (driver/courier positions)
type EventType string

const (
	EventDemand EventType = "demand" // a request entered the system
	EventSupply EventType = "supply" // an available driver/courier pinged in
)

// Event is the core unit flowing from generator → aggregator
type Event struct {
	Type EventType
	Lat  float64
	Lng  float64
	Time time.Time
}

// CellState is the computed state for one H3 cell, broadcast to frontend
type CellState struct {
	Index    string  `json:"index"`    // H3 cell index (hex string)
	Lat      float64 `json:"lat"`      // cell center latitude
	Lng      float64 `json:"lng"`      // cell center longitude
	Demand   int     `json:"demand"`   // events in window
	Supply   int     `json:"supply"`   // events in window
	Ratio    float64 `json:"ratio"`    // demand/supply — >1.0 means surge
	Modifier float64 `json:"modifier"` // surge multiplier (1.0x – 3.0x)
}
