package messaging

import (
	"errors"
	"fmt"

	"github.com/nats-io/nats.go"
)

func CheckConnection(nc *nats.Conn) error {
	if nc == nil {
		return errors.New("nats connection is nil")
	}
	if nc.IsClosed() {
		return errors.New("nats connection is closed")
	}
	if !nc.IsConnected() {
		return fmt.Errorf("nats not connected (status=%s)", nc.Status().String())
	}
	return nil
}
