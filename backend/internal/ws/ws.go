package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"surgemap/internal/types"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = pongWait * 9 / 10
	maxMessageSize = 4096
)

// Zero-value CheckOrigin rejects cross-origin browser requests; the frontend
// reaches /ws same-origin through the Vite or nginx proxy.
var upgrader = websocket.Upgrader{}

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
// Empty snapshots are sent too, so clients clear expired cells.
func (h *Hub) Broadcast(states []types.CellState) {
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

	go c.writePump()
	c.readPump(h) // blocks until client disconnects
}

// readPump consumes incoming messages (ping/pong, future viewport messages)
// and triggers cleanup on disconnect
func (c *client) readPump(h *Hub) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, c)
		// Safe: Broadcast only sends while holding the read lock, and c is no longer registered
		close(c.send)
		h.mu.Unlock()
		c.conn.Close()
		log.Printf("ws: client disconnected (%d total)", h.clientCount())
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		// Phase 2+: parse viewport bounds messages here to filter cell output
	}
}

// writePump drains the send channel and pings the client; it exits when
// readPump closes c.send or a write fails (closing the conn unblocks readPump)
func (c *client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case data, ok := <-c.send:
			if !ok {
				return
			}
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("ws: write error: %v", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) clientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
