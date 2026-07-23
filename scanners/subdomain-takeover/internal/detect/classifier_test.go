package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/rs/zerolog"
)

func TestClassify_ExpectedBehavior(t *testing.T) {
	cnameFPs := []fingerprints.CNAMEProviderFingerprint{
		{Name: "Azure", Cname: []string{"azurewebsites.net"}, Nxdomain: true, Fingerprint: "unused"},
		{Name: "Ghost", Cname: []string{"ghost.io"}, Nxdomain: false, Fingerprint: "ghost 404", Mode: fingerprints.FingerprintModeLiteral},
	}
	nsFPs := []fingerprints.NSProviderFingerprint{
		{Name: "RiskyDNS", Status: fingerprints.NSStatusVulnerable, HostPatterns: []string{"*.risky-dns.net"}},
		{Name: "SafeDNS", Status: fingerprints.NSStatusNotVulnerable, HostPatterns: []string{"*.safe-dns.net"}},
	}

	source := fakeSource{cname: cnameFPs, ns: nsFPs}

	t.Run("emits cname and ns findings when both are exploitable", func(t *testing.T) {
		input := model.Input{
			DomainKey: "k1",
			Results: model.ScanResults{
				Domain:      strPtr("a.example.ca"),
				CnameRecord: strPtr("a.example.ca. 300 IN CNAME foo.azurewebsites.net."),
				NsDelegations: &model.NsDelegations{
					Hosts: []string{"ns1.risky-dns.net"},
					Delegation: model.Delegation{
						LameType: "partial",
					},
				},
			},
		}

		findings, err := Classify(input, fakeMatcher{}, source, zerolog.Nop())
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
			}
			if f.RecordType == model.RecordTypeNS {
				sawNS = true
				if f.ReasonCode != string(ReasonNSPartialLameProviderVulnerable) {
					t.Fatalf("unexpected ns reason: %q", f.ReasonCode)
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
				Domain:      strPtr("b.example.ca"),
				CnameRecord: strPtr("b.example.ca. 300 IN CNAME foo.ghost.io."),
				NsDelegations: &model.NsDelegations{
					Hosts: []string{"ns1.safe-dns.net"},
					Delegation: model.Delegation{
						LameType: "full",
					},
				},
			},
		}

		matcher := fakeMatcher{containsFn: func(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool {
			return true
		}}

		findings, err := Classify(input, matcher, source, zerolog.Nop())
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}

		if len(findings) != 1 {
			t.Fatalf("expected 1 finding, got %d", len(findings))
		}
		if findings[0].RecordType != model.RecordTypeCNAME {
			t.Fatalf("expected cname-only finding, got %s", findings[0].RecordType)
		}
	})

	t.Run("returns no findings and no panic when evidence absent", func(t *testing.T) {
		input := model.Input{DomainKey: "k3", Results: model.ScanResults{}}
		findings, err := Classify(input, fakeMatcher{}, source, zerolog.Nop())
		if err != nil {
			t.Fatalf("Classify error: %v", err)
		}
		if len(findings) != 0 {
			t.Fatalf("expected no findings, got %d", len(findings))
		}
	})
}

func TestClassifier_MethodDefaults(t *testing.T) {
	classifier := NewClassifier(nil)
	if classifier == nil {
		t.Fatal("expected classifier")
	}

	input := model.Input{DomainKey: "k", Results: model.ScanResults{}}
	findings, err := classifier.Classify(input)
	if err != nil {
		t.Fatalf("Classify error: %v", err)
	}
	if len(findings) != 0 {
		t.Fatalf("expected no findings, got %d", len(findings))
	}

	custom := NewClassifierWithSource(fakeMatcher{}, fakeSource{})
	if custom == nil {
		t.Fatal("expected classifier with source")
	}

	if custom.WithLogger(zerolog.Nop()) != custom {
		t.Fatal("WithLogger should return same classifier pointer")
	}
}
