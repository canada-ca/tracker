package detect

import "testing"

func TestConfidenceForReason(t *testing.T) {
	tests := []struct {
		reason ReasonCode
		want   string
	}{
		{ReasonCNAMEDanglingNXDOMAIN, ConfidenceProbable},
		{ReasonCNAMEProviderFingerprintBodyMatch, ConfidenceProbable},
		{ReasonCNAMETargetMatchMissingNXDOMAIN, ConfidenceSuspected},
		{ReasonCNAMETargetMatchMissingBodyFP, ConfidenceSuspected},
		{ReasonNSFullLameProviderVulnerable, ConfidenceConfirmed},
		{ReasonNSPartialLameProviderVulnerable, ConfidenceProbable},
		{ReasonNSLameProviderUnknown, ConfidenceSuspected},
		{ReasonNSProviderMatchOnly, ConfidenceSuspected},
		{ReasonCode("UNKNOWN_REASON"), ConfidenceSuspected},
	}

	for _, tt := range tests {
		if got := ConfidenceForReason(tt.reason); got != tt.want {
			t.Fatalf("ConfidenceForReason(%q)=%q want=%q", tt.reason, got, tt.want)
		}
	}
}
