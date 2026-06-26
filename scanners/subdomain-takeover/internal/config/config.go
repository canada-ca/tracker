package config

import (
	"os"

	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog"
)

type Config struct {
	NatsUrl     string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	NatsStream  string        `envconfig:"NATS_STREAM" default:"SCANS"`
	SubjectIn   string        `envconfig:"SUBJECT_IN" default:"scans.dns_scanner_results"`
	SubjectOut  string        `envconfig:"SUBJECT_OUT" default:"scans.findings.upsert"`
	DurableName string        `envconfig:"DURABLE_NAME" default:"subdomain_takeover"`
	WorkerCount int           `envconfig:"WORKER_COUNT" default:"5"`
	LogLevel    zerolog.Level `envconfig:"LOG_LEVEL" default:"info"`
	Logger      zerolog.Logger
}

func InitConfig() *Config {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		panic(err)
	}

	zerolog.SetGlobalLevel(cfg.LogLevel)

	// Create multiple output steams for zerolog
	multi := zerolog.MultiLevelWriter(zerolog.ConsoleWriter{Out: os.Stderr})

	logger := zerolog.New(multi).With().Timestamp().Logger()

	cfg.Logger = logger

	return &cfg
}
