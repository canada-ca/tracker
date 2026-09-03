package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/rs/zerolog"
)

func TestMatchNSProviderRules(t *testing.T) {
	nsFP := []fingerprints.NSProviderFingerprint{
		{Name: "UnknownDNS", Status: fingerprints.NSStatusNotVulnerable, HostPatterns: []string{"*.unknown-dns.net"}},
		{Name: "Digital Ocean", Status: fingerprints.NSStatusVulnerable, HostPatterns: []string{"*.risky-dns.net"}},
	}

	namecheapRegistrar := &model.RegistrarContext{LookupSuccess: true, RegistrarName: "Namecheap"}
	digitalOceanRegistrar := &model.RegistrarContext{LookupSuccess: true, RegistrarName: "DigitalOcean, Inc."}

	t.Run("returns nil for missing hosts", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca"}
		if got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop()); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil for missing fingerprints", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca", NSHosts: []string{"ns1.risky-dns.net"}}
		if got := MatchNSProviderRules(evidence, nil, zerolog.Nop()); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when no provider matches", func(t *testing.T) {
		evidence := NSEvidence{Domain: "a.example.ca", NSHosts: []string{"ns1.nomatch.net"}}
		if got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop()); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("matches vulnerable full lame and emits correct reason", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:    "a.example.ca",
			NSHosts:   []string{"ns1.risky-dns.net"},
			Registrar: namecheapRegistrar,
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Provider != "Digital Ocean" {
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
			Domain:    "a.example.ca",
			NSHosts:   []string{"ns1.unknown-dns.net", "ns1.risky-dns.net"},
			Registrar: namecheapRegistrar,
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "partial",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Provider != "Digital Ocean" {
			t.Fatalf("expected risky provider to win ranking, got %q", got.Provider)
		}
		if got.ReasonCode != ReasonNSPartialLameProviderVulnerable {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})

	t.Run("non-vulnerable full lame is classified but not emittable", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:    "a.example.ca",
			NSHosts:   []string{"ns1.unknown-dns.net"},
			Registrar: namecheapRegistrar,
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}
		got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop())
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

	t.Run("suppresses vulnerable provider when registrar matches provider", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:    "a.example.ca",
			NSHosts:   []string{"ns1.risky-dns.net"},
			Registrar: digitalOceanRegistrar,
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}

		got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.ReasonCode != ReasonNSRegistrarProviderMatch {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
		if got.Matched {
			t.Fatal("expected matched=false when registrar and provider match")
		}
	})

	t.Run("suppresses vulnerable provider when registrar context missing", func(t *testing.T) {
		evidence := NSEvidence{
			Domain:  "a.example.ca",
			NSHosts: []string{"ns1.risky-dns.net"},
			NSDelegations: model.NsDelegations{Delegation: model.Delegation{
				LameType: "full",
			}},
		}

		got := MatchNSProviderRules(evidence, nsFP, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.ReasonCode != ReasonNSRegistrarContextInsufficient {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
		if got.Matched {
			t.Fatal("expected matched=false when registrar context is missing")
		}
	})
}

func TestShouldEmitNSHijack(t *testing.T) {
	tests := []struct {
		name string
		hit  *NSHit
		want bool
	}{
		{name: "nil hit", hit: nil, want: false},
		{name: "unmatched hit", hit: &NSHit{Matched: false}, want: false},
		{name: "matched hit", hit: &NSHit{Matched: true}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ShouldEmitNSHijack(tt.hit); got != tt.want {
				t.Fatalf("ShouldEmitNSHijack()=%v want=%v", got, tt.want)
			}
		})
	}
}
