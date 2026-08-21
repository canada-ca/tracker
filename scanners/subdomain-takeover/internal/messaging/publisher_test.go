package messaging

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakePublishClient struct {
	err       error
	ack       *jetstream.PubAck
	called    int
	lastSubj  string
	lastBytes []byte
}

func (f *fakePublishClient) Publish(_ context.Context, subj string, data []byte, _ ...jetstream.PublishOpt) (*jetstream.PubAck, error) {
	f.called++
	f.lastSubj = subj
	f.lastBytes = append([]byte(nil), data...)
	if f.err != nil {
		return nil, f.err
	}
	if f.ack != nil {
		return f.ack, nil
	}
	return &jetstream.PubAck{}, nil
}

func TestNewPublisher(t *testing.T) {
	client := &fakePublishClient{}
	p := NewPublisher(zerolog.Nop(), client, "scans.findings.subdomain-takeover")
	if p == nil {
		t.Fatal("expected publisher instance")
	}
	if p.subject != "scans.findings.subdomain-takeover" {
		t.Fatalf("unexpected subject: %q", p.subject)
	}
}

func TestPublisherPublish(t *testing.T) {
	origMarshal := marshalFinding
	origNowUTC := nowUTC
	t.Cleanup(func() { marshalFinding = origMarshal })
	t.Cleanup(func() { nowUTC = origNowUTC })

	fixedNow := time.Date(2026, 8, 7, 12, 34, 56, 0, time.UTC)
	nowUTC = func() time.Time { return fixedNow }

	nsFinding := model.Finding{
		Domain:     "a.example.ca",
		DomainKey:  "123",
		RecordType: model.RecordTypeNS,
		Target:     "ns1.risky-dns.net",
		Provider:   "RiskyDNS",
		Confidence: "probable",
		ReasonCode: "NS_PARTIAL_LAME_PROVIDER_VULNERABLE",
	}
	cnameFinding := model.Finding{
		Domain:     "b.example.ca",
		DomainKey:  "456",
		RecordType: model.RecordTypeCNAME,
		Target:     "old-app.azurewebsites.net",
		Provider:   "azure",
		Confidence: "probable",
		ReasonCode: "CNAME_DANGLING_NXDOMAIN",
	}

	t.Run("publishes ns finding event payload", func(t *testing.T) {
		client := &fakePublishClient{}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.subdomain-takeover"}

		err := p.Publish(context.Background(), nsFinding)
		if err != nil {
			t.Fatalf("unexpected publish error: %v", err)
		}
		if client.called != 1 {
			t.Fatalf("expected one publish call, got %d", client.called)
		}
		if client.lastSubj != "scans.findings.subdomain-takeover" {
			t.Fatalf("unexpected subject: %q", client.lastSubj)
		}

		var got model.FindingEvent
		if err := json.Unmarshal(client.lastBytes, &got); err != nil {
			t.Fatalf("payload not valid json: %v", err)
		}

		if got.Source != "subdomain-takeover" {
			t.Fatalf("unexpected source: %q", got.Source)
		}
		if got.FindingType != "subdomain-takeover-ns" {
			t.Fatalf("unexpected findingType: %q", got.FindingType)
		}
		if got.DomainKey != nsFinding.DomainKey {
			t.Fatalf("unexpected domainKey: %q", got.DomainKey)
		}
		if got.Subject != nsFinding.Domain {
			t.Fatalf("unexpected subject: %q", got.Subject)
		}
		if got.ObservedAt != fixedNow.Format(time.RFC3339) {
			t.Fatalf("unexpected observedAt: %q", got.ObservedAt)
		}
		if got.Evidence["target"] != nsFinding.Target {
			t.Fatalf("unexpected evidence target: %v", got.Evidence["target"])
		}
		if got.Evidence["recordType"] != string(nsFinding.RecordType) {
			t.Fatalf("unexpected evidence recordType: %v", got.Evidence["recordType"])
		}
		if got.Attributes["provider"] != nsFinding.Provider {
			t.Fatalf("unexpected attributes provider: %v", got.Attributes["provider"])
		}
		if got.Attributes["lameType"] != nsFinding.LameType {
			t.Fatalf("unexpected attributes lameType: %v", got.Attributes["lameType"])
		}
	})

	t.Run("maps cname record to cname findingType", func(t *testing.T) {
		client := &fakePublishClient{}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.subdomain-takeover"}

		err := p.Publish(context.Background(), cnameFinding)
		if err != nil {
			t.Fatalf("unexpected publish error: %v", err)
		}

		var got model.FindingEvent
		if err := json.Unmarshal(client.lastBytes, &got); err != nil {
			t.Fatalf("payload not valid json: %v", err)
		}
		if got.FindingType != "subdomain-takeover-cname" {
			t.Fatalf("unexpected findingType: %q", got.FindingType)
		}
	})

	t.Run("returns publish client error", func(t *testing.T) {
		client := &fakePublishClient{err: errors.New("publish failed")}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.subdomain-takeover"}

		err := p.Publish(context.Background(), nsFinding)
		if err == nil {
			t.Fatal("expected publish error")
		}
		if client.called != 1 {
			t.Fatalf("expected one publish call, got %d", client.called)
		}
	})

	t.Run("returns marshal error and does not publish", func(t *testing.T) {
		marshalFinding = func(v any) ([]byte, error) {
			return nil, errors.New("marshal failed")
		}

		client := &fakePublishClient{}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.subdomain-takeover"}

		err := p.Publish(context.Background(), nsFinding)
		if err == nil {
			t.Fatal("expected marshal error")
		}
		if client.called != 0 {
			t.Fatalf("expected no publish call, got %d", client.called)
		}
	})

	t.Run("returns mapping error for unsupported record type", func(t *testing.T) {
		client := &fakePublishClient{}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.subdomain-takeover"}

		badFinding := nsFinding
		badFinding.RecordType = model.RecordType("TXT")

		err := p.Publish(context.Background(), badFinding)
		if err == nil {
			t.Fatal("expected mapping error")
		}
		if client.called != 0 {
			t.Fatalf("expected no publish call, got %d", client.called)
		}
	})
}
