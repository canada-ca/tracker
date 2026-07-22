package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

type Classifier struct {
	Matcher BodyFingerprintMatcher
}

func NewClassifier(matcher BodyFingerprintMatcher) *Classifier {
	return &Classifier{Matcher: matcher}
}

func (c *Classifier) Classify(input model.Input) ([]model.Finding, error) {
	matcher := c.Matcher
	if matcher == nil {
		matcher = NewNoopBodyFingerprintMatcher()
	}

	return Classify(input, matcher)
}

func Classify(input model.Input, matcher BodyFingerprintMatcher) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameEvidence := ExtractCNAMEEvidence(input.Results)
	if cnameEvidence != nil {
		cnameHit := MatchCNAMEFingerprints(*cnameEvidence, CNAMEProviderFingerprints, matcher)
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
		nsHit := MatchNSProviderRules(*nsEvidence, NSProviderFingerprints)
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
