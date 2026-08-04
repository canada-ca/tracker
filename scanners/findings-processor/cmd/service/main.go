package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/kelseyhightower/envconfig"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type FindingEvent struct {
	SchemaVersion string         `json:"schemaVersion"`
	Source        string         `json:"source"`
	FindingType   string         `json:"findingType"`
	DomainKey     string         `json:"domainKey"`
	Subject       string         `json:"subject"`
	Confidence    string         `json:"confidence"`
	Severity      string         `json:"severity,omitempty"`
	ReasonCode    string         `json:"reasonCode,omitempty"`
	ObservedAt    string         `json:"observedAt"`
	Evidence      map[string]any `json:"evidence,omitempty"`
	Attributes    map[string]any `json:"attributes,omitempty"`
}

type config struct {
	NATSURL         string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	NATSStream      string        `envconfig:"NATS_STREAM" default:"SCANS"`
	NATSSubject     string        `envconfig:"NATS_SUBJECT" default:"scans.findings.*"`
	NATSDurable     string        `envconfig:"NATS_CONSUMER_DURABLE" default:"findings-processor"`
	NATSQueueGroup  string        `envconfig:"NATS_QUEUE_GROUP"`
	NATSAckWait     time.Duration `envconfig:"NATS_ACK_WAIT" default:"30s"`
	NATSMaxDeliver  int           `envconfig:"NATS_MAX_DELIVER" default:"10"`
	NATSMaxPending  int           `envconfig:"NATS_MAX_ACK_PENDING" default:"256"`
	LogLevel        string        `envconfig:"LOG_LEVEL" default:"info"`
	PrettyLogOutput bool          `envconfig:"LOG_PRETTY" default:"true"`
}

func main() {
	var cfg config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatal().Err(err).Msg("failed to parse config")
	}

	setupLogger(cfg)

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

	handler := func(msg *nats.Msg) {
		action := handleEvent(msg.Data)
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

func handleEvent(payload []byte) string {
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

func setupLogger(cfg config) {
	level, err := zerolog.ParseLevel(strings.ToLower(cfg.LogLevel))
	if err != nil {
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)
	if cfg.PrettyLogOutput {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	log.Info().Str("logLevel", zerolog.GlobalLevel().String()).Msg("logger initialized")
}
