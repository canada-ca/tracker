package database

import (
	"context"
	"errors"
	"testing"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
)

func sampleEvent() model.FindingEvent {
	return model.FindingEvent{
		DomainKey:   "d",
		Source:      "s",
		FindingType: "t",
		Subject:     "sub",
		Confidence:  "high",
		ObservedAt:  "2026-01-02T03:04:05Z",
	}
}

func stubUpsertFunctions(t *testing.T) {
	t.Helper()

	getCollection = func(context.Context, arangodb.Database, string) (arangodb.Collection, error) {
		return nil, nil
	}
	documentExists = func(context.Context, arangodb.Collection, string) (bool, error) {
		return false, nil
	}
	readFindingDocument = func(context.Context, arangodb.Collection, string, *model.FindingDocument) error {
		return nil
	}
	updateFindingDocument = func(context.Context, arangodb.Collection, string, findingUpdatePatch) error {
		return nil
	}
	createFindingDocument = func(context.Context, arangodb.Collection, model.FindingDocument) error {
		return nil
	}
	newDocumentFromEvent = model.NewFindingDocumentFromEvent
}

func TestUpsertFinding(t *testing.T) {
	originalGetCollection := getCollection
	originalDocumentExists := documentExists
	originalReadDocument := readFindingDocument
	originalUpdateDocument := updateFindingDocument
	originalCreateDocument := createFindingDocument
	originalNewDocumentFromEvent := newDocumentFromEvent
	t.Cleanup(func() {
		getCollection = originalGetCollection
		documentExists = originalDocumentExists
		readFindingDocument = originalReadDocument
		updateFindingDocument = originalUpdateDocument
		createFindingDocument = originalCreateDocument
		newDocumentFromEvent = originalNewDocumentFromEvent
	})

	evt := sampleEvent()

	t.Run("collection lookup fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		errWant := errors.New("collection error")
		getCollection = func(context.Context, arangodb.Database, string) (arangodb.Collection, error) {
			return nil, errWant
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if !errors.Is(err, errWant) {
			t.Fatalf("expected collection error, got %v", err)
		}
	})

	t.Run("exists check fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		documentExists = func(context.Context, arangodb.Collection, string) (bool, error) {
			return false, errors.New("exists error")
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err == nil || err.Error() != "exists error" {
			t.Fatalf("expected exists error, got %v", err)
		}
	})

	t.Run("read existing fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		documentExists = func(context.Context, arangodb.Collection, string) (bool, error) {
			return true, nil
		}
		readFindingDocument = func(context.Context, arangodb.Collection, string, *model.FindingDocument) error {
			return errors.New("read error")
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err == nil || err.Error() != "read error" {
			t.Fatalf("expected read error, got %v", err)
		}
	})

	t.Run("update existing fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		documentExists = func(context.Context, arangodb.Collection, string) (bool, error) {
			return true, nil
		}
		readFindingDocument = func(_ context.Context, _ arangodb.Collection, _ string, doc *model.FindingDocument) error {
			doc.OccurrenceCount = 3
			return nil
		}
		updateFindingDocument = func(context.Context, arangodb.Collection, string, findingUpdatePatch) error {
			return errors.New("update error")
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err == nil || err.Error() != "update error" {
			t.Fatalf("expected update error, got %v", err)
		}
	})

	t.Run("event conversion fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		newDocumentFromEvent = func(model.FindingEvent) (model.FindingDocument, error) {
			return model.FindingDocument{}, errors.New("new doc error")
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err == nil || err.Error() != "new doc error" {
			t.Fatalf("expected new doc error, got %v", err)
		}
	})

	t.Run("new document creation fails", func(t *testing.T) {
		stubUpsertFunctions(t)
		createFindingDocument = func(context.Context, arangodb.Collection, model.FindingDocument) error {
			return errors.New("create error")
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err == nil || err.Error() != "create error" {
			t.Fatalf("expected create error, got %v", err)
		}
	})

	t.Run("update path applies expected patch", func(t *testing.T) {
		stubUpsertFunctions(t)
		documentExists = func(context.Context, arangodb.Collection, string) (bool, error) {
			return true, nil
		}
		readFindingDocument = func(_ context.Context, _ arangodb.Collection, _ string, doc *model.FindingDocument) error {
			doc.OccurrenceCount = 10
			return nil
		}

		var capturedPatch findingUpdatePatch
		var capturedKey string
		updateFindingDocument = func(_ context.Context, _ arangodb.Collection, key string, patch findingUpdatePatch) error {
			capturedKey = key
			capturedPatch = patch
			return nil
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if capturedPatch.OccurenceCount != 11 {
			t.Fatalf("expected occurrence increment to 11, got %v", capturedPatch.OccurenceCount)
		}
		if capturedPatch.LastSeen != evt.ObservedAt {
			t.Fatalf("unexpected lastSeen value: %v", capturedPatch.LastSeen)
		}
		if capturedKey != evt.GetKey() {
			t.Fatalf("update key mismatch: got %q want %q", capturedKey, evt.GetKey())
		}
	})

	t.Run("create path creates expected document", func(t *testing.T) {
		stubUpsertFunctions(t)

		var createdDoc model.FindingDocument
		createFindingDocument = func(_ context.Context, _ arangodb.Collection, doc model.FindingDocument) error {
			createdDoc = doc
			return nil
		}

		err := UpsertFinding(context.Background(), nil, evt)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if createdDoc.Key != evt.GetKey() {
			t.Fatalf("created document key mismatch: got %q want %q", createdDoc.Key, evt.GetKey())
		}
	})
}
