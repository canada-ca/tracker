package app

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakeMessagesIter struct {
	mu   sync.Mutex
	msgs []jetstream.Msg
	err  error
	idx  int
}

func (f *fakeMessagesIter) Next(...jetstream.NextOpt) (jetstream.Msg, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.err != nil {
		return nil, f.err
	}
	if f.idx >= len(f.msgs) {
		return nil, jetstream.ErrMsgIteratorClosed
	}
	m := f.msgs[f.idx]
	f.idx++
	return m, nil
}

func (f *fakeMessagesIter) Stop()  {}
func (f *fakeMessagesIter) Drain() {}

func TestIsBenignNextError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{name: "iterator closed", err: jetstream.ErrMsgIteratorClosed, want: true},
		{name: "no messages", err: jetstream.ErrNoMessages, want: true},
		{name: "nats timeout", err: nats.ErrTimeout, want: true},
		{name: "deadline exceeded", err: context.DeadlineExceeded, want: true},
		{name: "context canceled is not benign", err: context.Canceled, want: false},
		{name: "other error", err: errors.New("boom"), want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isBenignNextError(tt.err); got != tt.want {
				t.Fatalf("isBenignNextError(%v)=%v want=%v", tt.err, got, tt.want)
			}
		})
	}
}

// Run's connection health check requires a real *nats.Conn to exercise the
// "healthy" path (nats.Conn has no exported way to fake IsConnected()==true),
// so message-processing behavior is covered by TestWorkerHandle instead. What
// is covered here at the unit level is the unhealthy-connection short-circuit.
func TestRun_ReturnsImmediatelyWhenConnectionUnhealthy(t *testing.T) {
	iter := &fakeMessagesIter{}
	classifier := detect.NewClassifier(nil, zerolog.Nop())
	publisher := messaging.NewPublisher(zerolog.Nop(), &fakeJSPublishClient{}, "scans.findings.subdomain-takeover")
	worker := NewWorker(zerolog.Nop(), publisher, classifier)

	deps := RunnerDeps{
		Logger:      zerolog.Nop(),
		WorkerCount: 2,
		Iter:        iter,
		Worker:      worker,
		NC:          nil,
	}

	Run(context.Background(), deps)

	if iter.idx != 0 {
		t.Fatalf("expected no iterator reads, got %d", iter.idx)
	}
}
