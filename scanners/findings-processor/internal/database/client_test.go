package database

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

func TestCreateDBClient(t *testing.T) {
	t.Parallel()

	// CreateDBClient only builds the client/auth wiring; it doesn't dial the
	// server, so this exercises the real construction path without a live
	// ArangoDB instance.
	client, err := CreateDBClient(config.Config{
		DBURL:      "http://localhost:8529",
		DBUser:     "root",
		DBPassword: "secret",
	})
	if err != nil {
		t.Fatalf("CreateDBClient() error = %v", err)
	}
	if client == nil {
		t.Fatal("CreateDBClient() returned nil client")
	}
}
