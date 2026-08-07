package model

import (
	"encoding/base64"
	"testing"
	"time"
)

func TestParseEvent(t *testing.T) {
	t.Run("valid payload", func(t *testing.T) {
		payload := []byte(`{"source":"dns","findingType":"SPF_MISSING","domainKey":"d1","subject":"example.ca","confidence":"high","observedAt":"2026-01-02T03:04:05Z"}`)

		evt, err := ParseEvent(payload)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if evt.Source != "dns" || evt.Subject != "example.ca" {
			t.Fatalf("unexpected parsed event: %+v", evt)
		}
	})

	t.Run("invalid json", func(t *testing.T) {
		_, err := ParseEvent([]byte("{"))
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

func validEvent() FindingEvent {
	return FindingEvent{
		Source:      "dns-processor",
		FindingType: "SPF_MISSING",
		DomainKey:   "domain-123",
		Subject:     "example.ca",
		Confidence:  "high",
		Severity:    "medium",
		ReasonCode:  "spf_missing",
		ObservedAt:  "2026-01-02T03:04:05Z",
		Evidence: map[string]any{
			"record": "v=spf1 -all",
		},
		Attributes: map[string]any{
			"scanner": "dns",
		},
	}
}

func TestGetKey(t *testing.T) {
	evt := validEvent()

	got := evt.GetKey()
	want := base64.StdEncoding.EncodeToString([]byte("domain-123_dns-processor_SPF_MISSING_example.ca_spf_missing"))

	if got != want {
		t.Fatalf("unexpected key: got %q want %q", got, want)
	}
}

func TestNewFindingDocumentFromEvent(t *testing.T) {
	evt := validEvent()

	doc, err := NewFindingDocumentFromEvent(evt)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if doc.Key != evt.GetKey() {
		t.Fatalf("unexpected key: got %q want %q", doc.Key, evt.GetKey())
	}
	if doc.Status != "active" {
		t.Fatalf("unexpected status: got %q", doc.Status)
	}
	if doc.OccurrenceCount != 1 {
		t.Fatalf("unexpected occurrence count: got %d", doc.OccurrenceCount)
	}
	if !doc.FirstSeen.Equal(doc.LastSeen) {
		t.Fatalf("firstSeen and lastSeen should match")
	}
	if doc.FirstSeen.Format(time.RFC3339) != evt.ObservedAt {
		t.Fatalf("unexpected firstSeen timestamp: got %q want %q", doc.FirstSeen.Format(time.RFC3339), evt.ObservedAt)
	}
	if doc.Raw["source"] != evt.Source {
		t.Fatalf("raw payload missing source field")
	}
}

func TestNewFindingDocumentFromEventNilMaps(t *testing.T) {
	evt := validEvent()
	evt.Evidence = nil
	evt.Attributes = nil

	doc, err := NewFindingDocumentFromEvent(evt)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if doc.Evidence == nil || len(doc.Evidence) != 0 {
		t.Fatalf("evidence should be an empty map")
	}
	if doc.Attributes == nil || len(doc.Attributes) != 0 {
		t.Fatalf("attributes should be an empty map")
	}
}

func TestNewFindingDocumentFromEventInvalidObservedAt(t *testing.T) {
	evt := validEvent()
	evt.ObservedAt = "not-a-timestamp"

	_, err := NewFindingDocumentFromEvent(evt)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestValidate(t *testing.T) {
	t.Run("valid event", func(t *testing.T) {
		err := Validate(validEvent())
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
	})

	t.Run("missing required field", func(t *testing.T) {
		evt := validEvent()
		evt.Source = "  "

		err := Validate(evt)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if err.Error() != "missing required fields" {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("invalid observedAt", func(t *testing.T) {
		evt := validEvent()
		evt.ObservedAt = "2026-99-99"

		err := Validate(evt)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if err.Error() != "observedAt must be RFC3339" {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
