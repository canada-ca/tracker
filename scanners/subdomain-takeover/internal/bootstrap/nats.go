package bootstrap

import (
	"context"
	"fmt"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type RuntimeDeps struct {
	NC     *nats.Conn
	Iter   jetstream.MessagesContext
	JS     jetstream.JetStream
	Closed <-chan struct{}
}

func NewRuntimeDeps(ctx context.Context, cfg *config.Config, logger zerolog.Logger) (*RuntimeDeps, error) {
	logger.Debug().Str("nats_url", cfg.NATSURL).Msg("connecting to nats")
	closed := make(chan struct{})
	nc, err := nats.Connect(
		cfg.NATSURL,
		nats.Name("subdomain-takeover"),
		nats.MaxReconnects(-1),
		nats.ReconnectHandler(func(c *nats.Conn) {
			logger.Info().Str("url", c.ConnectedUrl()).Msg("nats reconnected")
		}),
		nats.DisconnectErrHandler(func(_ *nats.Conn, err error) {
			logger.Warn().Err(err).Msg("nats disconnected")
		}),
		nats.ClosedHandler(func(_ *nats.Conn) {
			logger.Info().Msg("nats connection closed")
			close(closed)
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("connect to nats at %s: %w", cfg.NATSURL, err)
	}

	logger.Debug().Msg("creating jetstream client")
	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("create jetstream client: %w", err)
	}

	logger.Debug().Str("stream", cfg.NATSStream).Msg("loading existing stream")
	stream, err := js.Stream(ctx, cfg.NATSStream)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("stream %q not found or inaccessible: %w", cfg.NATSStream, err)
	}

	logger.Debug().Str("durable", cfg.DurableName).Msg("creating or updating consumer")
	cons, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:       cfg.DurableName,
		AckPolicy:     jetstream.AckExplicitPolicy,
		FilterSubject: cfg.SubjectIn,
	})
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("create or update consumer %q: %w", cfg.DurableName, err)
	}

	logger.Debug().Msg("creating pull message iterator")
	iter, err := cons.Messages(jetstream.PullMaxMessages(1), jetstream.PullExpiry(1*time.Second))
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("create message iterator: %w", err)
	}

	return &RuntimeDeps{
		NC:     nc,
		Iter:   iter,
		JS:     js,
		Closed: closed,
	}, nil
}
