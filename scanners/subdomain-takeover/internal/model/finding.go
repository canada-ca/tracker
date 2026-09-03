package model

import (
	"errors"
	"time"
)

type FindingType string

const (
	FindingTypeSubdomainTakeoverCNAME FindingType = "subdomain-takeover-cname"
	FindingTypeSubdomainTakeoverNS    FindingType = "subdomain-takeover-ns"
)

type RecordType string

const (
	RecordTypeCNAME RecordType = "CNAME"
	RecordTypeNS    RecordType = "NS"
)

type Finding struct {
	Domain     string     `json:"domain"`
	DomainKey  string     `json:"domain_key"`
	RecordType RecordType `json:"record_type"`
	Target     string     `json:"target"`
	Provider   string     `json:"provider"`
	LameType   string     `json:"lame_type"`
	Confidence string     `json:"confidence"`
	ReasonCode string     `json:"reason_code"`
}

type FindingEvent struct {
	Source      string         `json:"source"`
	FindingType string         `json:"findingType"`
	DomainKey   string         `json:"domainKey"`
	Subject     string         `json:"subject"`
	Confidence  string         `json:"confidence"`
	ReasonCode  string         `json:"reasonCode,omitempty"`
	ObservedAt  string         `json:"observedAt"`
	Evidence    map[string]any `json:"evidence,omitempty"`
	Attributes  map[string]any `json:"attributes,omitempty"`
}

func NewFindingEventFromFinding(f Finding, now time.Time) (FindingEvent, error) {
	findingType, err := FindingTypeForRecord(f.RecordType)
	if err != nil {
		return FindingEvent{}, err
	}

	return FindingEvent{
		Source:      "subdomain-takeover",
		FindingType: findingType,
		DomainKey:   f.DomainKey,
		Subject:     f.Domain,
		Confidence:  f.Confidence,
		ReasonCode:  f.ReasonCode,
		ObservedAt:  now.UTC().Format(time.RFC3339),
		Evidence: map[string]any{
			"target":     f.Target,
			"recordType": f.RecordType,
		},
		Attributes: map[string]any{
			"provider": f.Provider,
			"lameType": f.LameType,
		},
	}, nil
}

func FindingTypeForRecord(recordType RecordType) (string, error) {
	switch recordType {
	case RecordTypeCNAME:
		return string(FindingTypeSubdomainTakeoverCNAME), nil
	case RecordTypeNS:
		return string(FindingTypeSubdomainTakeoverNS), nil
	default:
		return "", ErrUnsupportedRecordType
	}
}

var ErrUnsupportedRecordType = errors.New("unsupported record type")
