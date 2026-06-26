package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

func main() {
	config := initConfig()
	logger := config.Logger

	ctx, cancel := context.WithCancel(context.Background())

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	var wg sync.WaitGroup
	sem := make(chan struct{}, config.WorkerCount)

	nc, _ := nats.Connect(config.NatsUrl)
	js, _ := jetstream.New(nc)
	logger.Info().Msgf("Connected to NATS at %s...", nc.ConnectedUrl())

	s, _ := js.CreateStream(ctx, jetstream.StreamConfig{
		Name:     config.NatsStream,
		Subjects: []string{config.SubjectIn, config.SubjectOut},
	})

	cons, _ := s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:   config.DurableName,
		AckPolicy: jetstream.AckExplicitPolicy,
	})

	iter, err := cons.Messages(jetstream.PullMaxMessages(1), jetstream.PullExpiry(1*time.Second))
	if err != nil {
		logger.Err(err)
	}

	go func() {
		<-sig
		logger.Info().Msg("Shutdown requested...")
		cancel()
		iter.Stop()
	}()

Loop:
	for {
		if nc.IsClosed() {
			logger.Error().Msg("Connection to NATS is closed.")
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
				break Loop
			}
			logger.Debug().Err(err).Msg("next returned, continuing")
			continue
		}

		select {
		case sem <- struct{}{}:
		case <-ctx.Done():
			break Loop
		}

		wg.Add(1)
		go func(m jetstream.Msg) {
			defer wg.Done()
			defer func() { <-sem }()
			fmt.Println(string(m.Data()))
			m.Ack()
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
		logger.Info().Msg("drain timeout")
	}

	logger.Info().Msgf("Disconnecting from NATS at %s", nc.ConnectedUrl())
	nc.Flush()
	nc.Close()
}
