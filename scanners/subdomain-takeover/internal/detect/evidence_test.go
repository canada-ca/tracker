package detect

import (
	"reflect"
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func TestExtractCNAMEEvidence(t *testing.T) {
	nilCases := []struct {
		name    string
		results model.ScanResults
	}{
		{name: "returns nil when cname record missing", results: minimalResults("app.example.ca")},
		{
			name: "returns nil when domain missing",
			results: func() model.ScanResults {
				record := "a.example.ca. 300 IN CNAME foo.azurewebsites.net."
				return model.ScanResults{CnameRecord: &record}
			}(),
		},
	}

	for _, tt := range nilCases {
		t.Run(tt.name, func(t *testing.T) {
			if got := ExtractCNAMEEvidence(tt.results); got != nil {
				t.Fatalf("expected nil, got %+v", got)
			}
		})
	}

	t.Run("extracts normalized target and noresolve true", func(t *testing.T) {
		record := "A.Example.CA. 300 IN CNAME Foo.AzureWebsites.NET."
		results := minimalResults("app.example.ca")
		results.CnameRecord = &record

		got := ExtractCNAMEEvidence(results)
		if got == nil {
			t.Fatal("expected evidence, got nil")
		}

		if got.Domain != "app.example.ca" {
			t.Fatalf("unexpected domain: %q", got.Domain)
		}
		if got.Target != "foo.azurewebsites.net" {
			t.Fatalf("unexpected target: %q", got.Target)
		}
		if !got.NoResolve {
			t.Fatal("expected NoResolve=true")
		}
	})

	t.Run("sets noresolve false when resolve chain present", func(t *testing.T) {
		record := "a.example.ca. 300 IN CNAME foo.azurewebsites.net."
		results := minimalResults("app.example.ca")
		results.CnameRecord = &record
		results.ResolveChain = [][]string{{"a.example.ca CNAME foo.azurewebsites.net"}}

		got := ExtractCNAMEEvidence(results)
		if got == nil {
			t.Fatal("expected evidence, got nil")
		}
		if got.NoResolve {
			t.Fatal("expected NoResolve=false")
		}
	})
}

func TestExtractNSEvidence(t *testing.T) {
	nilCases := []struct {
		name  string
		input model.ScanResults
	}{
		{name: "returns nil when domain missing", input: model.ScanResults{NsDelegations: &model.NsDelegations{Hosts: []string{"ns1.example.net"}}}},
		{name: "returns nil when ns delegations missing", input: minimalResults("app.example.ca")},
		{
			name: "returns nil when no hosts",
			input: func() model.ScanResults {
				input := minimalResults("app.example.ca")
				input.NsDelegations = &model.NsDelegations{}
				return input
			}(),
		},
	}

	for _, tt := range nilCases {
		t.Run(tt.name, func(t *testing.T) {
			if got := ExtractNSEvidence(tt.input); got != nil {
				t.Fatalf("expected nil, got %+v", got)
			}
		})
	}

	t.Run("normalizes, sorts, and deduplicates hosts", func(t *testing.T) {
		input := minimalResults("app.example.ca")
		input.NsDelegations = &model.NsDelegations{
			Hosts: []string{"NS2.Example.Net.", "ns1.example.net", "ns2.example.net", ".ns1.example.net."},
			Delegation: model.Delegation{
				LameType: "partial",
			},
		}

		got := ExtractNSEvidence(input)
		if got == nil {
			t.Fatal("expected evidence, got nil")
		}

		expectedHosts := []string{"ns1.example.net", "ns2.example.net"}
		if !reflect.DeepEqual(got.NSHosts, expectedHosts) {
			t.Fatalf("unexpected hosts: got=%v want=%v", got.NSHosts, expectedHosts)
		}
		if got.Domain != "app.example.ca" {
			t.Fatalf("unexpected domain: %q", got.Domain)
		}
		if got.NSDelegations.Delegation.LameType != "partial" {
			t.Fatalf("unexpected lame type: %q", got.NSDelegations.Delegation.LameType)
		}
	})
}

func TestNormalizeHostAndParseHelpers(t *testing.T) {
	t.Run("normalizeHost trims dots and lowercases", func(t *testing.T) {
		if got := normalizeHost(".NS1.Example.NET."); got != "ns1.example.net" {
			t.Fatalf("normalizeHost mismatch: %q", got)
		}
	})

	t.Run("parseCname extracts normalized target", func(t *testing.T) {
		record := "x.example.ca. 300 IN CNAME target.provider.net."
		if got := parseCname(record); got != "target.provider.net" {
			t.Fatalf("parseCname mismatch: %q", got)
		}
	})

	t.Run("parseHostnames sorts and deduplicates", func(t *testing.T) {
		hosts := []string{"ns3.example.net", "NS1.example.net.", "ns1.example.net", "ns2.example.net"}
		expected := []string{"ns1.example.net", "ns2.example.net", "ns3.example.net"}
		if got := parseHostnames(hosts); !reflect.DeepEqual(got, expected) {
			t.Fatalf("parseHostnames mismatch: got=%v want=%v", got, expected)
		}
	})
}
