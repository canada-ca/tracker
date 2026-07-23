package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"

type NSHit struct {
	Matched    bool
	Host       string
	Provider   string
	ReasonCode ReasonCode
}

func MatchNSProviderRules(evidence NSEvidence, providerFingerprints []fingerprints.NSProviderFingerprint) *NSHit {
	if len(evidence.NSHosts) == 0 || len(providerFingerprints) == 0 {
		detectLogger.Debug().Int("ns_hosts", len(evidence.NSHosts)).Int("fingerprints", len(providerFingerprints)).Msg("skipping ns matching due to insufficient inputs")
		return nil
	}

	lameType := normalizeLameType(evidence.NSDelegations.Delegation.LameType)
	var best *NSHit

	for _, host := range evidence.NSHosts {
		for _, fp := range providerFingerprints {
			if fp.ContainsNSHost(host) {
				reasonCode := getNSHijackReasonCode(lameType, fp.Status)
				rank := nsReasonRank(reasonCode)
				hit := &NSHit{
					Matched:    isNSMatch(reasonCode),
					Host:       host,
					Provider:   fp.Name,
					ReasonCode: reasonCode,
				}

				detectLogger.Debug().
					Str("domain", evidence.Domain).
					Str("host", host).
					Str("provider", fp.Name).
					Str("provider_status", string(fp.Status)).
					Str("lame_type", lameType).
					Str("reason_code", string(reasonCode)).
					Int("rank", rank).
					Bool("emittable", hit.Matched).
					Msg("ns candidate evaluated")

				if best == nil || nsReasonRank(hit.ReasonCode) > nsReasonRank(best.ReasonCode) {
					best = hit
				}
			}
		}
	}

	if best == nil {
		detectLogger.Debug().Str("domain", evidence.Domain).Msg("no ns provider match")
		return nil
	}

	detectLogger.Debug().
		Str("domain", evidence.Domain).
		Str("host", best.Host).
		Str("provider", best.Provider).
		Str("reason_code", string(best.ReasonCode)).
		Int("rank", nsReasonRank(best.ReasonCode)).
		Bool("emittable", best.Matched).
		Msg("ns best candidate selected")

	return best
}

func ShouldEmitNSHijack(hit *NSHit) bool {
	if hit == nil {
		return false
	}
	return hit.Matched
}
