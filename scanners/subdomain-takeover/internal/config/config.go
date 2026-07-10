package config

import (
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog"
)

type Config struct {
	NATSURL     string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	NATSStream  string        `envconfig:"NATS_STREAM" default:"SCANS"`
	SubjectIn   string        `envconfig:"SUBJECT_IN" default:"scans.dns_scanner_results"`
	SubjectOut  string        `envconfig:"SUBJECT_OUT" default:"scans.findings.upsert"`
	DurableName string        `envconfig:"DURABLE_NAME" default:"subdomain_takeover"`
	WorkerCount int           `envconfig:"WORKER_COUNT" default:"5"`
	LogLevel    zerolog.Level `envconfig:"LOG_LEVEL" default:"info"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
