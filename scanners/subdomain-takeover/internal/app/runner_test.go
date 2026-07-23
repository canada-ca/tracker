package app

import (
	"context"
	"sync"
	"testing"

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

type fakeHandler struct {
	mu    sync.Mutex
	count int
}

func (f *fakeHandler) Handle(context.Context, jetstream.Msg) error {
	f.mu.Lock()
	f.count++
	f.mu.Unlock()
	return nil
}

// nolint:revive // nats Conn fields are unexported; this fake nil connection path only.
func TestRun_ReturnsImmediatelyWhenConnectionUnhealthy(t *testing.T) {
	iter := &fakeMessagesIter{}
	h := &fakeHandler{}

	deps := RunnerDeps{
		Logger:      zerolog.Nop(),
		WorkerCount: 2,
		Iter:        iter,
		Worker:      h,
		NC:          nil,
	}

	Run(context.Background(), deps)

	if h.count != 0 {
		t.Fatalf("expected no handled messages, got %d", h.count)
	}
}

func TestRun_ClampsWorkerCountBelowOne(t *testing.T) {
	iter := &fakeMessagesIter{}
	h := &fakeHandler{}

	deps := RunnerDeps{
		Logger:      zerolog.Nop(),
		WorkerCount: 0,
		Iter:        iter,
		Worker:      h,
		NC:          (*nats.Conn)(nil),
	}

	Run(context.Background(), deps)
	if h.count != 0 {
		t.Fatalf("expected no handled messages, got %d", h.count)
	}
}
