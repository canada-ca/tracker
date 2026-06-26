package main

import (
	"context"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/app"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

func main() {
	cfg := config.InitConfig()
	logger := cfg.Logger

	ctx, cancel := context.WithCancel(context.Background())

	nc, _ := nats.Connect(cfg.NatsUrl)
	js, _ := jetstream.New(nc)
	logger.Info().Msgf("Connected to NATS at %s...", nc.ConnectedUrl())

	s, _ := js.CreateStream(ctx, jetstream.StreamConfig{
		Name:     cfg.NatsStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	})

	cons, _ := s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:   cfg.DurableName,
		AckPolicy: jetstream.AckExplicitPolicy,
	})

	iter, err := cons.Messages(jetstream.PullMaxMessages(1), jetstream.PullExpiry(1*time.Second))
	if err != nil {
		logger.Err(err).Msg("Error creating message iterator")
	}

	app.Run(
		app.RunnerDeps{
			Logger:      logger,
			WorkerCount: cfg.WorkerCount,
			Iter:        iter,
			Cancel:      cancel,
			Context:     ctx,
		})

	logger.Info().Msgf("Disconnecting from NATS at %s", nc.ConnectedUrl())
	nc.Flush()
	nc.Close()
}
