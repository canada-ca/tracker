package detect

import "testing"

func TestGetNSHijackReasonCode(t *testing.T) {
	tests := []struct {
		name     string
		lameType string
		status   NSProviderStatus
		want     ReasonCode
	}{
		{name: "full vulnerable", lameType: "full", status: NSStatusVulnerable, want: ReasonNSFullLameProviderVulnerable},
		{name: "partial vulnerable", lameType: "partial", status: NSStatusVulnerable, want: ReasonNSPartialLameProviderVulnerable},
		{name: "full vulnerable with purchase", lameType: "full", status: NSStatusVulnerableWithPurchase, want: ReasonNSFullLameProviderVulnerable},
		{name: "full not vulnerable", lameType: "full", status: NSStatusNotVulnerable, want: ReasonNSLameProviderUnknown},
		{name: "partial registration closed", lameType: "partial", status: NSStatusRegistrationClosed, want: ReasonNSLameProviderUnknown},
		{name: "unknown lame type", lameType: "none", status: NSStatusVulnerable, want: ReasonNSProviderMatchOnly},
		{name: "normalized lame type", lameType: "  FULL ", status: NSStatusVulnerable, want: ReasonNSFullLameProviderVulnerable},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getNSHijackReasonCode(tt.lameType, tt.status)
			if got != tt.want {
				t.Fatalf("getNSHijackReasonCode()=%q want=%q", got, tt.want)
			}
		})
	}
}

func TestNSReasoningHelpers(t *testing.T) {
	if !isExploitableProviderStatus(NSStatusVulnerable) {
		t.Fatal("expected vulnerable to be exploitable")
	}
	if !isExploitableProviderStatus(NSStatusVulnerableWithPurchase) {
		t.Fatal("expected vulnerable_with_purchase to be exploitable")
	}
	if isExploitableProviderStatus(NSStatusNotVulnerable) {
		t.Fatal("expected not_vulnerable to be non-exploitable")
	}

	if got := normalizeLameType(" Partial "); got != "partial" {
		t.Fatalf("normalizeLameType mismatch: %q", got)
	}

	if !isNSMatch(ReasonNSFullLameProviderVulnerable) || !isNSMatch(ReasonNSPartialLameProviderVulnerable) {
		t.Fatal("expected vulnerable reason codes to be emittable")
	}
	if isNSMatch(ReasonNSLameProviderUnknown) {
		t.Fatal("expected unknown reason not to be emittable")
	}

	if nsReasonRank(ReasonNSFullLameProviderVulnerable) <= nsReasonRank(ReasonNSPartialLameProviderVulnerable) {
		t.Fatal("expected full lame rank > partial lame rank")
	}
	if nsReasonRank(ReasonNSPartialLameProviderVulnerable) <= nsReasonRank(ReasonNSLameProviderUnknown) {
		t.Fatal("expected partial lame rank > unknown rank")
	}
	if nsReasonRank(ReasonNSLameProviderUnknown) <= nsReasonRank(ReasonNSProviderMatchOnly) {
		t.Fatal("expected unknown rank > provider-only rank")
	}
}
