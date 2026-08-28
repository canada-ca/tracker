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
	t.Run("isExploitableProviderStatus", func(t *testing.T) {
		tests := []struct {
			name   string
			status fingerprints.NSProviderStatus
			want   bool
		}{
			{name: "vulnerable", status: fingerprints.NSStatusVulnerable, want: true},
			{name: "vulnerable with purchase", status: fingerprints.NSStatusVulnerableWithPurchase, want: true},
			{name: "not vulnerable", status: fingerprints.NSStatusNotVulnerable, want: false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := isExploitableProviderStatus(tt.status); got != tt.want {
					t.Fatalf("isExploitableProviderStatus(%q)=%v want=%v", tt.status, got, tt.want)
				}
			})
		}
	})

	t.Run("normalizeLameType", func(t *testing.T) {
		if got := normalizeLameType(" Partial "); got != "partial" {
			t.Fatalf("normalizeLameType mismatch: %q", got)
		}
	})

	t.Run("isRegistrarMismatch", func(t *testing.T) {
		tests := []struct {
			name      string
			provider  string
			registrar *model.RegistrarContext
			want      bool
		}{
			{
				name:      "different providers",
				provider:  "Digital Ocean",
				registrar: &model.RegistrarContext{LookupSuccess: true, RegistrarName: "Namecheap"},
				want:      true,
			},
			{
				name:      "same provider",
				provider:  "Digital Ocean",
				registrar: &model.RegistrarContext{LookupSuccess: true, RegistrarName: "DigitalOcean, Inc."},
				want:      false,
			},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := isRegistrarMismatch(tt.provider, tt.registrar); got != tt.want {
					t.Fatalf("isRegistrarMismatch()=%v want=%v", got, tt.want)
				}
			})
		}
	})

	t.Run("nsReasonRank ordering", func(t *testing.T) {
		checks := []struct {
			name  string
			high  ReasonCode
			low   ReasonCode
			label string
		}{
			{name: "full above partial", high: ReasonNSFullLameProviderVulnerable, low: ReasonNSPartialLameProviderVulnerable, label: "full lame > partial lame"},
			{name: "partial above registrar-provider-match", high: ReasonNSPartialLameProviderVulnerable, low: ReasonNSRegistrarProviderMatch, label: "partial lame > registrar-provider-match"},
			{name: "registrar gate above provider only", high: ReasonNSRegistrarProviderMatch, low: ReasonNSProviderMatchOnly, label: "registrar gate > provider-only"},
		}

		for _, check := range checks {
			t.Run(check.name, func(t *testing.T) {
				if nsReasonRank(check.high) <= nsReasonRank(check.low) {
					t.Fatalf("expected %s", check.label)
				}
			})
		}
	})
}
