package detect

type NSHit struct {
	Matched           bool
	Host              string
	Provider          string
	ReasonCode        ReasonCode
	RegistrarMismatch bool
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

func ShouldEmitNSHijack(hit *NSHit) bool {
	if hit == nil {
		return false
	}
	return hit.Matched
}
