package messaging

import (
	"context"
	"encoding/json"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type Publisher struct {
	logger  zerolog.Logger
	js      jetstream.JetStream
	subject string
}

func NewPublisher(logger zerolog.Logger, js jetstream.JetStream, subject string) *Publisher {
	return &Publisher{logger: logger, js: js, subject: subject}
}

func (p *Publisher) Publish(ctx context.Context, finding model.Finding) error {
	payload, err := json.Marshal(finding)
	if err != nil {
		p.logger.Error().Err(err).Str("domain", finding.Domain).Msg("marshal finding failed")
		return err
	}

	if _, err := p.js.Publish(ctx, p.subject, payload); err != nil {
		p.logger.Error().Err(err).Str("domain", finding.Domain).Str("subject", p.subject).Msg("publish failed")
		return err
	}

	p.logger.Debug().Str("domain", finding.Domain).Str("subject", p.subject).Msg("finding published")
	return nil
}
