package app

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

type RunnerDeps struct {
	Logger      zerolog.Logger
	WorkerCount int
	Iter        jetstream.MessagesContext
	Cancel      context.CancelFunc
	Context     context.Context
}

func Run(deps RunnerDeps) {
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	var wg sync.WaitGroup
	sem := make(chan struct{}, deps.WorkerCount)

	go func() {
		<-sig
		deps.Logger.Info().Msg("Shutdown requested...")
		deps.Cancel()
		deps.Iter.Stop()
	}()

Loop:
	for {
		// if nc.IsClosed() {
		// 	deps.Logger.Error().Msg("Connection to NATS is closed.")
		// 	break Loop
		// }

		select {
		case <-deps.Context.Done():
			break Loop
		default:
		}

		msg, err := deps.Iter.Next()
		if err != nil {
			if deps.Context.Err() != nil {
				break Loop
			}
			deps.Logger.Debug().Err(err).Msg("next returned, continuing")
			continue
		}

		select {
		case sem <- struct{}{}:
		case <-deps.Context.Done():
			break Loop
		}

		wg.Add(1)
		go func(m jetstream.Msg) {
			defer wg.Done()
			defer func() { <-sem }()
			deps.Logger.Info().Msg(string(m.Data()))
			err := m.Ack()
			if err != nil {
				deps.Logger.Err(err).Msg("Ack error")
			}
		}(msg)
	}

	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <-waitDone:
		deps.Logger.Info().Msg("all workers drained")
	case <-time.After(30 * time.Second):
		deps.Logger.Info().Msg("drain timeout")
	}
}
