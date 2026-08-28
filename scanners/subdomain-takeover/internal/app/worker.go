package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type Worker struct {
	logger          zerolog.Logger
	publishFinding  func(ctx context.Context, finding model.Finding) error
	classifyFinding func(input model.Input) ([]model.Finding, error)
}

func NewWorker(
	logger zerolog.Logger,
	publishFinding func(ctx context.Context, finding model.Finding) error,
	classifyFinding func(input model.Input) ([]model.Finding, error),
) *Worker {
	return &Worker{
		logger:          logger,
		publishFinding:  publishFinding,
		classifyFinding: classifyFinding,
	}
}

func (w *Worker) Handle(ctx context.Context, msg jetstream.Msg) error {
	log := w.logger.With().
		Str("component", "worker").
		Str("subject", msg.Subject()).
		Int("msg_size", len(msg.Data())).
		Logger()

	scan, err := decodeScan(msg.Data())
	if err != nil {
		log.Err(err).Msg("decode error")
		w.term(msg, log, err)
		return err
	}

	log = log.With().Str("domain_key", scan.DomainKey).Logger()

	findings, err := w.classifyFinding(scan)
	if err != nil {
		log.Err(err).Msg("classify error")
		w.nak(msg, log, err)
		return err
	}

	if len(findings) == 0 {
		log.Debug().Msg("classification produced no findings")
	}

	for _, finding := range findings {
		err = w.publishFinding(ctx, finding)
		if err != nil {
			log.Err(err).Msg("publish error")
			w.nak(msg, log, err)
			return err
		}
	}

	if err := msg.Ack(); err != nil {
		log.Err(err).Msg("ack error")
		return err
	}

	log.Debug().Int("findings_count", len(findings)).Msg("message acknowledged")

	return nil
}

func decodeScan(data []byte) (model.Input, error) {
	var scan model.Input
	trimmed := bytes.Trim(data, "\n")
	err := json.Unmarshal(trimmed, &scan)
	return scan, err
}

func (w *Worker) nak(msg jetstream.Msg, log zerolog.Logger, originalErr error) {
	if err := msg.Nak(); err != nil {
		log.Error().Err(fmt.Errorf("original=%v nak=%w", originalErr, err)).Msg("failed to nak message")
	}
}

func (w *Worker) term(msg jetstream.Msg, log zerolog.Logger, originalErr error) {
	if err := msg.Term(); err != nil {
		log.Error().Err(fmt.Errorf("original=%v term=%w", originalErr, err)).Msg("failed to term message")
	}
}
