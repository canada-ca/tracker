package runner

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/nats-io/nats.go"
)

type fakeAckMessage struct {
	ackCount  int
	nakCount  int
	termCount int
}

func (f *fakeAckMessage) Ack(...nats.AckOpt) error {
	f.ackCount++
	return nil
}

func (f *fakeAckMessage) Nak(...nats.AckOpt) error {
	f.nakCount++
	return nil
}

func (f *fakeAckMessage) Term(...nats.AckOpt) error {
	f.termCount++
	return nil
}

type fakeNATSConnection struct {
	js  jetStream
	err error
}

func (f fakeNATSConnection) JetStream() (jetStream, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.js, nil
}

func (fakeNATSConnection) Close() {}

type fakeJetStream struct {
	queueSubErr error
	subErr      error

	queueCalled bool
	subCalled   bool
}

func (f *fakeJetStream) QueueSubscribe(_ string, _ string, _ nats.MsgHandler, _ ...nats.SubOpt) (*nats.Subscription, error) {
	f.queueCalled = true
	if f.queueSubErr != nil {
		return nil, f.queueSubErr
	}
	return &nats.Subscription{}, nil
}

func (f *fakeJetStream) Subscribe(_ string, _ nats.MsgHandler, _ ...nats.SubOpt) (*nats.Subscription, error) {
	f.subCalled = true
	if f.subErr != nil {
		return nil, f.subErr
	}
	return &nats.Subscription{}, nil
}

type fakeDBClient struct {
	err error
}

func (f fakeDBClient) GetDatabase(context.Context, string, *arangodb.GetDatabaseOptions) (arangodb.Database, error) {
	if f.err != nil {
		return nil, f.err
	}
	return nil, nil
}

func TestApplyAction(t *testing.T) {
	tests := []struct {
		name     string
		action   string
		wantAck  int
		wantNak  int
		wantTerm int
	}{
		{name: "ack action", action: "ack", wantAck: 1},
		{name: "nak action", action: "nak", wantNak: 1},
		{name: "term action", action: "term", wantTerm: 1},
		{name: "default action", action: "unknown", wantTerm: 1},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			msg := &fakeAckMessage{}
			applyAction(msg, tc.action)

			if msg.ackCount != tc.wantAck || msg.nakCount != tc.wantNak || msg.termCount != tc.wantTerm {
				t.Fatalf("unexpected ack/nak/term counts: got %d/%d/%d", msg.ackCount, msg.nakCount, msg.termCount)
			}
		})
	}
}

func TestRunErrorPaths(t *testing.T) {
	cfg := config.Config{NATSURL: "nats://example", NATSSubject: "subject", NATSStream: "stream", NATSDurable: "durable", DBName: "db"}

	t.Run("nats connection failure", func(t *testing.T) {
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return nil, errors.New("connect failed")
		}

		err := runWithDeps(cfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("jetstream creation failure", func(t *testing.T) {
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{err: errors.New("jetstream failed")}, nil
		}

		err := runWithDeps(cfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("db client creation failure", func(t *testing.T) {
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{js: &fakeJetStream{}}, nil
		}
		deps.createDBClient = func(config.Config) (dbClient, error) {
			return nil, errors.New("db client failed")
		}
		deps.getDatabase = func(context.Context, dbClient, string) (arangodb.Database, error) {
			return nil, nil
		}

		err := runWithDeps(cfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("get database failure", func(t *testing.T) {
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{js: &fakeJetStream{}}, nil
		}
		deps.createDBClient = func(config.Config) (dbClient, error) {
			return fakeDBClient{}, nil
		}
		deps.getDatabase = func(context.Context, dbClient, string) (arangodb.Database, error) {
			return nil, errors.New("get db failed")
		}

		err := runWithDeps(cfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("subscribe failure", func(t *testing.T) {
		js := &fakeJetStream{subErr: errors.New("subscribe failed")}
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{js: js}, nil
		}
		deps.createDBClient = func(config.Config) (dbClient, error) {
			return fakeDBClient{}, nil
		}
		deps.getDatabase = func(context.Context, dbClient, string) (arangodb.Database, error) {
			return nil, nil
		}
		deps.drainSubscription = func(*nats.Subscription) error { return nil }
		deps.notifyContext = func(parent context.Context, _ ...os.Signal) (context.Context, context.CancelFunc) {
			ctx, cancel := context.WithCancel(parent)
			return ctx, cancel
		}

		err := runWithDeps(cfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !js.subCalled {
			t.Fatal("expected standard subscription to be attempted")
		}
	})

	t.Run("queue subscribe failure", func(t *testing.T) {
		js := &fakeJetStream{queueSubErr: errors.New("queue subscribe failed")}
		queueCfg := cfg
		queueCfg.NATSQueueGroup = "workers"

		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{js: js}, nil
		}
		deps.createDBClient = func(config.Config) (dbClient, error) {
			return fakeDBClient{}, nil
		}
		deps.getDatabase = func(context.Context, dbClient, string) (arangodb.Database, error) {
			return nil, nil
		}
		deps.drainSubscription = func(*nats.Subscription) error { return nil }
		deps.notifyContext = func(parent context.Context, _ ...os.Signal) (context.Context, context.CancelFunc) {
			ctx, cancel := context.WithCancel(parent)
			return ctx, cancel
		}

		err := runWithDeps(queueCfg, deps)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !js.queueCalled {
			t.Fatal("expected queue subscription to be attempted")
		}
	})

	t.Run("successful run exits on canceled context", func(t *testing.T) {
		js := &fakeJetStream{}
		deps := defaultDependencies()
		deps.connectNATS = func(string) (natsConnection, error) {
			return fakeNATSConnection{js: js}, nil
		}
		deps.createDBClient = func(config.Config) (dbClient, error) {
			return fakeDBClient{}, nil
		}
		deps.getDatabase = func(context.Context, dbClient, string) (arangodb.Database, error) {
			return nil, nil
		}
		deps.drainSubscription = func(*nats.Subscription) error { return nil }
		deps.notifyContext = func(parent context.Context, _ ...os.Signal) (context.Context, context.CancelFunc) {
			ctx, cancel := context.WithCancel(parent)
			cancel()
			return ctx, func() {}
		}

		err := runWithDeps(cfg, deps)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
	})
}
