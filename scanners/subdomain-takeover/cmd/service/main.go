package main

import (
	"context"
	"os/signal"
	"syscall"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/app"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/bootstrap"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/rs/zerolog"
)

func main() {
	logger := bootstrap.NewLogger(zerolog.InfoLevel)

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to load config")
	}

	logger = bootstrap.NewLogger(cfg.LogLevel)
	logger.Info().
		Str("nats_url", cfg.NATSURL).
		Str("stream", cfg.NATSStream).
		Str("subject_in", cfg.SubjectIn).
		Str("subject_out", cfg.SubjectOut).
		Str("durable", cfg.DurableName).
		Int("worker_count", cfg.WorkerCount).
		Str("log_level", cfg.LogLevel.String()).
		Msg("service configuration loaded")

	if err := fingerprints.Load(logger); err != nil {
		logger.Fatal().Err(err).Msg("failed to load fingerprints")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	runtimeDeps, err := bootstrap.NewRuntimeDeps(ctx, cfg, logger)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to initialize runtime dependencies")
	}

	logger.Info().Msgf("Connected to NATS at %s", runtimeDeps.NC.ConnectedUrl())

	pub := messaging.NewPublisher(logger, runtimeDeps.JS, cfg.SubjectOut)
	matcher := detect.NewHTTPBodyFingerprintMatcher(5 * time.Second)
	classifier := detect.NewClassifier(matcher, logger)
	worker := app.NewWorker(logger, pub, classifier)

	go func() {
		<-ctx.Done()
		logger.Info().Msg("Shutdown requested...")
		runtimeDeps.Iter.Drain()
	}()

	deps := app.RunnerDeps{
		Logger:      logger,
		WorkerCount: cfg.WorkerCount,
		Iter:        runtimeDeps.Iter,
		Worker:      worker,
		NC:          runtimeDeps.NC,
	}

	app.Run(ctx, deps)

	logger.Info().Msgf("Disconnecting from NATS at %s", runtimeDeps.NC.ConnectedUrl())
	if err := runtimeDeps.NC.Drain(); err != nil {
		logger.Error().Err(err).Msg("failed to drain nats connection")
	}

	select {
	case <-runtimeDeps.Closed:
	case <-time.After(10 * time.Second):
		logger.Warn().Msg("timed out waiting for nats connection to close")
	}
}
