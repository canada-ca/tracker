package messaging

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

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
	p := NewPublisher(zerolog.Nop(), client, "scans.findings.upsert")
	if p == nil {
		t.Fatal("expected publisher instance")
	}
	if p.subject != "scans.findings.upsert" {
		t.Fatalf("unexpected subject: %q", p.subject)
	}
}

func TestPublisherPublish(t *testing.T) {
	finding := model.Finding{
		Domain:     "a.example.ca",
		DomainKey:  "123",
		RecordType: model.RecordTypeNS,
		Target:     "ns1.risky-dns.net",
		Provider:   "RiskyDNS",
		Confidence: "probable",
		ReasonCode: "NS_PARTIAL_LAME_PROVIDER_VULNERABLE",
	}

	t.Run("publishes serialized finding", func(t *testing.T) {
		client := &fakePublishClient{}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.upsert"}

		err := p.Publish(context.Background(), finding)
		if err != nil {
			t.Fatalf("unexpected publish error: %v", err)
		}
		if client.called != 1 {
			t.Fatalf("expected one publish call, got %d", client.called)
		}
		if client.lastSubj != "scans.findings.upsert" {
			t.Fatalf("unexpected subject: %q", client.lastSubj)
		}

		var got model.Finding
		if err := json.Unmarshal(client.lastBytes, &got); err != nil {
			t.Fatalf("payload not valid json: %v", err)
		}
		if got != finding {
			t.Fatalf("unexpected payload: got=%+v want=%+v", got, finding)
		}
	})

	t.Run("returns publish client error", func(t *testing.T) {
		client := &fakePublishClient{err: errors.New("publish failed")}
		p := &Publisher{logger: zerolog.Nop(), js: client, subject: "scans.findings.upsert"}

		err := p.Publish(context.Background(), finding)
		if err == nil {
			t.Fatal("expected publish error")
		}
		if client.called != 1 {
			t.Fatalf("expected one publish call, got %d", client.called)
		}
	})
}
