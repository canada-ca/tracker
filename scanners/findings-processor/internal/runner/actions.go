package runner

import "github.com/nats-io/nats.go"

type ackableMessage interface {
	Ack(opts ...nats.AckOpt) error
	Nak(opts ...nats.AckOpt) error
	Term(opts ...nats.AckOpt) error
}

func applyAction(msg ackableMessage, action string) {
	switch action {
	case "ack":
		_ = msg.Ack()
	case "nak":
		_ = msg.Nak()
	case "term":
		_ = msg.Term()
	default:
		_ = msg.Term()
	}
}
