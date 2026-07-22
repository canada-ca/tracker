package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

type Classifier struct {
	Matcher BodyFingerprintMatcher
	Source  FingerprintSource
}

func NewClassifier(matcher BodyFingerprintMatcher) *Classifier {
	return &Classifier{Matcher: matcher, Source: GlobalFingerprintSource{}}
}

func NewClassifierWithSource(matcher BodyFingerprintMatcher, source FingerprintSource) *Classifier {
	if source == nil {
		source = GlobalFingerprintSource{}
	}

	return &Classifier{Matcher: matcher, Source: source}
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

	return Classify(input, matcher, source)
}

func Classify(input model.Input, matcher BodyFingerprintMatcher, source FingerprintSource) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameFingerprints := source.CNAME()
	nsFingerprints := source.NS()

	cnameEvidence := ExtractCNAMEEvidence(input.Results)
	if cnameEvidence != nil {
		cnameHit := MatchCNAMEFingerprints(*cnameEvidence, cnameFingerprints, matcher)
		if ShouldEmitCNAME(cnameHit) {
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
	}

	nsEvidence := ExtractNSEvidence(input.Results)
	if nsEvidence != nil {
		nsHit := MatchNSProviderRules(*nsEvidence, nsFingerprints)
		if ShouldEmitNSHijack(nsHit) {
			findings = append(findings, model.Finding{
				Domain:     nsEvidence.Domain,
				DomainKey:  input.DomainKey,
				RecordType: model.RecordTypeNS,
				Target:     nsHit.Host,
				Provider:   nsHit.Provider,
				ReasonCode: string(nsHit.ReasonCode),
				Confidence: ConfidenceForReason(nsHit.ReasonCode),
			})
		}
	}

	return findings, nil
}
