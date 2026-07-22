package app

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakePublisher struct {
	err      error
	published []model.Finding
}

func (f *fakePublisher) Publish(_ context.Context, finding model.Finding) error {
	if f.err != nil {
		return f.err
	}
	f.published = append(f.published, finding)
	return nil
}

type fakeClassifier struct {
	findings []model.Finding
	err      error
}

func (f fakeClassifier) Classify(model.Input) ([]model.Finding, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.findings, nil
}

type fakeJSMsg struct {
	data    []byte
	subject string

	ackErr  error
	nakErr  error
	termErr error

	ackCount  int
	nakCount  int
	termCount int
}

func (m *fakeJSMsg) Metadata() (*jetstream.MsgMetadata, error) { return nil, nil }
func (m *fakeJSMsg) Data() []byte                              { return m.data }
func (m *fakeJSMsg) Headers() nats.Header                      { return nil }
func (m *fakeJSMsg) Subject() string                           { return m.subject }
func (m *fakeJSMsg) Reply() string                             { return "" }

func (m *fakeJSMsg) Ack() error {
	m.ackCount++
	return m.ackErr
}

func (m *fakeJSMsg) DoubleAck(context.Context) error { return nil }

func (m *fakeJSMsg) Nak() error {
	m.nakCount++
	return m.nakErr
}

func (m *fakeJSMsg) NakWithDelay(time.Duration) error { return nil }
func (m *fakeJSMsg) InProgress() error                { return nil }

func (m *fakeJSMsg) Term() error {
	m.termCount++
	return m.termErr
}

func (m *fakeJSMsg) TermWithReason(string) error { return nil }

func TestWorkerHandle(t *testing.T) {
	logger := zerolog.Nop()

	t.Run("decode error terminates message", func(t *testing.T) {
		pub := &fakePublisher{}
		classifier := fakeClassifier{}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{data: []byte("{not-json"), subject: "scans.dns_scanner_results"}
		err := worker.Handle(context.Background(), msg)
		if err == nil {
			t.Fatal("expected decode error")
		}
		if msg.termCount != 1 {
			t.Fatalf("expected term once, got %d", msg.termCount)
		}
		if msg.nakCount != 0 || msg.ackCount != 0 {
			t.Fatalf("unexpected ack/nak counts: ack=%d nak=%d", msg.ackCount, msg.nakCount)
		}
	})

	t.Run("classification error naks message", func(t *testing.T) {
		pub := &fakePublisher{}
		classifier := fakeClassifier{err: errors.New("classify failed")}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{data: []byte(`{"domain_key":"k","results":{}}`), subject: "scans.dns_scanner_results"}
		err := worker.Handle(context.Background(), msg)
		if err == nil {
			t.Fatal("expected classification error")
		}
		if msg.nakCount != 1 {
			t.Fatalf("expected nak once, got %d", msg.nakCount)
		}
		if msg.ackCount != 0 || msg.termCount != 0 {
			t.Fatalf("unexpected ack/term counts: ack=%d term=%d", msg.ackCount, msg.termCount)
		}
	})

	t.Run("publish error naks message", func(t *testing.T) {
		pub := &fakePublisher{err: errors.New("publish failed")}
		classifier := fakeClassifier{findings: []model.Finding{{Domain: "a.example.ca"}}}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{data: []byte(`{"domain_key":"k","results":{}}`), subject: "scans.dns_scanner_results"}
		err := worker.Handle(context.Background(), msg)
		if err == nil {
			t.Fatal("expected publish error")
		}
		if msg.nakCount != 1 {
			t.Fatalf("expected nak once, got %d", msg.nakCount)
		}
		if msg.ackCount != 0 || msg.termCount != 0 {
			t.Fatalf("unexpected ack/term counts: ack=%d term=%d", msg.ackCount, msg.termCount)
		}
	})

	t.Run("successful processing publishes all findings and acks", func(t *testing.T) {
		pub := &fakePublisher{}
		classifier := fakeClassifier{findings: []model.Finding{{Domain: "a.example.ca"}, {Domain: "b.example.ca"}}}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{data: []byte(`{"domain_key":"k","results":{}}`), subject: "scans.dns_scanner_results"}
		err := worker.Handle(context.Background(), msg)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(pub.published) != 2 {
			t.Fatalf("expected 2 published findings, got %d", len(pub.published))
		}
		if msg.ackCount != 1 {
			t.Fatalf("expected ack once, got %d", msg.ackCount)
		}
		if msg.nakCount != 0 || msg.termCount != 0 {
			t.Fatalf("unexpected nak/term counts: nak=%d term=%d", msg.nakCount, msg.termCount)
		}
	})

	t.Run("ack failure returns error", func(t *testing.T) {
		pub := &fakePublisher{}
		classifier := fakeClassifier{}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{
			data:    []byte(`{"domain_key":"k","results":{}}`),
			subject: "scans.dns_scanner_results",
			ackErr:  errors.New("ack failed"),
		}

		err := worker.Handle(context.Background(), msg)
		if err == nil {
			t.Fatal("expected ack error")
		}
		if msg.ackCount != 1 {
			t.Fatalf("expected ack once, got %d", msg.ackCount)
		}
	})

	t.Run("decode error still returned when term fails", func(t *testing.T) {
		pub := &fakePublisher{}
		classifier := fakeClassifier{}
		worker := NewWorker(logger, pub, classifier)

		msg := &fakeJSMsg{
			data:    []byte("{bad-json"),
			subject: "scans.dns_scanner_results",
			termErr: errors.New("term failed"),
		}

		err := worker.Handle(context.Background(), msg)
		if err == nil {
			t.Fatal("expected decode error")
		}
		if msg.termCount != 1 {
			t.Fatalf("expected term once, got %d", msg.termCount)
		}
	})
}

func TestDecodeScan_TrimsTrailingNewline(t *testing.T) {
	_, err := decodeScan([]byte("{\"domain_key\":\"k\",\"results\":{}}\n"))
	if err != nil {
		t.Fatalf("expected decode success, got error: %v", err)
	}
}
