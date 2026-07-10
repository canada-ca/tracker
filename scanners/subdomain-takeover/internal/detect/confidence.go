package detect

const (
	ConfidenceSuspected = "suspected"
	ConfidenceProbable  = "probable"
	ConfidenceConfirmed = "confirmed"
)

// ConfidenceForReason maps stable reason codes to confidence levels.
// Unknown reason codes default to suspected.
func ConfidenceForReason(reasonCode ReasonCode) string {
	switch reasonCode {
	case ReasonCNAMEDanglingNXDOMAIN:
		return ConfidenceProbable
	case ReasonCNAMEProviderFingerprintBodyMatch:
		return ConfidenceProbable
	case ReasonCNAMETargetMatchMissingNXDOMAIN:
		return ConfidenceSuspected
	case ReasonCNAMETargetMatchMissingBodyFP:
		return ConfidenceSuspected

	case ReasonNSFullLameProviderVulnerable:
		return ConfidenceConfirmed
	case ReasonNSPartialLameProviderVulnerable:
		return ConfidenceProbable
	case ReasonNSLameProviderUnknown:
		return ConfidenceSuspected
	case ReasonNSProviderMatchOnly:
		return ConfidenceSuspected
	default:
		return ConfidenceSuspected
	}
}
