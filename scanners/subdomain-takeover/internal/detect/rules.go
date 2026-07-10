package detect

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode ReasonCode
	NeedsNX    bool
}

type NSHit struct {
	Matched            bool
	Provider           string
	ReasonCode         ReasonCode
	ProviderVulnerable bool
	RegistrarMismatch  bool
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
	return &NSHit{}
}

func ShouldEmitCNAME(hit *CNAMEHit) bool {
	if hit == nil {
		return false
	}
	if hit.Matched {
		return true
	}
	return false
}

func ShouldEmitNSHijack(evidence NSEvidence, hit *NSHit) bool {
	return false
}
