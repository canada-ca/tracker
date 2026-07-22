package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/rs/zerolog"
)

type Classifier struct {
	Matcher BodyFingerprintMatcher
	Source  FingerprintSource
	logger  zerolog.Logger
}

func NewClassifier(matcher BodyFingerprintMatcher) *Classifier {
	return &Classifier{Matcher: matcher, Source: GlobalFingerprintSource{}, logger: zerolog.Nop()}
}

func NewClassifierWithSource(matcher BodyFingerprintMatcher, source FingerprintSource) *Classifier {
	if source == nil {
		source = GlobalFingerprintSource{}
	}

	return &Classifier{Matcher: matcher, Source: source, logger: zerolog.Nop()}
}

func (c *Classifier) WithLogger(logger zerolog.Logger) *Classifier {
	c.logger = logger.With().Str("component", "classifier").Logger()
	SetLogger(logger)
	return c
}

func (c *Classifier) Classify(input model.Input) ([]model.Finding, error) {
	matcher := c.Matcher
	if matcher == nil {
		matcher = NewNoopBodyFingerprintMatcher()
	}

	source := c.Source
	if source == nil {
		source = GlobalFingerprintSource{}
	}

	logger := c.logger
	if logger.GetLevel() == zerolog.NoLevel {
		logger = zerolog.Nop()
	}

	return Classify(input, matcher, source, logger)
}

func Classify(input model.Input, matcher BodyFingerprintMatcher, source FingerprintSource, logger zerolog.Logger) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameFingerprints := source.CNAME()
	nsFingerprints := source.NS()

	cnameEvidence := ExtractCNAMEEvidence(input.Results)
	if cnameEvidence != nil {
		logger.Debug().Str("domain_key", input.DomainKey).Str("domain", cnameEvidence.Domain).Msg("cname evidence extracted")
		cnameHit := MatchCNAMEFingerprints(*cnameEvidence, cnameFingerprints, matcher)
		if ShouldEmitCNAME(cnameHit) {
			logger.Debug().
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
		}
		if cnameHit != nil && !ShouldEmitCNAME(cnameHit) {
			logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", cnameEvidence.Domain).
				Str("provider", cnameHit.Provider).
				Str("reason_code", string(cnameHit.ReasonCode)).
				Msg("cname finding suppressed")
		}
	} else {
		logger.Debug().Str("domain_key", input.DomainKey).Msg("no cname evidence")
	}

	nsEvidence := ExtractNSEvidence(input.Results)
	if nsEvidence != nil {
		logger.Debug().
			Str("domain_key", input.DomainKey).
			Str("domain", nsEvidence.Domain).
			Int("ns_hosts", len(nsEvidence.NSHosts)).
			Msg("ns evidence extracted")
		nsHit := MatchNSProviderRules(*nsEvidence, nsFingerprints)
		if ShouldEmitNSHijack(nsHit) {
			logger.Debug().
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
			logger.Debug().
				Str("domain_key", input.DomainKey).
				Str("domain", nsEvidence.Domain).
				Str("provider", nsHit.Provider).
				Str("target", nsHit.Host).
				Str("reason_code", string(nsHit.ReasonCode)).
				Msg("ns finding suppressed")
		}
	} else {
		logger.Debug().Str("domain_key", input.DomainKey).Msg("no ns evidence")
	}

	return findings, nil
}
