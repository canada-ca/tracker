//go:build integration

package runner_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/runner"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

const rootPassword = "test-password"

func startArangoDB(t *testing.T) (arangodb.Database, config.Config) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	req := testcontainers.ContainerRequest{
		Image:        "arangodb:3.11",
		ExposedPorts: []string{"8529/tcp"},
		Env:          map[string]string{"ARANGO_ROOT_PASSWORD": rootPassword},
		WaitingFor:   wait.ForListeningPort("8529/tcp").WithStartupTimeout(90 * time.Second),
	}
	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		t.Fatalf("failed to start arangodb container: %v", err)
	}
	t.Cleanup(func() {
		if err := container.Terminate(context.Background()); err != nil {
			t.Logf("failed to terminate arangodb container: %v", err)
		}
	})

	host, err := container.Host(ctx)
	if err != nil {
		t.Fatalf("failed to get container host: %v", err)
	}
	port, err := container.MappedPort(ctx, "8529")
	if err != nil {
		t.Fatalf("failed to get mapped port: %v", err)
	}

	dbName := "findings_test"
	cfg := config.Config{
		DBURL:      fmt.Sprintf("http://%s:%s", host, port.Port()),
		DBUser:     "root",
		DBPassword: rootPassword,
		DBName:     dbName,
	}

	client, err := database.CreateDBClient(cfg)
	if err != nil {
		t.Fatalf("CreateDBClient() error = %v", err)
	}

	var db arangodb.Database
	deadline := time.Now().Add(30 * time.Second)
	for {
		db, err = client.CreateDatabase(ctx, dbName, nil)
		if err == nil {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("CreateDatabase() error = %v", err)
		}
		time.Sleep(500 * time.Millisecond)
	}

	if _, err := db.CreateCollectionV2(ctx, "additionalFindings", &arangodb.CreateCollectionPropertiesV2{}); err != nil {
		t.Fatalf("CreateCollection() error = %v", err)
	}

	return db, cfg
}

func TestIntegration_HandleEvent(t *testing.T) {
	db, _ := startArangoDB(t)

	tests := []struct {
		name    string
		payload string
		want    string
	}{
		{
			name:    "valid event is acked and persisted",
			payload: `{"source":"scanner","findingType":"tls-weak","domainKey":"d1","subject":"example.com","confidence":"high","observedAt":"2024-01-01T00:00:00Z"}`,
			want:    "ack",
		},
		{
			name:    "malformed json is termed",
			payload: `not json`,
			want:    "term",
		},
		{
			name:    "missing required field is termed",
			payload: `{"source":"scanner","findingType":"tls-weak","domainKey":"d1","subject":"example.com","observedAt":"2024-01-01T00:00:00Z"}`,
			want:    "term",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			got := runner.HandleEvent(ctx, db, []byte(tt.payload))
			if got != tt.want {
				t.Errorf("HandleEvent() = %q, want %q", got, tt.want)
			}
		})
	}
}
