package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func TestMatchNSProviderRules(t *testing.T) {
	nsFP := []fingerprints.NSProviderFingerprint{
		{Name: "UnknownDNS", Status: fingerprints.NSStatusNotVulnerable, HostPatterns: []string{"*.unknown-dns.net"}},
		{Name: "RiskyDNS", Status: fingerprints.NSStatusVulnerable, HostPatterns: []string{"*.risky-dns.net"}},
	}

	t.Run("returns nil for missing hosts", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca"}
		if got := MatchNSProviderRules(evidence, nsFP); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil for missing fingerprints", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca", NSHosts: []string{"ns1.risky-dns.net"}}
		if got := MatchNSProviderRules(evidence, nil); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when no provider matches", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca", NSHosts: []string{"ns1.nomatch.net"}}
		if got := MatchNSProviderRules(evidence, nsFP); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("matches vulnerable full lame and emits correct reason", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:  "a.example.ca",
			NSHosts: []string{"ns1.risky-dns.net"},
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP)
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Provider != "RiskyDNS" {
			t.Fatalf("unexpected provider: %q", got.Provider)
		}
		if got.ReasonCode != ReasonNSFullLameProviderVulnerable {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
		if !got.Matched {
			t.Fatal("expected matched=true")
		}
	})

	t.Run("ranks vulnerable higher than unknown", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:  "a.example.ca",
			NSHosts: []string{"ns1.unknown-dns.net", "ns1.risky-dns.net"},
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "partial",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP)
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Provider != "RiskyDNS" {
			t.Fatalf("expected risky provider to win ranking, got %q", got.Provider)
		}
		if got.ReasonCode != ReasonNSPartialLameProviderVulnerable {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})

	t.Run("non-vulnerable full lame is classified but not emittable", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:  "a.example.ca",
			NSHosts: []string{"ns1.unknown-dns.net"},
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP)
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.ReasonCode != ReasonNSLameProviderUnknown {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
		if got.Matched {
			t.Fatal("expected matched=false for non-vulnerable state")
		}
	})
}

func TestShouldEmitNSHijack(t *testing.T) {
	if ShouldEmitNSHijack(nil) {
		t.Fatal("expected false for nil hit")
	}
	if ShouldEmitNSHijack(&NSHit{Matched: false}) {
		t.Fatal("expected false for unmatched hit")
	}
	if !ShouldEmitNSHijack(&NSHit{Matched: true}) {
		t.Fatal("expected true for matched hit")
	}
}
