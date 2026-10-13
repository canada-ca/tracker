package runner

import (
	"context"
	"fmt"
	"os/signal"
	"syscall"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog/log"
)

func Run(cfg config.Config) error {
	nc, err := nats.Connect(
		cfg.NATSURL,
		nats.MaxReconnects(-1),
		nats.ReconnectHandler(func(c *nats.Conn) {
			log.Info().Str("url", c.ConnectedUrl()).Msg("nats reconnected")
		}),
		nats.DisconnectErrHandler(func(c *nats.Conn, err error) {
			log.Warn().Err(err).Msg("nats disconnected")
		}),
		nats.ClosedHandler(func(c *nats.Conn) {
			log.Info().Msg("nats connection closed")
		}),
	)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}
	defer nc.Close()

	js, err := jetstream.New(nc)
	if err != nil {
		return fmt.Errorf("failed to create JetStream context: %w", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	client, err := database.CreateDBClient(cfg)
	if err != nil {
		return fmt.Errorf("failed to create ArangoDB client: %w", err)
	}

	dbCtx, cancelDB := context.WithTimeout(ctx, 10*time.Second)
	defer cancelDB()

	db, err := client.GetDatabase(dbCtx, cfg.DBName, nil)
	if err != nil {
		return fmt.Errorf("get database failed: %w", err)
	}

	cons, err := js.CreateOrUpdateConsumer(ctx, cfg.NATSStream, jetstream.ConsumerConfig{
		Durable:       cfg.NATSDurable,
		AckPolicy:     jetstream.AckExplicitPolicy,
		AckWait:       cfg.NATSAckWait,
		MaxDeliver:    cfg.NATSMaxDeliver,
		MaxAckPending: cfg.NATSMaxPending,
		FilterSubject: cfg.NATSSubject,
	})
	if err != nil {
		return fmt.Errorf("create/update consumer failed: %w", err)
	}

	handler := func(msg jetstream.Msg) {
		upsertCtx, cancelUpsert := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancelUpsert()

		var ackErr error
		switch HandleEvent(upsertCtx, db, msg.Data()) {
		case "ack":
			ackErr = msg.Ack()
		case "nak":
			ackErr = msg.Nak()
		case "term":
			ackErr = msg.Term()
		default:
			ackErr = msg.Nak()
		}
		if ackErr != nil {
			log.Warn().Err(ackErr).Msg("failed to ack/nak/term message")
		}
	}

	consumeCtx, err := cons.Consume(handler, jetstream.ConsumeErrHandler(func(_ jetstream.ConsumeContext, err error) {
		log.Warn().Err(err).Msg("consume error")
	}))
	if err != nil {
		return fmt.Errorf("failed to create consumer context: %w", err)
	}

	log.Info().
		Str("stream", cfg.NATSStream).
		Str("subject", cfg.NATSSubject).
		Str("durable", cfg.NATSDurable).
		Msg("findings processor started")

	<-ctx.Done()
	log.Info().Msg("shutdown signal received, draining consumer")

	consumeCtx.Drain()
	select {
	case <-consumeCtx.Closed():
		log.Info().Msg("consumer drained")
	case <-time.After(15 * time.Second):
		log.Warn().Msg("timed out waiting for consumer to drain")
	}

	return nil
}

func HandleEvent(ctx context.Context, db arangodb.Database, payload []byte) string {
	evt, err := model.ParseEvent(payload)
	if err != nil {
		log.Warn().Err(err).Msg("invalid json payload")
		return "term"
	}

	if err := model.Validate(evt); err != nil {
		log.Warn().Err(err).Msg("invalid event payload")
		return "term"
	}

	if err := database.UpsertFinding(ctx, db, evt); err != nil {
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
