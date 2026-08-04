package main

import (
	"context"
	"encoding/json"
	"errors"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	appconfig "github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg, err := appconfig.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse config")
	}

	appconfig.SetupLogger(cfg)

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

	client, err := database.CreateDBClient(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create arangodb client")
	}

	dbCtx, cancelDB := context.WithTimeout(ctx, 10*time.Second)
	defer cancelDB()

	db, err := client.GetDatabase(dbCtx, cfg.DBName, nil)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create arangodb client")
	}

	opts := []nats.SubOpt{
		nats.BindStream(cfg.NATSStream),
		nats.Durable(cfg.NATSDurable),
		nats.ManualAck(),
		nats.AckWait(cfg.NATSAckWait),
		nats.MaxDeliver(cfg.NATSMaxDeliver),
		nats.MaxAckPending(cfg.NATSMaxPending),
	}

	handler := func(msg *nats.Msg) {
		eventCtx, cancelEvent := context.WithTimeout(ctx, 5*time.Second)
		defer cancelEvent()

		action := handleEvent(eventCtx, db, msg.Data)
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

func handleEvent(ctx context.Context, db arangodb.Database, payload []byte) string {
	var evt FindingEvent
	if err := json.Unmarshal(payload, &evt); err != nil {
		log.Warn().Err(err).Msg("invalid json payload")
		return "term" // poison payload
	}

	if err := validate(evt); err != nil {
		log.Warn().Err(err).Msg("invalid event payload")
		return "term" // contract violation
	}

	// TODO: upsert to Arango here
	database.UpsertFinding(ctx, db)

	// if transient DB error -> return "nak"
	// if success -> return "ack"
	log.Info().
		Str("source", evt.Source).
		Str("findingType", evt.FindingType).
		Str("domainKey", evt.DomainKey).
		Str("subject", evt.Subject).
		Msg("received finding event")
	return "ack"
}

func validate(e FindingEvent) error {
	required := []string{
		e.SchemaVersion, e.Source, e.FindingType,
		e.DomainKey, e.Subject, e.Confidence, e.ObservedAt,
	}
	for _, v := range required {
		if strings.TrimSpace(v) == "" {
			return errors.New("missing required fields")
		}
	}
	if _, err := time.Parse(time.RFC3339, e.ObservedAt); err != nil {
		return errors.New("observedAt must be RFC3339")
	}
	return nil
}
