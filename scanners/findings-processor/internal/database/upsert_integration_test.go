//go:build integration

package database_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

const rootPassword = "test-password"

func startArangoDB(t *testing.T) arangodb.Database {
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

	// The server takes a moment after the port opens before it accepts requests.
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

	return db
}

func TestIntegration_UpsertFinding_CreatesThenUpdates(t *testing.T) {
	db := startArangoDB(t)
	ctx := context.Background()

	evt := model.FindingEvent{
		Source:      "scanner",
		FindingType: "tls-weak",
		DomainKey:   "example-domain",
		Subject:     "example.com",
		Confidence:  "high",
		ReasonCode:  "weak-cipher",
		ObservedAt:  "2024-01-01T00:00:00Z",
	}

	if err := database.UpsertFinding(ctx, db, evt); err != nil {
		t.Fatalf("UpsertFinding() first call error = %v", err)
	}

	col, err := db.GetCollection(ctx, "additionalFindings", nil)
	if err != nil {
		t.Fatalf("GetCollection() error = %v", err)
	}

	query := "FOR f IN additionalFindings FILTER f.findingKey == @key LIMIT 1 RETURN f"
	readOne := func() model.FindingDocument {
		cursor, err := db.Query(ctx, query, &arangodb.QueryOptions{
			BindVars: map[string]interface{}{"key": evt.DeriveFindingKey()},
		})
		if err != nil {
			t.Fatalf("Query() error = %v", err)
		}
		defer cursor.Close()

		var doc model.FindingDocument
		if _, err := cursor.ReadDocument(ctx, &doc); err != nil {
			t.Fatalf("ReadDocument() error = %v", err)
		}
		return doc
	}

	first := readOne()
	if first.OccurrenceCount != 1 {
		t.Errorf("OccurrenceCount after create = %d, want 1", first.OccurrenceCount)
	}
	if first.Status != "active" {
		t.Errorf("Status after create = %q, want %q", first.Status, "active")
	}

	// Second event for the same domain/source/type/subject/reason should
	// update the existing document rather than create a new one.
	evt.ObservedAt = "2024-01-02T00:00:00Z"
	if err := database.UpsertFinding(ctx, db, evt); err != nil {
		t.Fatalf("UpsertFinding() second call error = %v", err)
	}

	second := readOne()
	if second.OccurrenceCount != 2 {
		t.Errorf("OccurrenceCount after update = %d, want 2", second.OccurrenceCount)
	}
	if second.Key != first.Key {
		t.Errorf("update created a new document: first key %q, second key %q", first.Key, second.Key)
	}
	if second.LastSeen.Format(time.RFC3339) != "2024-01-02T00:00:00Z" {
		t.Errorf("LastSeen = %v, want 2024-01-02T00:00:00Z", second.LastSeen)
	}

	count, err := col.Count(ctx)
	if err != nil {
		t.Fatalf("Count() error = %v", err)
	}
	if count != 1 {
		t.Errorf("collection document count = %d, want 1 (update, not duplicate insert)", count)
	}
}

func TestIntegration_UpsertFinding_MissingCollectionReturnsError(t *testing.T) {
	db := startArangoDB(t)
	ctx := context.Background()

	// Drop the collection UpsertFinding expects, to exercise the error path.
	col, err := db.GetCollection(ctx, "additionalFindings", nil)
	if err != nil {
		t.Fatalf("GetCollection() error = %v", err)
	}
	if err := col.Remove(ctx); err != nil {
		t.Fatalf("Remove() error = %v", err)
	}

	err = database.UpsertFinding(ctx, db, model.FindingEvent{
		DomainKey:   "d",
		Source:      "s",
		FindingType: "t",
		Subject:     "sub",
		ObservedAt:  "2024-01-01T00:00:00Z",
	})
	if err == nil {
		t.Fatal("UpsertFinding() error = nil, want error for missing collection")
	}
}

func TestIntegration_UpsertFinding_InvalidObservedAtReturnsError(t *testing.T) {
	db := startArangoDB(t)
	ctx := context.Background()

	// No existing document for this key, so UpsertFinding takes the create
	// path, where NewFindingDocumentFromEvent fails to parse ObservedAt.
	err := database.UpsertFinding(ctx, db, model.FindingEvent{
		DomainKey:   "d",
		Source:      "s",
		FindingType: "t",
		Subject:     "sub",
		ObservedAt:  "not-a-timestamp",
	})
	if err == nil {
		t.Fatal("UpsertFinding() error = nil, want error for an unparsable ObservedAt")
	}
}
