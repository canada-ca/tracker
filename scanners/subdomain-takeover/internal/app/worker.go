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

type FindingPublisher interface {
	Publish(ctx context.Context, finding model.Finding) error
}

type ScanClassifier interface {
	Classify(input model.Input) ([]model.Finding, error)
}

type Worker struct {
	logger     zerolog.Logger
	publisher  FindingPublisher
	classifier ScanClassifier
}

func NewWorker(logger zerolog.Logger, publisher FindingPublisher, classifier ScanClassifier) *Worker {
	return &Worker{logger: logger, publisher: publisher, classifier: classifier}
}

func (w *Worker) Handle(ctx context.Context, msg jetstream.Msg) error {
	log := w.logger.With().Str("component", "worker").Logger()

	scan, err := decodeScan(msg.Data())
	if err != nil {
		log.Err(err).Msg("decode error")
		w.term(msg, log, err)
		return err
	}

	findings, err := w.classifier.Classify(scan)
	if err != nil {
		log.Err(err).Msg("classify error")
		w.nak(msg, log, err)
		return err
	}

	for _, finding := range findings {
		err = w.publisher.Publish(ctx, finding)
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
