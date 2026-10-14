package config

import (
	"errors"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog"
)

type Config struct {
	NATSURL     string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	NATSStream  string        `envconfig:"NATS_STREAM" default:"SCANS"`
	SubjectIn   string        `envconfig:"SUBJECT_IN" default:"scans.subdomain_takeover_requests"`
	SubjectOut  string        `envconfig:"SUBJECT_OUT" default:"scans.findings.subdomain-takeover"`
	DurableName string        `envconfig:"DURABLE_NAME" default:"subdomain_takeover"`
	WorkerCount int           `envconfig:"WORKER_COUNT" default:"5"`
	LogLevel    zerolog.Level `envconfig:"LOG_LEVEL" default:"info"`
}

// Load reads configuration from the environment. A .env file in the working
// directory is loaded first if present; variables already set in the
// environment take precedence over values from .env.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("load .env: %w", err)
	}

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
