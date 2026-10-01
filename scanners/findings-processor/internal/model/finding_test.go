package model

import (
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestParseEvent(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		payload string
		want    FindingEvent
		wantErr bool
	}{
		{
			name:    "valid payload",
			payload: `{"source":"scanner","findingType":"tls-weak","domainKey":"abc","subject":"example.com","confidence":"high","observedAt":"2024-01-01T00:00:00Z"}`,
			want: FindingEvent{
				Source:      "scanner",
				FindingType: "tls-weak",
				DomainKey:   "abc",
				Subject:     "example.com",
				Confidence:  "high",
				ObservedAt:  "2024-01-01T00:00:00Z",
			},
		},
		{
			name:    "malformed json",
			payload: `{"source":`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got, err := ParseEvent([]byte(tt.payload))
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseEvent() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseEvent() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestFindingEvent_DeriveFindingKey(t *testing.T) {
	t.Parallel()

	base := FindingEvent{
		DomainKey:   "domain",
		Source:      "scanner",
		FindingType: "tls-weak",
		Subject:     "example.com",
		ReasonCode:  "weak-cipher",
	}

	key := base.DeriveFindingKey()
	if key == "" {
		t.Fatal("DeriveFindingKey() returned empty string")
	}
	if len(key) != 64 {
		t.Errorf("DeriveFindingKey() len = %d, want 64 (sha256 hex)", len(key))
	}

	t.Run("stable across calls", func(t *testing.T) {
		t.Parallel()
		if got := base.DeriveFindingKey(); got != key {
			t.Errorf("DeriveFindingKey() = %q, want %q", got, key)
		}
	})

	t.Run("changes when a field changes", func(t *testing.T) {
		t.Parallel()
		other := base
		other.Subject = "other.example.com"
		if got := other.DeriveFindingKey(); got == key {
			t.Error("DeriveFindingKey() did not change when Subject changed")
		}
	})
}

func TestNewFindingDocumentFromEvent(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		event   FindingEvent
		wantErr bool
	}{
		{
			name: "valid event populates document",
			event: FindingEvent{
				Source:      "scanner",
				FindingType: "tls-weak",
				DomainKey:   "abc",
				Subject:     "example.com",
				Confidence:  "high",
				Severity:    "medium",
				ReasonCode:  "weak-cipher",
				ObservedAt:  "2024-01-01T00:00:00Z",
			},
		},
		{
			name: "nil evidence and attributes become empty maps",
			event: FindingEvent{
				Source:      "scanner",
				FindingType: "tls-weak",
				DomainKey:   "abc",
				Subject:     "example.com",
				Confidence:  "high",
				ObservedAt:  "2024-01-01T00:00:00Z",
			},
		},
		{
			name: "invalid observedAt",
			event: FindingEvent{
				DomainKey:  "abc",
				ObservedAt: "not-a-timestamp",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			doc, err := NewFindingDocumentFromEvent(tt.event)
			if (err != nil) != tt.wantErr {
				t.Fatalf("NewFindingDocumentFromEvent() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}

			wantObservedAt, _ := time.Parse(time.RFC3339, tt.event.ObservedAt)
			if !doc.FirstSeen.Equal(wantObservedAt) || !doc.LastSeen.Equal(wantObservedAt) {
				t.Errorf("FirstSeen/LastSeen = %v/%v, want %v", doc.FirstSeen, doc.LastSeen, wantObservedAt)
			}
			if doc.FindingKey != tt.event.DeriveFindingKey() {
				t.Errorf("FindingKey = %q, want %q", doc.FindingKey, tt.event.DeriveFindingKey())
			}
			if doc.Domain != "domains/"+tt.event.DomainKey {
				t.Errorf("Domain = %q, want %q", doc.Domain, "domains/"+tt.event.DomainKey)
			}
			if doc.Status != "active" {
				t.Errorf("Status = %q, want %q", doc.Status, "active")
			}
			if doc.OccurrenceCount != 1 {
				t.Errorf("OccurrenceCount = %d, want 1", doc.OccurrenceCount)
			}
			if doc.Evidence == nil || doc.Attributes == nil {
				t.Error("Evidence/Attributes should never be nil")
			}
			if doc.Raw == nil {
				t.Error("Raw should be populated from the source event")
			}
		})
	}
}

func TestValidate(t *testing.T) {
	t.Parallel()

	valid := FindingEvent{
		Source:      "scanner",
		FindingType: "tls-weak",
		DomainKey:   "abc",
		Subject:     "example.com",
		Confidence:  "high",
		ObservedAt:  "2024-01-01T00:00:00Z",
	}

	tests := []struct {
		name    string
		mutate  func(e FindingEvent) FindingEvent
		wantErr bool
	}{
		{
			name:   "valid event",
			mutate: func(e FindingEvent) FindingEvent { return e },
		},
		{
			name:    "missing source",
			mutate:  func(e FindingEvent) FindingEvent { e.Source = ""; return e },
			wantErr: true,
		},
		{
			name:    "blank subject (whitespace only)",
			mutate:  func(e FindingEvent) FindingEvent { e.Subject = "   "; return e },
			wantErr: true,
		},
		{
			name:    "observedAt not RFC3339",
			mutate:  func(e FindingEvent) FindingEvent { e.ObservedAt = "2024-01-01"; return e },
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := Validate(tt.mutate(valid))
			if (err != nil) != tt.wantErr {
				t.Fatalf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if err != nil && !strings.Contains(err.Error(), "required") && !strings.Contains(err.Error(), "RFC3339") {
				t.Errorf("Validate() error message %q not descriptive", err.Error())
			}
		})
	}
}
