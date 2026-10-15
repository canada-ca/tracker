package config

import (
	"os"
	"path/filepath"
	"testing"
)

// Load() calls godotenv.Load(), which reads .env from the working directory.
// Each test chdirs into a fresh temp dir so no stray .env leaks in.
// t.Chdir/t.Setenv preclude t.Parallel.

func writeDotEnv(t *testing.T, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(".", ".env"), []byte(content), 0o600); err != nil {
		t.Fatalf("write .env: %v", err)
	}
}

func TestLoad_MissingDotEnvUsesDefaults(t *testing.T) {
	t.Chdir(t.TempDir())

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.NATSURL != "nats://localhost:4222" {
		t.Errorf("NATSURL = %q, want default", cfg.NATSURL)
	}
	if cfg.WorkerCount != 5 {
		t.Errorf("WorkerCount = %d, want 5", cfg.WorkerCount)
	}
}

func TestLoad_DotEnvSetsValue(t *testing.T) {
	t.Chdir(t.TempDir())
	// Register cleanup so the var godotenv sets doesn't leak to other tests.
	t.Setenv("WORKER_COUNT", "")
	os.Unsetenv("WORKER_COUNT")
	writeDotEnv(t, "WORKER_COUNT=9\n")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.WorkerCount != 9 {
		t.Errorf("WorkerCount = %d, want 9 from .env", cfg.WorkerCount)
	}
}

func TestLoad_EnvVarOverridesDotEnv(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("WORKER_COUNT", "3")
	writeDotEnv(t, "WORKER_COUNT=9\n")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.WorkerCount != 3 {
		t.Errorf("WorkerCount = %d, want 3 from environment", cfg.WorkerCount)
	}
}

func TestLoad_MalformedDotEnvReturnsError(t *testing.T) {
	t.Chdir(t.TempDir())
	writeDotEnv(t, "NOT A VALID LINE\n")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error for malformed .env")
	}
}
