package detect

import "testing"

func TestMatchCNAMEFingerprints(t *testing.T) {
	fps := []CNAMEProviderFingerprint{
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
			Mode:        FingerprintModeLiteral,
		},
	}

	t.Run("returns nil when no target match", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.not-a-provider.net", NoResolve: true}
		if got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{}); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("nxdomain provider emits dangling reason when unresolved", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.azurewebsites.net", NoResolve: true}
		got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{})
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

	t.Run("nxdomain provider suppressed when resolve evidence exists", func(t *testing.T) {
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "foo.azurewebsites.net", NoResolve: false}
		got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{})
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
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "blog.ghost.io", NoResolve: false}
		matcher := fakeMatcher{containsFn: func(domain string, fingerprint string, mode FingerprintMode) bool {
			if domain != "a.example.ca" || mode != FingerprintModeLiteral {
				t.Fatalf("unexpected matcher args: domain=%q mode=%q", domain, mode)
			}
			return true
		}}
		got := MatchCNAMEFingerprints(evidence, fps, matcher)
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
		evidence := CNAMEEvidence{Domain: "a.example.ca", Target: "blog.ghost.io", NoResolve: false}
		got := MatchCNAMEFingerprints(evidence, fps, fakeMatcher{containsFn: func(string, string, FingerprintMode) bool { return false }})
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

func TestShouldEmitCNAME(t *testing.T) {
	if ShouldEmitCNAME(nil) {
		t.Fatal("expected false for nil hit")
	}
	if ShouldEmitCNAME(&CNAMEHit{Matched: false}) {
		t.Fatal("expected false for unmatched hit")
	}
	if !ShouldEmitCNAME(&CNAMEHit{Matched: true}) {
		t.Fatal("expected true for matched hit")
	}
}
