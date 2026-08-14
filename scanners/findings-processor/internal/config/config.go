package config

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type Config struct {
	NATSURL        string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	NATSStream     string        `envconfig:"NATS_STREAM" default:"SCANS"`
	NATSSubject    string        `envconfig:"NATS_SUBJECT" default:"scans.findings.*"`
	NATSDurable    string        `envconfig:"NATS_CONSUMER_DURABLE" default:"findings-processor"`
	NATSQueueGroup string        `envconfig:"NATS_QUEUE_GROUP"`
	NATSAckWait    time.Duration `envconfig:"NATS_ACK_WAIT" default:"30s"`
	NATSMaxDeliver int           `envconfig:"NATS_MAX_DELIVER" default:"10"`
	NATSMaxPending int           `envconfig:"NATS_MAX_ACK_PENDING" default:"256"`

	DBURL      string `envconfig:"DB_URL" default:"http://localhost:8529"`
	DBUser     string `envconfig:"DB_USER"`
	DBName     string `envconfig:"DB_NAME"`
	DBPassword string `envconfig:"DB_PASS"`

	LogLevel        string `envconfig:"LOG_LEVEL" default:"info"`
	PrettyLogOutput bool   `envconfig:"LOG_PRETTY" default:"true"`
}

func Load() (Config, error) {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return Config{}, err
	}

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func SetupLogger(cfg Config) {
	level, err := zerolog.ParseLevel(strings.ToLower(cfg.LogLevel))
	if err != nil {
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)
	if cfg.PrettyLogOutput {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	log.Info().Str("logLevel", zerolog.GlobalLevel().String()).Msg("logger initialized")
}
