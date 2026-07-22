package detect

import "strings"

func getNSHijackReasonCode(lameType string, providerStatus NSProviderStatus) ReasonCode {
	switch normalizeLameType(lameType) {
	case "full":
		if isExploitableProviderStatus(providerStatus) {
			return ReasonNSFullLameProviderVulnerable
		}
		return ReasonNSLameProviderUnknown
	case "partial":
		if isExploitableProviderStatus(providerStatus) {
			return ReasonNSPartialLameProviderVulnerable
		}
		return ReasonNSLameProviderUnknown
	default:
		return ReasonNSProviderMatchOnly
	}
}

func isNSMatch(reasonCode ReasonCode) bool {
	return reasonCode == ReasonNSFullLameProviderVulnerable || reasonCode == ReasonNSPartialLameProviderVulnerable
}

func isExploitableProviderStatus(status NSProviderStatus) bool {
	return status == NSStatusVulnerable || status == NSStatusVulnerableWithPurchase
}

func normalizeLameType(lameType string) string {
	return strings.ToLower(strings.TrimSpace(lameType))
}

func nsReasonRank(reasonCode ReasonCode) int {
	switch reasonCode {
	case ReasonNSFullLameProviderVulnerable:
		return 4
	case ReasonNSPartialLameProviderVulnerable:
		return 3
	case ReasonNSLameProviderUnknown:
		return 2
	case ReasonNSProviderMatchOnly:
		return 1
	default:
		return 0
	}
}
