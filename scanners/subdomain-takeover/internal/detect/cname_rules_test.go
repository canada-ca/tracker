package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/rs/zerolog"
)

func TestMatchCNAMEFingerprints(t *testing.T) {
	fps := []fingerprints.CNAMEProviderFingerprint{
		{
			Name:        "Azure",
			Cname:       []string{"azurewebsites.net"},
			Nxdomain:    true,
			Fingerprint: "This web app is stopped",
		},
		{
			Name:        "Ghost",
			Cname:       []string{"ghost.io"},
			Nxdomain:    false,
			Fingerprint: "The thing you were looking for is no longer here",
			Mode:        fingerprints.FingerprintModeLiteral,
		},
	}

	t.Run("returns nil when no target match", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.not-a-provider.net", TargetNXDOMAIN: true}
		if got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{}, zerolog.Nop()); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("nxdomain provider emits dangling reason when target is NXDOMAIN", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.azurewebsites.net", TargetNXDOMAIN: true}
		got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{}, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if !got.Matched {
			t.Fatal("expected matched=true")
		}
		if got.ReasonCode != ReasonCNAMEDanglingNXDOMAIN {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})

	t.Run("nxdomain provider suppressed when target is not NXDOMAIN", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.azurewebsites.net", TargetNXDOMAIN: false}
		got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{}, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Matched {
			t.Fatal("expected matched=false")
		}
		if got.ReasonCode != ReasonCNAMETargetMatchMissingNXDOMAIN {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})

	t.Run("body fingerprint provider emits when matcher returns true", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "blog.ghost.io", TargetNXDOMAIN: false}
		matcher := fakeMatcher{containsFn: func(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool {
			if domain != "a.example.ca" || mode != fingerprints.FingerprintModeLiteral {
				t.Fatalf("unexpected matcher args: domain=%q mode=%q", domain, mode)
			}
			return true
		}}
		got := MatchCNAMEFingerprints(evidence, fps, matcher, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if !got.Matched {
			t.Fatal("expected matched=true")
		}
		if got.ReasonCode != ReasonCNAMEProviderFingerprintBodyMatch {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})

	t.Run("body fingerprint provider suppressed when matcher false", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "blog.ghost.io", TargetNXDOMAIN: false}
		matcher := fakeMatcher{containsFn: func(string, string, fingerprints.FingerprintMode) bool { return false }}
		got := MatchCNAMEFingerprints(evidence, fps, matcher, zerolog.Nop())
		if got == nil {
			t.Fatal("expected hit, got nil")
		}
		if got.Matched {
			t.Fatal("expected matched=false")
		}
		if got.ReasonCode != ReasonCNAMETargetMatchMissingBodyFP {
			t.Fatalf("unexpected reason: %q", got.ReasonCode)
		}
	})
}

// TestRegression_PR7582_NoResolveIsNotNXDOMAIN guards against treating an
// empty resolve_chain as proof the CNAME target is dangling. An empty chain can
// come from SERVFAIL/TIMEOUT just as easily as NXDOMAIN; only an explicit
// NXDOMAIN rcode is a takeover signal.
// See PR #7582 review comment on cname_rules.go:37.
func TestRegression_PR7582_NoResolveIsNotNXDOMAIN(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}

	results := minimalResults("a.example.ca")
	results.CnameRecord = strPtr("a.example.ca. 300 IN CNAME foo.azurewebsites.net.")
	results.CnameTargetRcode = strPtr("SERVFAIL")

	evidence := ExtractCNAMEEvidence(results)
	if evidence == nil {
		t.Fatal("expected evidence, got nil")
	}
	if evidence.TargetNXDOMAIN {
		t.Fatal("empty resolve_chain with SERVFAIL must not be treated as NXDOMAIN")
	}

	hit := MatchCNAMEFingerprints(*evidence, fingerprints.CNAME(), fakeMatcher{}, zerolog.Nop())
	if ShouldEmitCNAME(hit) {
		t.Fatalf("expected no dangling finding, got %+v", hit)
	}
}

func TestShouldEmitCNAME(t *testing.T) {
	tests := []struct {
		name string
		hit  *CNAMEHit
		want bool
	}{
		{name: "nil hit", hit: nil, want: false},
		{name: "unmatched hit", hit: &CNAMEHit{Matched: false}, want: false},
		{name: "matched hit", hit: &CNAMEHit{Matched: true}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ShouldEmitCNAME(tt.hit); got != tt.want {
				t.Fatalf("ShouldEmitCNAME()=%v want=%v", got, tt.want)
			}
		})
	}
}
