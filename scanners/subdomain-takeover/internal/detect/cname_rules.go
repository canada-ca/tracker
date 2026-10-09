package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/rs/zerolog"
)

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode ReasonCode
	NeedsNX    bool
}

func MatchCNAMEFingerprints(evidence CNAMEEvidence, providerFingerprints []fingerprints.CNAMEProviderFingerprint, matcher BodyFingerprintMatcher, logger zerolog.Logger) *CNAMEHit {
	for _, fp := range providerFingerprints {
		if fp.ContainsTarget(evidence.Target) {
			logger.Debug().
				Str("domain", evidence.Domain).
				Str("target", evidence.Target).
				Str("provider", fp.Name).
				Bool("needs_nx", fp.Nxdomain).
				Msg("cname provider target matched")

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
				mode := fingerprints.NormalizeMode(fp.Mode, fp.Fingerprint)
				logger.Debug().
					Str("domain", evidence.Domain).
					Str("provider", fp.Name).
					Str("fingerprint_mode", string(mode)).
					Msg("checking cname body fingerprint")
				if matcher != nil && matcher.Contains(evidence.Domain, fp.Fingerprint, mode) {
					hit.Matched = true
					hit.ReasonCode = ReasonCNAMEProviderFingerprintBodyMatch
					logger.Debug().
						Str("domain", evidence.Domain).
						Str("provider", fp.Name).
						Str("reason_code", string(hit.ReasonCode)).
						Msg("cname body fingerprint matched")
				} else {
					logger.Debug().
						Str("domain", evidence.Domain).
						Str("provider", fp.Name).
						Str("reason_code", string(hit.ReasonCode)).
						Msg("cname finding suppressed: body fingerprint missing")
				}
			}

			if hit.NeedsNX && !hit.Matched {
				logger.Debug().
					Str("domain", evidence.Domain).
					Str("provider", fp.Name).
					Str("reason_code", string(hit.ReasonCode)).
					Msg("cname finding suppressed: required nxdomain signal missing")
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
