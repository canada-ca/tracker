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
	err       error
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

	tests := []struct {
		name                 string
		data                 []byte
		ackErr               error
		nakErr               error
		termErr              error
		classifier           fakeClassifier
		publisherErr         error
		wantErr              bool
		wantAck              int
		wantNak              int
		wantTerm             int
		wantPublishedFindings int
	}{
		{
			name:     "decode error terminates message",
			data:     []byte("{not-json"),
			wantErr:  true,
			wantAck:  0,
			wantNak:  0,
			wantTerm: 1,
		},
		{
			name:       "classification error naks message",
			data:       []byte(`{"domain_key":"k","results":{}}`),
			classifier: fakeClassifier{err: errors.New("classify failed")},
			wantErr:    true,
			wantAck:    0,
			wantNak:    1,
			wantTerm:   0,
		},
		{
			name:         "publish error naks message",
			data:         []byte(`{"domain_key":"k","results":{}}`),
			classifier:   fakeClassifier{findings: []model.Finding{{Domain: "a.example.ca"}}},
			publisherErr: errors.New("publish failed"),
			wantErr:      true,
			wantAck:      0,
			wantNak:      1,
			wantTerm:     0,
		},
		{
			name:                 "successful processing publishes all findings and acks",
			data:                 []byte(`{"domain_key":"k","results":{}}`),
			classifier:           fakeClassifier{findings: []model.Finding{{Domain: "a.example.ca"}, {Domain: "b.example.ca"}}},
			wantErr:              false,
			wantAck:              1,
			wantNak:              0,
			wantTerm:             0,
			wantPublishedFindings: 2,
		},
		{
			name:     "ack failure returns error",
			data:     []byte(`{"domain_key":"k","results":{}}`),
			ackErr:   errors.New("ack failed"),
			wantErr:  true,
			wantAck:  1,
			wantNak:  0,
			wantTerm: 0,
		},
		{
			name:     "decode error still returned when term fails",
			data:     []byte("{bad-json"),
			termErr:  errors.New("term failed"),
			wantErr:  true,
			wantAck:  0,
			wantNak:  0,
			wantTerm: 1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			pub := &fakePublisher{err: tc.publisherErr}
			worker := NewWorker(logger, pub.Publish, tc.classifier.Classify)

			msg := &fakeJSMsg{
				data:    tc.data,
				subject: "scans.dns_scanner_results",
				ackErr:  tc.ackErr,
				nakErr:  tc.nakErr,
				termErr: tc.termErr,
			}

			err := worker.Handle(context.Background(), msg)
			if tc.wantErr && err == nil {
				t.Fatal("expected error")
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if msg.ackCount != tc.wantAck {
				t.Fatalf("unexpected ack count: got=%d want=%d", msg.ackCount, tc.wantAck)
			}
			if msg.nakCount != tc.wantNak {
				t.Fatalf("unexpected nak count: got=%d want=%d", msg.nakCount, tc.wantNak)
			}
			if msg.termCount != tc.wantTerm {
				t.Fatalf("unexpected term count: got=%d want=%d", msg.termCount, tc.wantTerm)
			}
			if len(pub.published) != tc.wantPublishedFindings {
				t.Fatalf("unexpected published findings count: got=%d want=%d", len(pub.published), tc.wantPublishedFindings)
			}
		})
	}
}

func TestDecodeScan_TrimsTrailingNewline(t *testing.T) {
	_, err := decodeScan([]byte("{\"domain_key\":\"k\",\"results\":{}}\n"))
	if err != nil {
		t.Fatalf("expected decode success, got error: %v", err)
	}
}
