package detect

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode ReasonCode
	NeedsNX    bool
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

func ShouldEmitCNAME(hit *CNAMEHit) bool {
	if hit == nil {
		return false
	}
	return hit.Matched
}
