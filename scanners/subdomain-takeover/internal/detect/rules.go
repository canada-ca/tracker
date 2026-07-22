package detect

import "strings"

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode ReasonCode
	NeedsNX    bool
}

type NSHit struct {
	Matched           bool
	Host              string
	Provider          string
	ReasonCode        ReasonCode
	RegistrarMismatch bool
}

func MatchCNAMEFingerprints(evidence CNAMEEvidence, fingerprints []CNAMEProviderFingerprint, matcher BodyFingerprintMatcher) *CNAMEHit {
	for _, fp := range fingerprints {
		if fp.ContainsTarget(evidence.Target) {
			hit := CNAMEHit{
				Matched:    false,
				Provider:   fp.Name,
				ReasonCode: "",
				NeedsNX:    fp.Nxdomain,
			}

			if hit.NeedsNX {
				hit.ReasonCode = ReasonCNAMETargetMatchMissingNXDOMAIN
				if evidence.NoResolve {
					hit.Matched = true
					hit.ReasonCode = ReasonCNAMEDanglingNXDOMAIN
				}
			} else {
				hit.ReasonCode = ReasonCNAMETargetMatchMissingBodyFP
				mode := normalizeFingerprintMode(fp.Mode, fp.Fingerprint)
				if matcher != nil && matcher.Contains(evidence.Domain, fp.Fingerprint, mode) {
					hit.Matched = true
					hit.ReasonCode = ReasonCNAMEProviderFingerprintBodyMatch
				}
			}

			return &hit
		}
	}
	return nil
}

func MatchNSProviderRules(evidence NSEvidence, fingerprints []NSProviderFingerprint) *NSHit {
	if len(evidence.NSHosts) == 0 || len(fingerprints) == 0 {
		return nil
	}

	lameType := normalizeLameType(evidence.NSDelegations.Delegation.LameType)
	var best *NSHit

	for _, host := range evidence.NSHosts {
		for _, fp := range fingerprints {
			if fp.ContainsNSHost(host) {
				reasonCode := getNSHijackReasonCode(lameType, fp.Status)
				hit := &NSHit{
					Matched:    isNSMatch(reasonCode),
					Host:       host,
					Provider:   fp.Name,
					ReasonCode: reasonCode,
				}

				if best == nil || nsReasonRank(hit.ReasonCode) > nsReasonRank(best.ReasonCode) {
					best = hit
				}
			}
		}
	}

	return best
}

func ShouldEmitCNAME(hit *CNAMEHit) bool {
	if hit == nil {
		return false
	}
	return hit.Matched
}

func ShouldEmitNSHijack(hit *NSHit) bool {
	if hit == nil {
		return false
	}
	return hit.Matched
}

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
