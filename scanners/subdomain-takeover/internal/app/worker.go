package app

import (
	"bytes"
	"context"
	"encoding/json"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type Worker struct {
	logger zerolog.Logger
	pub    messaging.Publisher
}

func NewWorker(logger zerolog.Logger, pub messaging.Publisher) *Worker {
	return &Worker{logger: logger, pub: pub}
}

func (w *Worker) Handle(ctx context.Context, msg jetstream.Msg) error {
	log := w.logger.With().Str("component", "worker").Logger()
	// decode -> classify -> publish -> ack
	scan, err := decodeScan(msg.Data())
	if err != nil {
		log.Err(err).Msg("Decoding error")
	}
	// log.Info().Msg(scan.Domain)

	findings, err := detect.Classify(scan)
	if err != nil {
		log.Err(err).Msg("classify error")
		return err
	}

	for _, finding := range findings {
		err = w.pub.Publish(ctx, finding)
		if err != nil {
			log.Err(err).Msg("publish error")
			return err
		}
	}

	if err := msg.Ack(); err != nil {
		log.Err(err).Msg("Ack error")
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
