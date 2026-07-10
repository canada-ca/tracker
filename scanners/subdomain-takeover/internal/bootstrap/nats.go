package bootstrap

import (
	"context"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type RuntimeDeps struct {
	NC   *nats.Conn
	Iter jetstream.MessagesContext
	JS   jetstream.JetStream
}

func NewRuntimeDeps(ctx context.Context, cfg *config.Config) (*RuntimeDeps, error) {
	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		return nil, err
	}

	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, err
	}

	stream, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     cfg.NATSStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	})
	if err != nil {
		nc.Close()
		return nil, err
	}

	cons, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:   cfg.DurableName,
		AckPolicy: jetstream.AckExplicitPolicy,
	})
	if err != nil {
		nc.Close()
		return nil, err
	}

	iter, err := cons.Messages(jetstream.PullMaxMessages(1), jetstream.PullExpiry(1*time.Second))
	if err != nil {
		nc.Close()
		return nil, err
	}

	return &RuntimeDeps{
		NC:   nc,
		Iter: iter,
		JS:   js,
	}, nil
}
