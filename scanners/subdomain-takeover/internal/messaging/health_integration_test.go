//go:build integration

package messaging

import (
	"testing"
	"time"

	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

func TestIntegration_CheckConnection(t *testing.T) {
	ns, err := server.NewServer(&server.Options{Host: "127.0.0.1", Port: -1, NoLog: true, NoSigs: true})
	if err != nil {
		t.Fatalf("failed to create test nats server: %v", err)
	}
	ns.Start()
	t.Cleanup(ns.Shutdown)
	if !ns.ReadyForConnections(5 * time.Second) {
		t.Fatal("test nats server did not become ready")
	}

	t.Run("connected", func(t *testing.T) {
		nc, err := nats.Connect(ns.ClientURL())
		if err != nil {
			t.Fatalf("connect: %v", err)
		}
		t.Cleanup(nc.Close)
		if err := CheckConnection(nc); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("closed", func(t *testing.T) {
		nc, err := nats.Connect(ns.ClientURL())
		if err != nil {
			t.Fatalf("connect: %v", err)
		}
		nc.Close()
		err = CheckConnection(nc)
		if err == nil || err.Error() != "nats connection is closed" {
			t.Fatalf("expected closed error, got %v", err)
		}
	})

	t.Run("reconnecting", func(t *testing.T) {
		// A dedicated server so shutting it down doesn't affect other subtests.
		rs, err := server.NewServer(&server.Options{Host: "127.0.0.1", Port: -1, NoLog: true, NoSigs: true})
		if err != nil {
			t.Fatalf("failed to create test nats server: %v", err)
		}
		rs.Start()
		if !rs.ReadyForConnections(5 * time.Second) {
			t.Fatal("test nats server did not become ready")
		}

		disconnected := make(chan struct{}, 1)
		nc, err := nats.Connect(rs.ClientURL(),
			nats.MaxReconnects(-1),
			nats.ReconnectWait(time.Hour),
			nats.DisconnectErrHandler(func(*nats.Conn, error) {
				select {
				case disconnected <- struct{}{}:
				default:
				}
			}),
		)
		if err != nil {
			t.Fatalf("connect: %v", err)
		}
		t.Cleanup(nc.Close)

		rs.Shutdown()
		select {
		case <-disconnected:
		case <-time.After(5 * time.Second):
			t.Fatal("client never observed disconnect")
		}

		if nc.IsConnected() {
			t.Fatal("expected connection to be down")
		}
		if err := CheckConnection(nc); err != nil {
			t.Fatalf("reconnecting connection should not be an error, got %v", err)
		}
	})
}
