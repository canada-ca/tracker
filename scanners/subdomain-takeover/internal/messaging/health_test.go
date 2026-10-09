package messaging

import (
	"testing"

	"github.com/nats-io/nats.go"
)

func TestCheckConnection(t *testing.T) {
	t.Run("nil connection", func(t *testing.T) {
		err := CheckConnection(nil)
		if err == nil || err.Error() != "nats connection is nil" {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	// The "closed" branch (IsClosed()==true) requires a real connect/close
	// cycle against a NATS server -- nats.Conn has no exported way to reach
	// that state otherwise. Covered by an integration test, not here.

	t.Run("not yet connected", func(t *testing.T) {
		err := CheckConnection(&nats.Conn{})
		if err == nil || err.Error() != "nats not connected (status=DISCONNECTED)" {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
