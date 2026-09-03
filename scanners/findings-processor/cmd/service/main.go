package main

import (
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/runner"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}
	config.SetupLogger(cfg)

	if err := runner.Run(cfg); err != nil {
		log.Fatal().Err(err).Msg("findings processor failed")
	}
}
