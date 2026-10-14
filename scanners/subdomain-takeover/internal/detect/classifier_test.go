package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/rs/zerolog"
)

func TestClassifierClassify(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}

	t.Run("emits cname and ns findings when both are exploitable", func(t *testing.T) {
		rdapMatch := true
		input := model.Input{
			DomainKey: "k1",
			Results: model.ScanResults{
				Domain:           strPtr("a.example.ca"),
				CnameRecord:      strPtr("a.example.ca. 300 IN CNAME foo.azurewebsites.net."),
				CnameTargetRcode: strPtr("NXDOMAIN"),
				RegistrarContext: &model.RegistrarContext{
					LookupSuccess:         true,
					RegistrarName:         "Namecheap",
					DelegationMatchesRDAP: &rdapMatch,
				},
				NsDelegations: &model.NsDelegations{
					Hosts: []string{"ns1.digitalocean.com"},
					Delegation: model.Delegation{
						LameType: "partial",
					},
				},
			},
		}

		classifier := NewClassifier(fakeMatcher{}, zerolog.Nop())
		findings, err := classifier.Classify(input)
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}
		if len(findings) != 2 {
			t.Fatalf("expected 2 findings, got %d", len(findings))
		}

		var sawCNAME, sawNS bool
		for _, f := range findings {
			if f.RecordType == model.RecordTypeCNAME {
				sawCNAME = true
				if f.ReasonCode != string(ReasonCNAMEDanglingNXDOMAIN) {
					t.Fatalf("unexpected cname reason: %q", f.ReasonCode)
				}
				if f.Confidence != ConfidenceProbable {
					t.Fatalf("unexpected cname confidence: %q", f.Confidence)
				}
			}
			if f.RecordType == model.RecordTypeNS {
				sawNS = true
				if f.ReasonCode != string(ReasonNSPartialLameProviderVulnerable) {
					t.Fatalf("unexpected ns reason: %q", f.ReasonCode)
				}
				if f.Confidence != ConfidenceProbable {
					t.Fatalf("unexpected ns confidence: %q", f.Confidence)
				}
			}
		}
		if !sawCNAME || !sawNS {
			t.Fatalf("missing expected finding types: cname=%v ns=%v", sawCNAME, sawNS)
		}
	})

	t.Run("suppresses non-exploitable ns matches", func(t *testing.T) {
		input := model.Input{
			DomainKey: "k2",
			Results: model.ScanResults{
				Domain:           strPtr("b.example.ca"),
				CnameRecord:      strPtr("b.example.ca. 300 IN CNAME foo.ghost.io."),
				CnameTargetRcode: strPtr("NOERROR"),
				NsDelegations: &model.NsDelegations{
					Hosts: []string{"aria.ns.cloudflare.com"},
					Delegation: model.Delegation{
						LameType: "full",
					},
				},
			},
		}

		matcher := fakeMatcher{containsFn: func(string, string, fingerprints.FingerprintMode) bool { return true }}
		classifier := NewClassifier(matcher, zerolog.Nop())
		findings, err := classifier.Classify(input)
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}

		if len(findings) != 1 {
			t.Fatalf("expected 1 finding, got %d", len(findings))
		}
		if findings[0].RecordType != model.RecordTypeCNAME {
			t.Fatalf("expected cname-only finding, got %s", findings[0].RecordType)
		}
		if findings[0].ReasonCode != string(ReasonCNAMEProviderFingerprintBodyMatch) {
			t.Fatalf("unexpected cname reason: %q", findings[0].ReasonCode)
		}
	})

	t.Run("returns no findings when evidence absent", func(t *testing.T) {
		input := model.Input{DomainKey: "k3", Results: model.ScanResults{}}
		classifier := NewClassifier(fakeMatcher{}, zerolog.Nop())
		findings, err := classifier.Classify(input)
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}
		if len(findings) != 0 {
			t.Fatalf("expected no findings, got %d", len(findings))
		}
	})

	t.Run("defaults to a no-op matcher when none is given", func(t *testing.T) {
		classifier := NewClassifier(nil, zerolog.Nop())
		input := model.Input{
			DomainKey: "k4",
			Results: model.ScanResults{
				Domain:           strPtr("c.example.ca"),
				CnameRecord:      strPtr("c.example.ca. 300 IN CNAME foo.ghost.io."),
				CnameTargetRcode: strPtr("NOERROR"),
			},
		}
		findings, err := classifier.Classify(input)
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}
		if len(findings) != 0 {
			t.Fatalf("expected body-fingerprint match to be suppressed without a matcher, got %d findings", len(findings))
		}
	})
}

func TestClassifierClassify_CNAMETargetRcode(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}

	tests := []struct {
		name         string
		rcode        *string
		wantFindings int
	}{
		{name: "NXDOMAIN with nxdomain fingerprint emits dangling finding", rcode: strPtr("NXDOMAIN"), wantFindings: 1},
		{name: "SERVFAIL emits no dangling finding", rcode: strPtr("SERVFAIL"), wantFindings: 0},
		{name: "TIMEOUT emits no dangling finding", rcode: strPtr("TIMEOUT"), wantFindings: 0},
		{name: "NOERROR emits no dangling finding", rcode: strPtr("NOERROR"), wantFindings: 0},
		{name: "null rcode emits no dangling finding", rcode: nil, wantFindings: 0},
	}

	classifier := NewClassifier(fakeMatcher{}, zerolog.Nop())
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := model.Input{
				DomainKey: "k",
				Results: model.ScanResults{
					Domain:           strPtr("a.example.ca"),
					CnameRecord:      strPtr("a.example.ca. 300 IN CNAME foo.azurewebsites.net."),
					CnameTargetRcode: tt.rcode,
				},
			}

			findings := mustNotPanic(t, func() []model.Finding {
				findings, err := classifier.Classify(input)
				if err != nil {
					t.Fatalf("Classify error: %v", err)
				}
				return findings
			})
			if len(findings) != tt.wantFindings {
				t.Fatalf("expected %d findings, got %d", tt.wantFindings, len(findings))
			}
			if tt.wantFindings == 1 && findings[0].ReasonCode != string(ReasonCNAMEDanglingNXDOMAIN) {
				t.Fatalf("unexpected reason: %q", findings[0].ReasonCode)
			}
		})
	}
}
