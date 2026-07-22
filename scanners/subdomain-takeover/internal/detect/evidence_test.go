package detect

import (
	"reflect"
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func TestExtractCNAMEEvidence(t *testing.T) {
	t.Run("returns nil when cname record missing", func(t *testing.T) {
		results := minimalResults("app.example.ca")
		if got := ExtractCNAMEEvidence(results); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when domain missing", func(t *testing.T) {
		record := "a.example.ca. 300 IN CNAME foo.azurewebsites.net."
		results := model.ScanResults{CnameRecord: &record}
		if got := ExtractCNAMEEvidence(results); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

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
	t.Run("returns nil when domain missing", func(t *testing.T) {
		input := model.ScanResults{NsDelegations: &model.NsDelegations{Hosts: []string{"ns1.example.net"}}}
		if got := ExtractNSEvidence(input); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when ns delegations missing", func(t *testing.T) {
		input := minimalResults("app.example.ca")
		if got := ExtractNSEvidence(input); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

	t.Run("returns nil when no hosts", func(t *testing.T) {
		input := minimalResults("app.example.ca")
		input.NsDelegations = &model.NsDelegations{}
		if got := ExtractNSEvidence(input); got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})

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
	if got := normalizeHost(".NS1.Example.NET."); got != "ns1.example.net" {
		t.Fatalf("normalizeHost mismatch: %q", got)
	}

	record := "x.example.ca. 300 IN CNAME target.provider.net."
	if got := parseCname(record); got != "target.provider.net" {
		t.Fatalf("parseCname mismatch: %q", got)
	}

	hosts := []string{"ns3.example.net", "NS1.example.net.", "ns1.example.net", "ns2.example.net"}
	expected := []string{"ns1.example.net", "ns2.example.net", "ns3.example.net"}
	if got := parseHostnames(hosts); !reflect.DeepEqual(got, expected) {
		t.Fatalf("parseHostnames mismatch: got=%v want=%v", got, expected)
	}
}
