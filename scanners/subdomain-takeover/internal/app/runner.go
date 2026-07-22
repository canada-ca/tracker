package app

import (
	"context"
	"sync"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type RunnerDeps struct {
	Logger      zerolog.Logger
	WorkerCount int
	Iter        jetstream.MessagesContext
	Worker      MessageHandler
	NC          *nats.Conn
}

type MessageHandler interface {
	Handle(ctx context.Context, msg jetstream.Msg) error
}

func Run(ctx context.Context, deps RunnerDeps) {
	logger := deps.Logger
	iter := deps.Iter
	nextErrCount := 0

	if deps.WorkerCount < 1 {
		deps.WorkerCount = 1
	}

	logger.Info().Int("worker_count", deps.WorkerCount).Msg("runner started")

	var wg sync.WaitGroup
	sem := make(chan struct{}, deps.WorkerCount)

Loop:
	for {
		if err := messaging.CheckConnection(deps.NC); err != nil {
			logger.Error().Err(err).Msg("NATS connection unhealthy")
			break Loop
		}

		select {
		case <-ctx.Done():
			break Loop
		default:
		}

		msg, err := iter.Next()
		if err != nil {
			if ctx.Err() != nil {
				logger.Info().Msg("runner stopping: context canceled")
				break Loop
			}
			nextErrCount++
			if nextErrCount%10 == 0 {
				logger.Warn().Err(err).Int("consecutive_next_errors", nextErrCount).Msg("iterator next repeatedly failed")
			} else {
				logger.Debug().Err(err).Int("consecutive_next_errors", nextErrCount).Msg("next returned, continuing")
			}
			continue
		}
		nextErrCount = 0

		select {
		case sem <- struct{}{}:
		case <-ctx.Done():
			break Loop
		}

		wg.Add(1)
		go func(m jetstream.Msg) {
			defer wg.Done()
			defer func() { <-sem }()
			deps.Worker.Handle(ctx, m)
		}(msg)
	}

	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <-waitDone:
		logger.Info().Msg("all workers drained")
	case <-time.After(30 * time.Second):
		logger.Warn().Msg("drain timeout")
	}
}
