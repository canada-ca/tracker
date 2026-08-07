package main

import (
	"context"
	"os/signal"
	"syscall"
	"time"

	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/messaging"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog/log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}
	config.SetupLogger(cfg)

	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to NATS")
	}
	defer nc.Close()

	js, err := nc.JetStream()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create JetStream context")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	opts := []nats.SubOpt{
		nats.BindStream(cfg.NATSStream),
		nats.Durable(cfg.NATSDurable),
		nats.ManualAck(),
		nats.AckWait(cfg.NATSAckWait),
		nats.MaxDeliver(cfg.NATSMaxDeliver),
		nats.MaxAckPending(cfg.NATSMaxPending),
	}

	client, err := database.CreateDBClient(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create ArangoDB client")
	}

	dbCtx, cancelDB := context.WithTimeout(ctx, 10*time.Second)
	defer cancelDB()

	db, err := client.GetDatabase(dbCtx, cfg.DBName, nil)
	if err != nil {
		log.Fatal().Err(err).Msg("get database failed")
	}

	handler := func(msg *nats.Msg) {
		eventCtx, cancelEvent := context.WithTimeout(ctx, 5*time.Second)
		defer cancelEvent()

		action := messaging.HandleEvent(eventCtx, db, msg.Data)
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

	var sub *nats.Subscription
	if cfg.NATSQueueGroup != "" {
		sub, err = js.QueueSubscribe(cfg.NATSSubject, cfg.NATSQueueGroup, handler, opts...)
	} else {
		sub, err = js.Subscribe(cfg.NATSSubject, handler, opts...)
	}
	if err != nil {
		log.Fatal().Err(err).Msg("failed to subscribe")
	}
	defer sub.Drain()

	log.Info().
		Str("stream", cfg.NATSStream).
		Str("subject", cfg.NATSSubject).
		Str("durable", cfg.NATSDurable).
		Str("queueGroup", cfg.NATSQueueGroup).
		Msg("findings processor started")

	<-ctx.Done()
	log.Info().Msg("shutdown signal received")
}
