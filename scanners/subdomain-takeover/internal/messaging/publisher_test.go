package messaging

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakePublishClient struct {
	err       error
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
	return &jetstream.PubAck{}, nil
}

func (f *fakePublishClient) PublishMsg(context.Context, *nats.Msg, ...jetstream.PublishOpt) (*jetstream.PubAck, error) {
	return nil, nil
}
func (f *fakePublishClient) PublishAsync(string, []byte, ...jetstream.PublishOpt) (jetstream.PubAckFuture, error) {
	return nil, nil
}
func (f *fakePublishClient) PublishMsgAsync(*nats.Msg, ...jetstream.PublishOpt) (jetstream.PubAckFuture, error) {
	return nil, nil
}
func (f *fakePublishClient) PublishAsyncPending() int              { return 0 }
func (f *fakePublishClient) PublishAsyncComplete() <-chan struct{} { return nil }
func (f *fakePublishClient) CleanupPublisher()                     {}

func TestPublisherPublish(t *testing.T) {
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

	t.Run("publishes expected finding event payload", func(t *testing.T) {
		tests := []struct {
			name            string
			finding         model.Finding
			wantFindingType string
		}{
			{name: "ns record", finding: nsFinding, wantFindingType: "subdomain-takeover-ns"},
			{name: "cname record", finding: cnameFinding, wantFindingType: "subdomain-takeover-cname"},
		}

		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				client := &fakePublishClient{}
				p := NewPublisher(zerolog.Nop(), client, "scans.findings.subdomain-takeover")

				if err := p.Publish(context.Background(), tc.finding); err != nil {
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
				if got.FindingType != tc.wantFindingType {
					t.Fatalf("unexpected findingType: %q", got.FindingType)
				}
				if got.DomainKey != tc.finding.DomainKey {
					t.Fatalf("unexpected domainKey: %q", got.DomainKey)
				}
				if got.Subject != tc.finding.Domain {
					t.Fatalf("unexpected subject: %q", got.Subject)
				}
				if got.Evidence["target"] != tc.finding.Target {
					t.Fatalf("unexpected evidence target: %v", got.Evidence["target"])
				}
				if got.Attributes["provider"] != tc.finding.Provider {
					t.Fatalf("unexpected attributes provider: %v", got.Attributes["provider"])
				}
			})
		}
	})

	t.Run("propagates publish client error", func(t *testing.T) {
		client := &fakePublishClient{err: errors.New("publish failed")}
		p := NewPublisher(zerolog.Nop(), client, "scans.findings.subdomain-takeover")

		if err := p.Publish(context.Background(), nsFinding); err == nil {
			t.Fatal("expected publish error")
		}
		if client.called != 1 {
			t.Fatalf("expected one publish call, got %d", client.called)
		}
	})

	t.Run("returns mapping error for unsupported record type without publishing", func(t *testing.T) {
		badFinding := nsFinding
		badFinding.RecordType = model.RecordType("TXT")

		client := &fakePublishClient{}
		p := NewPublisher(zerolog.Nop(), client, "scans.findings.subdomain-takeover")

		err := p.Publish(context.Background(), badFinding)
		if !errors.Is(err, model.ErrUnsupportedRecordType) {
			t.Fatalf("expected ErrUnsupportedRecordType, got %v", err)
		}
		if client.called != 0 {
			t.Fatalf("expected no publish call, got %d", client.called)
		}
	})
}
