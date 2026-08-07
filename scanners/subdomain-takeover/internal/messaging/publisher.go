package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

var marshalFinding = json.Marshal
var nowUTC = func() time.Time { return time.Now().UTC() }

type Publisher struct {
	logger  zerolog.Logger
	js      publishClient
	subject string
}

type publishClient interface {
	Publish(ctx context.Context, subj string, data []byte, opts ...jetstream.PublishOpt) (*jetstream.PubAck, error)
}

func NewPublisher(logger zerolog.Logger, js publishClient, subject string) *Publisher {
	return &Publisher{logger: logger, js: js, subject: subject}
}

func (p *Publisher) Publish(ctx context.Context, finding model.Finding) error {
	event, err := model.NewFindingEventFromFinding(finding, nowUTC())
	if err != nil {
		p.logger.Error().
			Err(err).
			Str("domain", finding.Domain).
			Str("domain_key", finding.DomainKey).
			Str("record_type", string(finding.RecordType)).
			Msg("finding event mapping failed")
		return err
	}

	payload, err := marshalFinding(event)
	if err != nil {
		p.logger.Error().
			Err(err).
			Str("domain", finding.Domain).
			Str("domain_key", finding.DomainKey).
			Str("record_type", string(finding.RecordType)).
			Str("reason_code", finding.ReasonCode).
			Str("confidence", finding.Confidence).
			Str("finding_type", event.FindingType).
			Msg("marshal finding event failed")
		return err
	}

	if _, err := p.js.Publish(ctx, p.subject, payload); err != nil {
		p.logger.Error().
			Err(err).
			Str("domain", finding.Domain).
			Str("domain_key", finding.DomainKey).
			Str("record_type", string(finding.RecordType)).
			Str("reason_code", finding.ReasonCode).
			Str("confidence", finding.Confidence).
			Str("finding_type", event.FindingType).
			Str("subject", p.subject).
			Msg("publish failed")
		return fmt.Errorf("publish finding event: %w", err)
	}

	p.logger.Debug().
		Str("domain", finding.Domain).
		Str("domain_key", finding.DomainKey).
		Str("record_type", string(finding.RecordType)).
		Str("reason_code", finding.ReasonCode).
		Str("confidence", finding.Confidence).
		Str("finding_type", event.FindingType).
		Str("subject", p.subject).
		Msg("finding event published")
	return nil
}
