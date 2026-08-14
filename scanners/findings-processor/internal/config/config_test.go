package config

import (
	"testing"

	"github.com/rs/zerolog"
)

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("NATS_URL", "nats://nats.example:4222")
	t.Setenv("NATS_STREAM", "MY_STREAM")
	t.Setenv("NATS_SUBJECT", "my.subject")
	t.Setenv("NATS_CONSUMER_DURABLE", "durable-name")
	t.Setenv("NATS_QUEUE_GROUP", "workers")
	t.Setenv("NATS_ACK_WAIT", "45s")
	t.Setenv("NATS_MAX_DELIVER", "7")
	t.Setenv("NATS_MAX_ACK_PENDING", "512")
	t.Setenv("DB_URL", "http://arangodb:8529")
	t.Setenv("DB_USER", "user")
	t.Setenv("DB_NAME", "tracker")
	t.Setenv("DB_PASS", "secret")
	t.Setenv("LOG_LEVEL", "warn")
	t.Setenv("LOG_PRETTY", "false")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if cfg.NATSURL != "nats://nats.example:4222" {
		t.Fatalf("unexpected NATSURL: %q", cfg.NATSURL)
	}
	if cfg.NATSStream != "MY_STREAM" {
		t.Fatalf("unexpected NATSStream: %q", cfg.NATSStream)
	}
	if cfg.NATSSubject != "my.subject" {
		t.Fatalf("unexpected NATSSubject: %q", cfg.NATSSubject)
	}
	if cfg.NATSDurable != "durable-name" || cfg.NATSQueueGroup != "workers" {
		t.Fatalf("unexpected consumer config: durable=%q queue=%q", cfg.NATSDurable, cfg.NATSQueueGroup)
	}
	if cfg.NATSMaxDeliver != 7 || cfg.NATSMaxPending != 512 {
		t.Fatalf("unexpected delivery config: maxDeliver=%d maxPending=%d", cfg.NATSMaxDeliver, cfg.NATSMaxPending)
	}
	if cfg.DBURL != "http://arangodb:8529" || cfg.DBUser != "user" || cfg.DBName != "tracker" || cfg.DBPassword != "secret" {
		t.Fatalf("unexpected database config")
	}
	if cfg.LogLevel != "warn" || cfg.PrettyLogOutput {
		t.Fatalf("unexpected LogLevel: %q", cfg.LogLevel)
	}
}

func TestLoadInvalidDuration(t *testing.T) {
	t.Setenv("NATS_ACK_WAIT", "not-a-duration")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestSetupLoggerLevelParsing(t *testing.T) {
	original := zerolog.GlobalLevel()
	t.Cleanup(func() {
		zerolog.SetGlobalLevel(original)
	})

	SetupLogger(Config{LogLevel: "debug", PrettyLogOutput: false})
	if got := zerolog.GlobalLevel(); got != zerolog.DebugLevel {
		t.Fatalf("unexpected log level: got %s", got)
	}

	SetupLogger(Config{LogLevel: "not-a-level", PrettyLogOutput: false})
	if got := zerolog.GlobalLevel(); got != zerolog.InfoLevel {
		t.Fatalf("invalid level should default to info, got %s", got)
	}
}
