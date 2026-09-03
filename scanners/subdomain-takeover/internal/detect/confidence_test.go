package detect

import "testing"

func TestConfidenceForReason(t *testing.T) {
	tests := []struct {
		name   string
		reason ReasonCode
		want   string
	}{
		{name: "cname dangling nxdomain", reason: ReasonCNAMEDanglingNXDOMAIN, want: ConfidenceProbable},
		{name: "cname body fingerprint match", reason: ReasonCNAMEProviderFingerprintBodyMatch, want: ConfidenceProbable},
		{name: "cname target match missing nxdomain", reason: ReasonCNAMETargetMatchMissingNXDOMAIN, want: ConfidenceSuspected},
		{name: "cname target match missing body fp", reason: ReasonCNAMETargetMatchMissingBodyFP, want: ConfidenceSuspected},
		{name: "ns full lame vulnerable", reason: ReasonNSFullLameProviderVulnerable, want: ConfidenceConfirmed},
		{name: "ns partial lame vulnerable", reason: ReasonNSPartialLameProviderVulnerable, want: ConfidenceProbable},
		{name: "ns lame provider unknown", reason: ReasonNSLameProviderUnknown, want: ConfidenceSuspected},
		{name: "ns provider match only", reason: ReasonNSProviderMatchOnly, want: ConfidenceSuspected},
		{name: "ns registrar provider match", reason: ReasonNSRegistrarProviderMatch, want: ConfidenceSuspected},
		{name: "ns registrar context insufficient", reason: ReasonNSRegistrarContextInsufficient, want: ConfidenceSuspected},
		{name: "unknown reason defaults suspected", reason: ReasonCode("UNKNOWN_REASON"), want: ConfidenceSuspected},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ConfidenceForReason(tt.reason); got != tt.want {
				t.Fatalf("ConfidenceForReason(%q)=%q want=%q", tt.reason, got, tt.want)
			}
		})
	}
}
