package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type Worker struct {
	logger     zerolog.Logger
	publisher  *messaging.Publisher
	classifier *detect.Classifier
}

func NewWorker(logger zerolog.Logger, publisher *messaging.Publisher, classifier *detect.Classifier) *Worker {
	return &Worker{
		logger:     logger,
		publisher:  publisher,
		classifier: classifier,
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
		if termErr := msg.Term(); termErr != nil {
			log.Error().Err(fmt.Errorf("original=%v term=%w", err, termErr)).Msg("failed to term message")
		}
		return err
	}

	log = log.With().Str("domain_key", scan.DomainKey).Logger()

	findings, err := w.classifier.Classify(scan)
	if err != nil {
		log.Err(err).Msg("classify error")
		if nakErr := msg.Nak(); nakErr != nil {
			log.Error().Err(fmt.Errorf("original=%v nak=%w", err, nakErr)).Msg("failed to nak message")
		}
		return err
	}

	if len(findings) == 0 {
		log.Debug().Msg("classification produced no findings")
	}

	for _, finding := range findings {
		err = w.publisher.Publish(ctx, finding)
		if err != nil {
			log.Err(err).Msg("publish error")
			if nakErr := msg.Nak(); nakErr != nil {
				log.Error().Err(fmt.Errorf("original=%v nak=%w", err, nakErr)).Msg("failed to nak message")
			}
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
