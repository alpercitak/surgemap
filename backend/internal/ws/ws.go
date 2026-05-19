package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"

	"surgemap/internal/types"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in dev — tighten for production
		return true
	},
}

type client struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients map[*client]struct{}
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*client]struct{}),
	}
}

// Broadcast fans out a cell state snapshot to all connected clients.
// JSON marshaling happens once here, not per client.
func (h *Hub) Broadcast(states []types.CellState) {
	if len(states) == 0 {
		return
	}

	data, err := json.Marshal(states)
	if err != nil {
		log.Printf("ws: marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients {
		select {
		case c.send <- data:
		default:
			// Client send buffer full — drop frame, don't block broadcast
			log.Printf("ws: client buffer full, dropping frame")
		}
	}
}

// ServeWS upgrades an HTTP connection to WebSocket and registers the client
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws: upgrade error: %v", err)
		return
	}

	c := &client{
		conn: conn,
		send: make(chan []byte, 8), // buffer 8 frames
	}

	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()

	log.Printf("ws: client connected (%d total)", h.clientCount())

	go c.writePump(h)
	c.readPump(h) // blocks until client disconnects
}

// readPump consumes incoming messages (ping/pong, future viewport messages)
// and triggers cleanup on disconnect
func (c *client) readPump(h *Hub) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, c)
		h.mu.Unlock()
		c.conn.Close()
		log.Printf("ws: client disconnected (%d total)", h.clientCount())
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		// Phase 2+: parse viewport bounds messages here to filter cell output
	}
}

// writePump drains the send channel and writes to the WebSocket connection
func (c *client) writePump(h *Hub) {
	for data := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("ws: write error: %v", err)
			return
		}
	}
}

func (h *Hub) clientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
