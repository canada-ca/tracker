package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func TestGetNSHijackReasonCode(t *testing.T) {
	namecheapRegistrar := &model.RegistrarContext{LookupSuccess: true, RegistrarName: "Namecheap"}
	digitalOceanRegistrar := &model.RegistrarContext{LookupSuccess: true, RegistrarName: "DigitalOcean, Inc."}
	invalidRegistrar := &model.RegistrarContext{LookupSuccess: false, RegistrarName: "Namecheap"}

	tests := []struct {
		name      string
		lameType  string
		provider  fingerprints.NSProviderFingerprint
		registrar *model.RegistrarContext
		want      ReasonCode
	}{
		{
			name:      "full vulnerable with registrar mismatch",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: namecheapRegistrar,
			want:      ReasonNSFullLameProviderVulnerable,
		},
		{
			name:      "partial vulnerable with registrar mismatch",
			lameType:  "partial",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: namecheapRegistrar,
			want:      ReasonNSPartialLameProviderVulnerable,
		},
		{
			name:      "full vulnerable with purchase and mismatch",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerableWithPurchase},
			registrar: namecheapRegistrar,
			want:      ReasonNSFullLameProviderVulnerable,
		},
		{
			name:      "full non vulnerable",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusNotVulnerable},
			registrar: namecheapRegistrar,
			want:      ReasonNSLameProviderUnknown,
		},
		{
			name:      "unknown lame type",
			lameType:  "none",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: namecheapRegistrar,
			want:      ReasonNSProviderMatchOnly,
		},
		{
			name:      "same registrar/provider suppressed",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: digitalOceanRegistrar,
			want:      ReasonNSRegistrarProviderMatch,
		},
		{
			name:      "missing registrar context suppressed",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: nil,
			want:      ReasonNSRegistrarContextInsufficient,
		},
		{
			name:      "invalid registrar context suppressed",
			lameType:  "full",
			provider:  fingerprints.NSProviderFingerprint{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable},
			registrar: invalidRegistrar,
			want:      ReasonNSRegistrarContextInsufficient,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getNSHijackReasonCode(tt.lameType, tt.provider, tt.registrar)
			if got != tt.want {
				t.Fatalf("getNSHijackReasonCode()=%q want=%q", got, tt.want)
			}
		})
	}
}

func TestNSReasoningHelpers(t *testing.T) {
	if !isExploitableProviderStatus(fingerprints.NSStatusVulnerable) {
		t.Fatal("expected vulnerable to be exploitable")
	}
	if !isExploitableProviderStatus(fingerprints.NSStatusVulnerableWithPurchase) {
		t.Fatal("expected vulnerable_with_purchase to be exploitable")
	}
	if isExploitableProviderStatus(fingerprints.NSStatusNotVulnerable) {
		t.Fatal("expected not_vulnerable to be non-exploitable")
	}

	if got := normalizeLameType(" Partial "); got != "partial" {
		t.Fatalf("normalizeLameType mismatch: %q", got)
	}

	if !isRegistrarMismatch("Digital Ocean", &model.RegistrarContext{LookupSuccess: true, RegistrarName: "Namecheap"}) {
		t.Fatal("expected registrar mismatch for different providers")
	}
	if isRegistrarMismatch("Digital Ocean", &model.RegistrarContext{LookupSuccess: true, RegistrarName: "DigitalOcean, Inc."}) {
		t.Fatal("expected same provider to fail mismatch check")
	}

	if nsReasonRank(ReasonNSFullLameProviderVulnerable) <= nsReasonRank(ReasonNSPartialLameProviderVulnerable) {
		t.Fatal("expected full lame rank > partial lame rank")
	}
	if nsReasonRank(ReasonNSPartialLameProviderVulnerable) <= nsReasonRank(ReasonNSRegistrarProviderMatch) {
		t.Fatal("expected partial lame rank > registrar-provider-match rank")
	}
	if nsReasonRank(ReasonNSRegistrarProviderMatch) <= nsReasonRank(ReasonNSProviderMatchOnly) {
		t.Fatal("expected registrar gate rank > provider-only rank")
	}
}
