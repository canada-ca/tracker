package model

import (
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

func ParseEvent(payload []byte) (FindingEvent, error) {
	var event FindingEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return FindingEvent{}, err
	}

	return event, nil
}

type FindingEvent struct {
	Source      string         `json:"source"`
	FindingType string         `json:"findingType"`
	DomainKey   string         `json:"domainKey"`
	Subject     string         `json:"subject"`
	Confidence  string         `json:"confidence"`
	Severity    string         `json:"severity,omitempty"`
	ReasonCode  string         `json:"reasonCode,omitempty"`
	ObservedAt  string         `json:"observedAt"`
	Evidence    map[string]any `json:"evidence,omitempty"`
	Attributes  map[string]any `json:"attributes,omitempty"`
}

type FindingDocument struct {
	Key             string         `json:"_key"`
	Source          string         `json:"source"`
	FindingType     string         `json:"findingType"`
	DomainKey       string         `json:"domainKey"`
	Subject         string         `json:"subject"`
	Confidence      string         `json:"confidence"`
	Severity        string         `json:"severity,omitempty"`
	ReasonCode      string         `json:"reasonCode,omitempty"`
	FirstSeen       time.Time      `json:"firstSeen"`
	LastSeen        time.Time      `json:"lastSeen"`
	Evidence        map[string]any `json:"evidence,omitempty"`
	Attributes      map[string]any `json:"attributes,omitempty"`
	OccurrenceCount int            `json:"occurrenceCount"`
	Raw             map[string]any `json:"raw"`
	Status          string         `json:"status"`
}

func (e FindingEvent) GetKey() string {
	// domainKey + source + findingType + subject + reasonCode
	keyArgs := []string{e.DomainKey, e.Source, e.FindingType, e.Subject, e.ReasonCode}
	data := strings.Join(keyArgs, "_")
	return b64.StdEncoding.EncodeToString([]byte(data))
}

func NewFindingDocumentFromEvent(e FindingEvent) (FindingDocument, error) {
	observedAt, err := time.Parse(time.RFC3339, e.ObservedAt)
	if err != nil {
		return FindingDocument{}, err
	}

	return FindingDocument{
		Key:             e.GetKey(),
		DomainKey:       e.DomainKey,
		Source:          e.Source,
		FindingType:     e.FindingType,
		Subject:         e.Subject,
		Status:          "active",
		Confidence:      e.Confidence,
		Severity:        e.Severity,
		ReasonCode:      e.ReasonCode,
		FirstSeen:       observedAt,
		LastSeen:        observedAt,
		OccurrenceCount: 1,
		Evidence:        nonNilMap(e.Evidence),
		Attributes:      nonNilMap(e.Attributes),
		Raw:             toMap(e),
	}, nil
}

func nonNilMap(m map[string]any) map[string]any {
	if m == nil {
		return map[string]any{}
	}
	return m
}

func toMap(v any) map[string]any {
	b, _ := json.Marshal(v)
	out := map[string]any{}
	_ = json.Unmarshal(b, &out)
	return out
}

func Validate(e FindingEvent) error {
	required := []string{
		e.Source, e.FindingType,
		e.DomainKey, e.Subject, e.Confidence, e.ObservedAt,
	}
	for _, v := range required {
		if strings.TrimSpace(v) == "" {
			return errors.New("missing required fields")
		}
	}
	if _, err := time.Parse(time.RFC3339, e.ObservedAt); err != nil {
		return errors.New("observedAt must be RFC3339")
	}
	return nil
}
