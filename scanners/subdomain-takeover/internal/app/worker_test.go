package app

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakeJSPublishClient struct {
	err    error
	called int
}

func (f *fakeJSPublishClient) Publish(context.Context, string, []byte, ...jetstream.PublishOpt) (*jetstream.PubAck, error) {
	f.called++
	if f.err != nil {
		return nil, f.err
	}
	return &jetstream.PubAck{}, nil
}
func (f *fakeJSPublishClient) PublishMsg(context.Context, *nats.Msg, ...jetstream.PublishOpt) (*jetstream.PubAck, error) {
	return nil, nil
}
func (f *fakeJSPublishClient) PublishAsync(string, []byte, ...jetstream.PublishOpt) (jetstream.PubAckFuture, error) {
	return nil, nil
}
func (f *fakeJSPublishClient) PublishMsgAsync(*nats.Msg, ...jetstream.PublishOpt) (jetstream.PubAckFuture, error) {
	return nil, nil
}
func (f *fakeJSPublishClient) PublishAsyncPending() int              { return 0 }
func (f *fakeJSPublishClient) PublishAsyncComplete() <-chan struct{} { return nil }
func (f *fakeJSPublishClient) CleanupPublisher()                     {}

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

// scanWithFinding is DNS scan input that the real classifier turns into exactly
// one CNAME finding (a dangling Azure Web Apps CNAME), so Worker.Handle's
// publish path can be exercised without inventing a classifier seam.
const scanWithFinding = `{"domain_key":"k","results":{"domain":"a.example.ca","cname_record":"a.example.ca. 300 IN CNAME foo.azurewebsites.net."}}`

const scanWithNoFinding = `{"domain_key":"k","results":{}}`

func TestWorkerHandle(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}
	logger := zerolog.Nop()
	classifier := detect.NewClassifier(nil, logger)

	tests := []struct {
		name            string
		data            []byte
		ackErr          error
		nakErr          error
		termErr         error
		publisherErr    error
		wantErr         bool
		wantAck         int
		wantNak         int
		wantTerm        int
		wantPublishCall int
	}{
		{
			name:     "decode error terminates message",
			data:     []byte("{not-json"),
			wantErr:  true,
			wantTerm: 1,
		},
		{
			name:            "publish error naks message",
			data:            []byte(scanWithFinding),
			publisherErr:    errors.New("publish failed"),
			wantErr:         true,
			wantNak:         1,
			wantPublishCall: 1,
		},
		{
			name:            "successful processing publishes finding and acks",
			data:            []byte(scanWithFinding),
			wantErr:         false,
			wantAck:         1,
			wantPublishCall: 1,
		},
		{
			name:    "no findings still acks without publishing",
			data:    []byte(scanWithNoFinding),
			wantErr: false,
			wantAck: 1,
		},
		{
			name:    "ack failure returns error",
			data:    []byte(scanWithNoFinding),
			ackErr:  errors.New("ack failed"),
			wantErr: true,
			wantAck: 1,
		},
		{
			name:     "decode error still returned when term fails",
			data:     []byte("{bad-json"),
			termErr:  errors.New("term failed"),
			wantErr:  true,
			wantTerm: 1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			client := &fakeJSPublishClient{err: tc.publisherErr}
			publisher := messaging.NewPublisher(logger, client, "scans.findings.subdomain-takeover")
			worker := NewWorker(logger, publisher, classifier)

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
			if client.called != tc.wantPublishCall {
				t.Fatalf("unexpected publish call count: got=%d want=%d", client.called, tc.wantPublishCall)
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
