package config

import (
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	// Load() calls godotenv.Load(), which reads a .env file from the working
	// directory if one exists. None is present in this package during tests,
	// so envconfig defaults/overrides are what's under test here.

	t.Run("defaults when no env vars set", func(t *testing.T) {
		cfg, err := Load()
		if err != nil {
			t.Fatalf("Load() error = %v", err)
		}
		if cfg.NATSURL != "nats://localhost:4222" {
			t.Errorf("NATSURL = %q, want default", cfg.NATSURL)
		}
		if cfg.NATSAckWait != 30*time.Second {
			t.Errorf("NATSAckWait = %v, want 30s", cfg.NATSAckWait)
		}
		if cfg.NATSMaxDeliver != 10 {
			t.Errorf("NATSMaxDeliver = %d, want 10", cfg.NATSMaxDeliver)
		}
		if !cfg.PrettyLogOutput {
			t.Error("PrettyLogOutput = false, want true (default)")
		}
	})

	t.Run("env vars override defaults", func(t *testing.T) {
		t.Setenv("NATS_URL", "nats://example.com:4222")
		t.Setenv("NATS_MAX_DELIVER", "3")
		t.Setenv("DB_NAME", "findings")
		t.Setenv("LOG_PRETTY", "false")

		cfg, err := Load()
		if err != nil {
			t.Fatalf("Load() error = %v", err)
		}
		if cfg.NATSURL != "nats://example.com:4222" {
			t.Errorf("NATSURL = %q, want override", cfg.NATSURL)
		}
		if cfg.NATSMaxDeliver != 3 {
			t.Errorf("NATSMaxDeliver = %d, want 3", cfg.NATSMaxDeliver)
		}
		if cfg.DBName != "findings" {
			t.Errorf("DBName = %q, want %q", cfg.DBName, "findings")
		}
		if cfg.PrettyLogOutput {
			t.Error("PrettyLogOutput = true, want false (override)")
		}
	})

	t.Run("invalid duration returns error", func(t *testing.T) {
		t.Setenv("NATS_ACK_WAIT", "not-a-duration")

		if _, err := Load(); err == nil {
			t.Fatal("Load() error = nil, want error for invalid NATS_ACK_WAIT")
		}
	})
}

func TestSetupLogger(t *testing.T) {
	tests := []struct {
		name     string
		logLevel string
	}{
		{name: "valid level", logLevel: "warn"},
		{name: "invalid level falls back to info", logLevel: "not-a-level"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// SetupLogger mutates the global zerolog level/writer as a side
			// effect; assert it doesn't panic and completes for both a valid
			// and an invalid level.
			SetupLogger(Config{LogLevel: tt.logLevel, PrettyLogOutput: true})
		})
	}
}
