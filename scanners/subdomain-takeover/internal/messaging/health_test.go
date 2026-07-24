package messaging

import (
	"testing"

	"github.com/nats-io/nats.go"
)

type fakeConnState struct {
	closed    bool
	connected bool
	status    nats.Status
}

func (f fakeConnState) IsClosed() bool    { return f.closed }
func (f fakeConnState) IsConnected() bool { return f.connected }
func (f fakeConnState) Status() nats.Status {
	return f.status
}

func TestCheckConnection(t *testing.T) {
	err := CheckConnection(nil)
	if err == nil {
		t.Fatal("expected error for nil connection")
	}
	if err.Error() != "nats connection is nil" {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCheckConnectionState(t *testing.T) {
	t.Run("closed connection returns closed error", func(t *testing.T) {
		err := checkConnectionState(fakeConnState{closed: true})
		if err == nil || err.Error() != "nats connection is closed" {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("not connected returns status error", func(t *testing.T) {
		err := checkConnectionState(fakeConnState{connected: false, status: nats.DISCONNECTED})
		if err == nil || err.Error() != "nats not connected (status=DISCONNECTED)" {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("connected state returns nil", func(t *testing.T) {
		err := checkConnectionState(fakeConnState{connected: true, status: nats.CONNECTED})
		if err != nil {
			t.Fatalf("expected nil error, got: %v", err)
		}
	})
}
