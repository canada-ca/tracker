//go:build integration

package runner_test

import (
	"context"
	"fmt"
	"os"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/runner"
	"github.com/nats-io/nats.go"
	natscontainer "github.com/testcontainers/testcontainers-go/modules/nats"
)

func startNATS(t *testing.T) string {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	container, err := natscontainer.Run(ctx, "nats:2.11.7")
	if err != nil {
		t.Fatalf("failed to start nats container: %v", err)
	}
	t.Cleanup(func() {
		if err := container.Terminate(context.Background()); err != nil {
			t.Logf("failed to terminate nats container: %v", err)
		}
	})

	url, err := container.ConnectionString(ctx)
	if err != nil {
		t.Fatalf("failed to get nats connection string: %v", err)
	}
	return url
}

// runUntilPersistedThenStop starts runner.Run(cfg) in the background, waits
// for findingKey to show up in Arango (proving the message was consumed and
// upserted), sends SIGINT to trigger the same shutdown path Run() uses in
// production, and returns the error Run() exited with.
func runUntilPersistedThenStop(t *testing.T, cfg config.Config, db arangodb.Database, findingKey string) error {
	t.Helper()

	errCh := make(chan error, 1)
	go func() {
		errCh <- runner.Run(cfg)
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	query := "FOR f IN additionalFindings FILTER f.findingKey == @key LIMIT 1 RETURN f"
	for {
		cursor, err := db.Query(ctx, query, &arangodb.QueryOptions{
			Count:    true,
			BindVars: map[string]interface{}{"key": findingKey},
		})
		if err == nil {
			count := cursor.Count()
			cursor.Close()
			if count > 0 {
				break
			}
		}

		select {
		case <-ctx.Done():
			t.Fatalf("timed out waiting for finding %q to be persisted", findingKey)
		case <-time.After(200 * time.Millisecond):
		}
	}

	if err := syscall.Kill(os.Getpid(), syscall.SIGINT); err != nil {
		t.Fatalf("failed to send SIGINT: %v", err)
	}

	select {
	case err := <-errCh:
		return err
	case <-time.After(15 * time.Second):
		t.Fatal("runner.Run() did not return after SIGINT")
		return nil
	}
}

func TestIntegration_Run_ProcessesEventAndShutsDownCleanly(t *testing.T) {
	db, dbCfg := startArangoDB(t)
	natsURL := startNATS(t)

	nc, err := nats.Connect(natsURL)
	if err != nil {
		t.Fatalf("nats.Connect() error = %v", err)
	}
	defer nc.Close()

	js, err := nc.JetStream()
	if err != nil {
		t.Fatalf("JetStream() error = %v", err)
	}

	tests := []struct {
		name       string
		queueGroup string
	}{
		{name: "direct subscribe"},
		{name: "queue group subscribe", queueGroup: "findings-processor-workers"},
	}

	for i, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			stream := fmt.Sprintf("SCANS_%d", i)
			subject := fmt.Sprintf("scans.findings.%d", i)
			domainKey := fmt.Sprintf("domain-%d", i)

			if _, err := js.AddStream(&nats.StreamConfig{
				Name:     stream,
				Subjects: []string{subject},
			}); err != nil {
				t.Fatalf("AddStream() error = %v", err)
			}

			evt := model.FindingEvent{
				Source:      "scanner",
				FindingType: "tls-weak",
				DomainKey:   domainKey,
				Subject:     "example.com",
				Confidence:  "high",
				ObservedAt:  "2024-01-01T00:00:00Z",
			}
			payload := fmt.Sprintf(
				`{"source":%q,"findingType":%q,"domainKey":%q,"subject":%q,"confidence":%q,"observedAt":%q}`,
				evt.Source, evt.FindingType, evt.DomainKey, evt.Subject, evt.Confidence, evt.ObservedAt,
			)
			if _, err := js.Publish(subject, []byte(payload)); err != nil {
				t.Fatalf("Publish() error = %v", err)
			}

			cfg := dbCfg
			cfg.NATSURL = natsURL
			cfg.NATSStream = stream
			cfg.NATSSubject = subject
			cfg.NATSDurable = "findings-processor"
			cfg.NATSQueueGroup = tt.queueGroup
			cfg.NATSAckWait = 30 * time.Second
			cfg.NATSMaxDeliver = 5
			cfg.NATSMaxPending = 64

			if err := runUntilPersistedThenStop(t, cfg, db, evt.DeriveFindingKey()); err != nil {
				t.Errorf("runner.Run() returned error = %v, want nil (clean shutdown)", err)
			}
		})
	}

	t.Run("get database error", func(t *testing.T) {
		cfg := dbCfg
		cfg.NATSURL = natsURL
		cfg.NATSStream = "SCANS_BAD_DB"
		cfg.NATSSubject = "scans.findings.bad-db"
		cfg.NATSDurable = "findings-processor"
		cfg.DBName = "database-that-does-not-exist"

		if _, err := js.AddStream(&nats.StreamConfig{
			Name:     cfg.NATSStream,
			Subjects: []string{cfg.NATSSubject},
		}); err != nil {
			t.Fatalf("AddStream() error = %v", err)
		}

		err := runner.Run(cfg)
		if err == nil {
			t.Fatal("runner.Run() error = nil, want error for a non-existent database")
		}
		if !strings.Contains(err.Error(), "get database failed") {
			t.Errorf("runner.Run() error = %q, want it to mention the database lookup failure", err.Error())
		}
	})

	t.Run("subscribe error on stream mismatch", func(t *testing.T) {
		cfg := dbCfg
		cfg.NATSURL = natsURL
		cfg.NATSStream = "SCANS_DOES_NOT_EXIST"
		cfg.NATSSubject = "scans.findings.no-such-stream"
		cfg.NATSDurable = "findings-processor"

		err := runner.Run(cfg)
		if err == nil {
			t.Fatal("runner.Run() error = nil, want error for a subscribe against a non-existent stream")
		}
		if !strings.Contains(err.Error(), "failed to subscribe") {
			t.Errorf("runner.Run() error = %q, want it to mention the subscribe failure", err.Error())
		}
	})
}
