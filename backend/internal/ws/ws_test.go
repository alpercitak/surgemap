package ws

import (
	"net/http"
	"net/http/httptest"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"

	"surgemap/internal/types"
)

func TestNoGoroutineLeakOnDisconnect(t *testing.T) {
	hub := NewHub()
	srv := httptest.NewServer(http.HandlerFunc(hub.ServeWS))
	defer srv.Close()
	url := "ws" + strings.TrimPrefix(srv.URL, "http")

	connectAndRead := func() {
		c, _, err := websocket.DefaultDialer.Dial(url, nil)
		if err != nil {
			t.Fatal(err)
		}
		defer c.Close()
		// Wait for registration before broadcasting
		for hub.clientCount() == 0 {
			time.Sleep(time.Millisecond)
		}
		hub.Broadcast([]types.CellState{{Index: "x"}})
		if _, _, err := c.ReadMessage(); err != nil {
			t.Fatal(err)
		}
	}

	connectAndRead() // warm up server goroutines
	time.Sleep(200 * time.Millisecond)
	base := runtime.NumGoroutine()

	for range 50 {
		connectAndRead()
		for hub.clientCount() != 0 {
			time.Sleep(time.Millisecond)
		}
	}
	time.Sleep(200 * time.Millisecond)

	if after := runtime.NumGoroutine(); after > base+5 {
		t.Fatalf("goroutine leak: base=%d after=%d", base, after)
	}
	// Must not panic on channels of disconnected clients
	hub.Broadcast(nil)
}
