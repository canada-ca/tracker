package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"

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

	// nsEvidence := ExtractNSEvidence(input)
	// nsHit := MatchNSProviderRules(*nsEvidence, NSProviderFingerprints)
	// if ShouldEmitNSHijack(*nsEvidence, nsHit) {
	// 	findings = append(findings, model.Finding{
	// 		Domain: input.Domain,
	// 	})
	// }

	return findings, nil
}
