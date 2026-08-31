package detect

import (
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func getNSHijackReasonCode(lameType string, fingerprint fingerprints.NSProviderFingerprint, registrar *model.RegistrarContext) ReasonCode {
	if !isLameType(lameType) {
		return ReasonNSProviderMatchOnly
	}

	if !isExploitableProviderStatus(fingerprint.Status) {
		return ReasonNSLameProviderUnknown
	}

	registrarReason := getRegistrarReasonCode(fingerprint.Name, registrar)
	if registrarReason != "" {
		return registrarReason
	}

	switch normalizeLameType(lameType) {
	case "full":
		return ReasonNSFullLameProviderVulnerable
	case "partial":
		return ReasonNSPartialLameProviderVulnerable
	default:
		return ReasonNSProviderMatchOnly
	}
}

func getRegistrarReasonCode(provider string, registrar *model.RegistrarContext) ReasonCode {
	if registrar == nil {
		return ReasonNSRegistrarContextInsufficient
	}

	if !registrar.LookupSuccess || registrar.RegistrarName == "" {
		return ReasonNSRegistrarContextInsufficient
	}

	if registrar.DelegationMatchesRDAP != nil && !*registrar.DelegationMatchesRDAP {
		return ReasonNSRegistrarContextInsufficient
	}

	registrarKey := canonicalProviderKey(registrar.RegistrarName)
	providerKey := canonicalProviderKey(provider)

	if registrarKey == "" || providerKey == "" {
		return ReasonNSRegistrarContextInsufficient
	}

	if registrarKey == providerKey {
		return ReasonNSRegistrarProviderMatch
	}

	return ""
}

func isExploitableProviderStatus(status fingerprints.NSProviderStatus) bool {
	return status == fingerprints.NSStatusVulnerable || status == fingerprints.NSStatusVulnerableWithPurchase
}

func isLameType(lameType string) bool {
	ltNorm := normalizeLameType(lameType)
	return ltNorm == "full" || ltNorm == "partial"
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
	case ReasonNSRegistrarProviderMatch:
		return 2
	case ReasonNSRegistrarContextInsufficient:
		return 2
	case ReasonNSLameProviderUnknown:
		return 1
	case ReasonNSProviderMatchOnly:
		return 0
	default:
		return 0
	}
}
