package bootstrap

import (
	"context"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type RuntimeDeps struct {
	NC   *nats.Conn
	Iter jetstream.MessagesContext
	JS   jetstream.JetStream
}

func NewRuntimeDeps(ctx context.Context, cfg *config.Config, logger zerolog.Logger) (*RuntimeDeps, error) {
	logger.Debug().Str("nats_url", cfg.NATSURL).Msg("connecting to nats")
	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		return nil, err
	}

	logger.Debug().Msg("creating jetstream client")
	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, err
	}

	logger.Debug().Str("stream", cfg.NATSStream).Strs("subjects", []string{cfg.SubjectIn, cfg.SubjectOut}).Msg("creating or updating stream")
	stream, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     cfg.NATSStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	})
	if err != nil {
		nc.Close()
		return nil, err
	}

	logger.Debug().Str("durable", cfg.DurableName).Msg("creating or updating consumer")
	cons, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:   cfg.DurableName,
		AckPolicy: jetstream.AckExplicitPolicy,
	})
	if err != nil {
		nc.Close()
		return nil, err
	}

	logger.Debug().Msg("creating pull message iterator")
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
