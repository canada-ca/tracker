package messaging

import (
	"errors"

	"github.com/nats-io/nats.go"
)

func CheckConnection(nc *nats.Conn) error {
	if nc == nil {
		return errors.New("nats connection is nil")
	}
	if nc.IsClosed() {
		return errors.New("nats connection is closed")
	}
	return nil
}
