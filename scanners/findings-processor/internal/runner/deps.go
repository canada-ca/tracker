package runner

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/nats-io/nats.go"
)

type jetStream interface {
	QueueSubscribe(subj, queue string, cb nats.MsgHandler, opts ...nats.SubOpt) (*nats.Subscription, error)
	Subscribe(subj string, cb nats.MsgHandler, opts ...nats.SubOpt) (*nats.Subscription, error)
}

type natsConnection interface {
	JetStream() (jetStream, error)
	Close()
}

type dbClient interface {
	GetDatabase(ctx context.Context, name string, options *arangodb.GetDatabaseOptions) (arangodb.Database, error)
}

type funcNATSConnection struct {
	jetStreamFn func() (jetStream, error)
	closeFn     func()
}

func (c funcNATSConnection) JetStream() (jetStream, error) {
	if c.jetStreamFn == nil {
		return nil, errors.New("jetstream function is not configured")
	}

	return c.jetStreamFn()
}

func (c funcNATSConnection) Close() {
	if c.closeFn != nil {
		c.closeFn()
	}
}

type dependencies struct {
	connectNATS       func(url string) (natsConnection, error)
	createDBClient    func(cfg config.Config) (dbClient, error)
	getDatabase       func(ctx context.Context, client dbClient, name string) (arangodb.Database, error)
	drainSubscription func(sub *nats.Subscription) error
	handleEvent       func(ctx context.Context, db arangodb.Database, payload []byte) string
	notifyContext     func(parent context.Context, signals ...os.Signal) (context.Context, context.CancelFunc)
}

func defaultDependencies() dependencies {
	return dependencies{
		connectNATS: func(url string) (natsConnection, error) {
			nc, err := nats.Connect(url)
			if err != nil {
				return nil, err
			}

			return funcNATSConnection{
				jetStreamFn: func() (jetStream, error) {
					return nc.JetStream()
				},
				closeFn: func() {
					nc.Close()
				},
			}, nil
		},
		createDBClient: func(cfg config.Config) (dbClient, error) {
			return database.CreateDBClient(cfg)
		},
		getDatabase: func(ctx context.Context, client dbClient, name string) (arangodb.Database, error) {
			return client.GetDatabase(ctx, name, nil)
		},
		drainSubscription: func(sub *nats.Subscription) error {
			if sub == nil {
				return nil
			}

			done := make(chan struct{})
			sub.SetClosedHandler(func(string) { close(done) })

			if err := sub.Drain(); err != nil {
				return err
			}

			select {
			case <-done:
				return nil
			case <-time.After(10 * time.Second):
				return errors.New("timed out waiting for subscription drain")
			}
		},
		handleEvent:   HandleEvent,
		notifyContext: signal.NotifyContext,
	}
}
