package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/app"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/bootstrap"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
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

	if err := detect.LoadFingerprints(); err != nil {
		logger.Fatal().Err(err).Msg("failed to load fingerprints")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(sig)

	runtimeDeps, err := bootstrap.NewRuntimeDeps(ctx, cfg)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to initialize runtime dependencies")
	}

	logger.Info().Msgf("Connected to NATS at %s", runtimeDeps.NC.ConnectedUrl())

	pub := messaging.NewPublisher(logger, runtimeDeps.JS, cfg.SubjectOut)
	matcher := detect.NewHTTPBodyFingerprintMatcher(5 * time.Second)
	classifier := detect.NewClassifier(matcher)
	worker := app.NewWorker(logger, pub, classifier)

	go func() {
		<-sig
		logger.Info().Msg("Shutdown requested...")
		cancel()
		runtimeDeps.Iter.Stop()
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
	if err := runtimeDeps.NC.Flush(); err != nil {
		logger.Error().Err(err).Msg("failed to flush nats connection")
	}
	runtimeDeps.NC.Close()

	if err := ctx.Err(); err != nil && err != context.Canceled {
		logger.Error().Err(err).Msg("service exited with context error")
	}
}
