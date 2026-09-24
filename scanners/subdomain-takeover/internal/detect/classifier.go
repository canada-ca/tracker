package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/rs/zerolog"
)

type Classifier struct {
	matcher BodyFingerprintMatcher
	logger  zerolog.Logger
}

func NewClassifier(matcher BodyFingerprintMatcher, logger zerolog.Logger) *Classifier {
	if matcher == nil {
		matcher = NewNoopBodyFingerprintMatcher()
	}
	return &Classifier{
		matcher: matcher,
		logger:  logger.With().Str("component", "classifier").Logger(),
	}
}

func (c *Classifier) Classify(input model.Input) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameProviderFingerprints := fingerprints.CNAME()
	nsProviderFingerprints := fingerprints.NS()

	cnameEvidence := ExtractCNAMEEvidence(input.Results)
	if cnameEvidence != nil {
		c.logger.Debug().Str("domain_key", input.DomainKey).Str("domain", cnameEvidence.Domain).Msg("cname evidence extracted")
		cnameHit := MatchCNAMEFingerprints(*cnameEvidence, cnameProviderFingerprints, c.matcher, c.logger)
		if ShouldEmitCNAME(cnameHit) {
			c.logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", cnameEvidence.Domain).
				Str("provider", cnameHit.Provider).
				Str("reason_code", string(cnameHit.ReasonCode)).
				Msg("emitting cname finding")
			findings = append(findings, model.Finding{
				Domain:     cnameEvidence.Domain,
				DomainKey:  input.DomainKey,
				RecordType: model.RecordTypeCNAME,
				Target:     cnameEvidence.Target,
				Provider:   cnameHit.Provider,
				ReasonCode: string(cnameHit.ReasonCode),
				Confidence: ConfidenceForReason(cnameHit.ReasonCode),
			})
		} else if cnameHit != nil {
			c.logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", cnameEvidence.Domain).
				Str("provider", cnameHit.Provider).
				Str("reason_code", string(cnameHit.ReasonCode)).
				Msg("cname finding suppressed")
		}
	} else {
		c.logger.Debug().Str("domain_key", input.DomainKey).Msg("no cname evidence")
	}

	nsEvidence := ExtractNSEvidence(input.Results)
	if nsEvidence != nil {
		c.logger.Debug().
			Str("domain_key", input.DomainKey).
			Str("domain", nsEvidence.Domain).
			Int("ns_hosts", len(nsEvidence.NSHosts)).
			Msg("ns evidence extracted")
		nsHit := MatchNSProviderRules(*nsEvidence, nsProviderFingerprints, c.logger)
		if ShouldEmitNSHijack(nsHit) {
			c.logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", nsEvidence.Domain).
				Str("provider", nsHit.Provider).
				Str("target", nsHit.Host).
				Str("reason_code", string(nsHit.ReasonCode)).
				Msg("emitting ns finding")
			findings = append(findings, model.Finding{
				Domain:     nsEvidence.Domain,
				DomainKey:  input.DomainKey,
				RecordType: model.RecordTypeNS,
				Target:     nsHit.Host,
				Provider:   nsHit.Provider,
				ReasonCode: string(nsHit.ReasonCode),
				Confidence: ConfidenceForReason(nsHit.ReasonCode),
			})
		} else if nsHit != nil {
			c.logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", nsEvidence.Domain).
				Str("provider", nsHit.Provider).
				Str("target", nsHit.Host).
				Str("reason_code", string(nsHit.ReasonCode)).
				Msg("ns finding suppressed")
		}
	} else {
		c.logger.Debug().Str("domain_key", input.DomainKey).Msg("no ns evidence")
	}

	return findings, nil
}
