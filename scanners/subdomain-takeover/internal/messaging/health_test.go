package messaging

import (
	"testing"

	"github.com/nats-io/nats.go"
)

func TestCheckConnection(t *testing.T) {
	tests := []struct {
		name    string
		nc      *nats.Conn
		wantErr string
	}{
		{name: "nil connection", nc: nil, wantErr: "nats connection is nil"},
		// A zero-value Conn reports DISCONNECTED -- the same status a live
		// connection has between reconnect attempts -- and must not be fatal.
		{name: "disconnected connection", nc: &nats.Conn{}},
	}

	// The closed, connected, and reconnecting cases need a real server; see
	// health_integration_test.go.

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckConnection(tt.nc)
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				return
			}
			if err == nil || err.Error() != tt.wantErr {
				t.Fatalf("expected error %q, got %v", tt.wantErr, err)
			}
		})
	}
}
