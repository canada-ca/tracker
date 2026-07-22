package detect

import "testing"

func TestContainsNSHostAndWildcardMatch(t *testing.T) {
	fp := NSProviderFingerprint{Name: "Test", HostPatterns: []string{"*.example.net", "ns.fixed.io"}}

	if !fp.ContainsNSHost("NS1.EXAMPLE.NET.") {
		t.Fatal("expected wildcard match for ns1.example.net")
	}
	if !fp.ContainsNSHost("ns.fixed.io") {
		t.Fatal("expected exact match for ns.fixed.io")
	}
	if fp.ContainsNSHost("other.net") {
		t.Fatal("did not expect match for other.net")
	}

	if !wildcardHostMatch("abc*xyz*io", "abc-123-xyz-final-io") {
		t.Fatal("expected multi-star wildcard to match")
	}
	if wildcardHostMatch("abc*xyz", "zabc123xyz") {
		t.Fatal("did not expect prefix mismatch to match")
	}
}

func TestContainsTargetAndNormalizeMode(t *testing.T) {
	fp := CNAMEProviderFingerprint{Cname: []string{"azurewebsites.net"}}
	if !fp.ContainsTarget("foo.azurewebsites.net") {
		t.Fatal("expected suffix match")
	}
	if fp.ContainsTarget("foo.example.net") {
		t.Fatal("did not expect suffix mismatch")
	}

	if got := normalizeFingerprintMode(FingerprintModeLiteral, "foo"); got != FingerprintModeLiteral {
		t.Fatalf("unexpected mode: %q", got)
	}
	if got := normalizeFingerprintMode("", "service unavailable"); got != FingerprintModeLiteral {
		t.Fatalf("unexpected inferred mode: %q", got)
	}
	if got := normalizeFingerprintMode("", "Error: .* not found"); got != FingerprintModeRegex {
		t.Fatalf("unexpected inferred mode: %q", got)
	}
	if got := normalizeFingerprintMode("", "foo\\d+"); got != FingerprintModeRegex {
		t.Fatalf("unexpected inferred mode: %q", got)
	}
}
