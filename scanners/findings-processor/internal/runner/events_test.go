package runner

import (
	"context"
	"errors"
	"testing"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
)

func TestHandleEvent(t *testing.T) {
	validPayload := []byte(`{"source":"dns","findingType":"SPF_MISSING","domainKey":"d1","subject":"example.ca","confidence":"high","observedAt":"2026-01-02T03:04:05Z"}`)
	originalValidate := validateEventFn
	originalUpsert := upsertFindingFn
	t.Cleanup(func() {
		validateEventFn = originalValidate
		upsertFindingFn = originalUpsert
	})

	t.Run("invalid json payload returns term", func(t *testing.T) {
		validateEventFn = func(model.FindingEvent) error {
			t.Fatal("validate should not be called")
			return nil
		}
		upsertFindingFn = func(context.Context, arangodb.Database, model.FindingEvent) error {
			t.Fatal("upsert should not be called")
			return nil
		}

		result := HandleEvent(context.Background(), nil, []byte("{"))
		if result != "term" {
			t.Fatalf("expected term, got %q", result)
		}
	})

	t.Run("validation failure returns term", func(t *testing.T) {
		validateEventFn = func(model.FindingEvent) error { return errors.New("invalid") }
		upsertFindingFn = func(context.Context, arangodb.Database, model.FindingEvent) error {
			t.Fatal("upsert should not be called")
			return nil
		}

		result := HandleEvent(context.Background(), nil, validPayload)
		if result != "term" {
			t.Fatalf("expected term, got %q", result)
		}
	})

	t.Run("upsert failure returns nak", func(t *testing.T) {
		validateEventFn = func(model.FindingEvent) error { return nil }
		upsertFindingFn = func(context.Context, arangodb.Database, model.FindingEvent) error {
			return errors.New("db failure")
		}

		result := HandleEvent(context.Background(), nil, validPayload)
		if result != "nak" {
			t.Fatalf("expected nak, got %q", result)
		}
	})

	t.Run("success returns ack", func(t *testing.T) {
		validateEventFn = func(model.FindingEvent) error { return nil }
		upsertFindingFn = func(context.Context, arangodb.Database, model.FindingEvent) error { return nil }

		result := HandleEvent(context.Background(), nil, validPayload)
		if result != "ack" {
			t.Fatalf("expected ack, got %q", result)
		}
	})
}
