package runner

import (
	"context"
	"fmt"
	"syscall"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog/log"
)

var (
	parseEventFn    = model.ParseEvent
	validateEventFn = model.Validate
	upsertFindingFn = database.UpsertFinding
)

func Run(cfg config.Config) error {
	return runWithDeps(cfg, defaultDependencies())
}

func runWithDeps(cfg config.Config, deps dependencies) error {
	nc, err := deps.connectNATS(cfg.NATSURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}
	defer nc.Close()

	js, err := nc.JetStream()
	if err != nil {
		return fmt.Errorf("failed to create JetStream context: %w", err)
	}

	ctx, stop := deps.notifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	opts := []nats.SubOpt{
		nats.BindStream(cfg.NATSStream),
		nats.Durable(cfg.NATSDurable),
		nats.ManualAck(),
		nats.AckWait(cfg.NATSAckWait),
		nats.MaxDeliver(cfg.NATSMaxDeliver),
		nats.MaxAckPending(cfg.NATSMaxPending),
	}

	client, err := deps.createDBClient(cfg)
	if err != nil {
		return fmt.Errorf("failed to create ArangoDB client: %w", err)
	}

	dbCtx, cancelDB := context.WithTimeout(ctx, 10*time.Second)
	defer cancelDB()

	db, err := deps.getDatabase(dbCtx, client, cfg.DBName)
	if err != nil {
		return fmt.Errorf("get database failed: %w", err)
	}

	handler := func(msg *nats.Msg) {
		eventCtx, cancelEvent := context.WithTimeout(ctx, 5*time.Second)
		defer cancelEvent()

		switch deps.handleEvent(eventCtx, db, msg.Data) {
		case "ack":
			_ = msg.Ack()
		case "nak":
			_ = msg.Nak()
		case "term":
			_ = msg.Term()
		default:
			_ = msg.Nak()
		}
	}

	var sub *nats.Subscription
	if cfg.NATSQueueGroup != "" {
		sub, err = js.QueueSubscribe(cfg.NATSSubject, cfg.NATSQueueGroup, handler, opts...)
	} else {
		sub, err = js.Subscribe(cfg.NATSSubject, handler, opts...)
	}
	if err != nil {
		return fmt.Errorf("failed to subscribe: %w", err)
	}
	defer deps.drainSubscription(sub)

	log.Info().
		Str("stream", cfg.NATSStream).
		Str("subject", cfg.NATSSubject).
		Str("durable", cfg.NATSDurable).
		Str("queueGroup", cfg.NATSQueueGroup).
		Msg("findings processor started")

	<-ctx.Done()
	log.Info().Msg("shutdown signal received")

	return nil
}

func HandleEvent(ctx context.Context, db arangodb.Database, payload []byte) string {
	evt, err := parseEventFn(payload)
	if err != nil {
		log.Warn().Err(err).Msg("invalid json payload")
		return "term"
	}

	if err := validateEventFn(evt); err != nil {
		log.Warn().Err(err).Msg("invalid event payload")
		return "term"
	}

	err = upsertFindingFn(ctx, db, evt)
	if err != nil {
		log.Warn().Err(err).Msg("failed to upsert finding")
		return "nak"
	}

	log.Info().
		Str("source", evt.Source).
		Str("findingType", evt.FindingType).
		Str("domainKey", evt.DomainKey).
		Str("subject", evt.Subject).
		Msg("received finding event")
	return "ack"
}
