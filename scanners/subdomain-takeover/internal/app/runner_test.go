package app

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type fakeMessagesIter struct {
	mu         sync.Mutex
	msgs       []jetstream.Msg
	err        error
	idx        int
	stopCalled bool
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

func (f *fakeMessagesIter) Stop()  { f.stopCalled = true }
func (f *fakeMessagesIter) Drain() {}

// nolint:revive // nats Conn fields are unexported; this fake nil connection path only.
func TestRun_ReturnsImmediatelyWhenConnectionUnhealthy(t *testing.T) {
	iter := &fakeMessagesIter{}
	worker := NewWorker(zerolog.Nop(), (&fakePublisher{}).Publish, (fakeClassifier{}).Classify)

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

func TestRun_ClampsWorkerCountBelowOne(t *testing.T) {
	origCheckConnection := checkConnection
	t.Cleanup(func() { checkConnection = origCheckConnection })

	checkCalls := 0
	checkConnection = func(_ *nats.Conn) error {
		checkCalls++
		if checkCalls > 1 {
			return errors.New("stop")
		}
		return nil
	}

	msg := &fakeJSMsg{data: []byte(`{"domain_key":"k","results":{}}`), subject: "scans.dns_scanner_results"}
	iter := &fakeMessagesIter{msgs: []jetstream.Msg{msg}}
	worker := NewWorker(zerolog.Nop(), (&fakePublisher{}).Publish, (fakeClassifier{}).Classify)

	deps := RunnerDeps{
		Logger:      zerolog.Nop(),
		WorkerCount: 0,
		Iter:        iter,
		Worker:      worker,
		NC:          nil,
	}

	Run(context.Background(), deps)
	if msg.ackCount != 1 {
		t.Fatalf("expected one handled message (ack once), got ack=%d", msg.ackCount)
	}
}

func TestRun_ExitsWhenContextCancelledDuringNextErrors(t *testing.T) {
	origCheckConnection := checkConnection
	t.Cleanup(func() { checkConnection = origCheckConnection })
	checkConnection = func(_ *nats.Conn) error { return nil }

	iter := &fakeMessagesIter{err: errors.New("next failed")}
	worker := NewWorker(zerolog.Nop(), (&fakePublisher{}).Publish, (fakeClassifier{}).Classify)

	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(5 * time.Millisecond)
		cancel()
	}()

	deps := RunnerDeps{
		Logger:      zerolog.Nop(),
		WorkerCount: 1,
		Iter:        iter,
		Worker:      worker,
		NC:          nil,
	}

	Run(ctx, deps)

	if iter.idx != 0 {
		t.Fatalf("expected no iterator reads, got %d", iter.idx)
	}
}
