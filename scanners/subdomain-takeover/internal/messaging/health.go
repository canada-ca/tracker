package messaging

import (
	"errors"
	"fmt"

	"github.com/nats-io/nats.go"
)

type natsConnectionState interface {
	IsClosed() bool
	IsConnected() bool
	Status() nats.Status
}

func CheckConnection(nc *nats.Conn) error {
	if nc == nil {
		return errors.New("nats connection is nil")
	}

	return checkConnectionState(nc)
}

func checkConnectionState(nc natsConnectionState) error {
	if nc.IsClosed() {
		return errors.New("nats connection is closed")
	}
	if !nc.IsConnected() {
		return fmt.Errorf("nats not connected (status=%s)", nc.Status().String())
	}
	return nil
}
