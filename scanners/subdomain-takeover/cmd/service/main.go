package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/app"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

func checkErr(err error, log zerolog.Logger, msg string, exit bool) {
	if err != nil {
		log.Err(err).Msg(msg)
		if exit {
			os.Exit(1)
		}
	}

}

func main() {
	cfg := config.InitConfig()
	logger := cfg.Logger

	ctx, cancel := context.WithCancel(context.Background())

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	nc, err := nats.Connect(cfg.NatsUrl)
	checkErr(err, logger, "", true)

	js, err := jetstream.New(nc)
	checkErr(err, logger, "", true)

	logger.Info().Msgf("Connected to NATS at %s...", nc.ConnectedUrl())

	s, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     cfg.NatsStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	})
	checkErr(err, logger, "", true)

	cons, err := s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:   cfg.DurableName,
		AckPolicy: jetstream.AckExplicitPolicy,
	})
	checkErr(err, logger, "", true)

	iter, err := cons.Messages(jetstream.PullMaxMessages(1), jetstream.PullExpiry(1*time.Second))
	checkErr(err, logger, "", true)

	pub := messaging.NewPublisher(logger, js, cfg.SubjectOut)
	worker := app.NewWorker(logger, *pub)

	go func() {
		<-sig
		logger.Info().Msg("Shutdown requested...")
		cancel()
		iter.Stop()
	}()

	deps := app.RunnerDeps{
		Logger:      logger,
		WorkerCount: cfg.WorkerCount,
		Iter:        iter,
		Worker:      *worker,
		NC:          nc,
	}

	app.Run(ctx, deps)

	logger.Info().Msgf("Disconnecting from NATS at %s", nc.ConnectedUrl())
	nc.Flush()
	nc.Close()
}
