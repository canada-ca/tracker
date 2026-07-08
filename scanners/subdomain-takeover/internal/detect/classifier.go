package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"

func Classify(input model.Input) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameEvidence := ExtractCNAMEEvidence(input)
	cnameHit := MatchCNAMEFingerprints(*cnameEvidence, CNAMEProviderFingerprints)
	if ShouldEmitCNAME(*cnameEvidence, cnameHit) {
		findings = append(findings, model.Finding{
			Domain: input.Domain,
		})
	}

	nsEvidence := ExtractNSEvidence(input)
	nsHit := MatchNSProviderRules(*nsEvidence, NSProviderFingerprints)
	if ShouldEmitNSHijack(*nsEvidence, nsHit) {
		findings = append(findings, model.Finding{
			Domain: input.Domain,
		})
	}
	return findings, nil
}
