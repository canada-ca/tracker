package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"

func Classify(input model.Input) ([]model.Finding, error) {
	findings := []model.Finding{}

	cnameEvidence := ExtractCNAMEEvidence(input)
	cnameHit := MatchCNAMEFingerprints(*cnameEvidence, CNAMEProviderFingerprints)
	if ShouldEmitCNAME(cnameHit) {
		// compute confidence
		// compute reason/remediation
		findings = append(findings, model.Finding{
			Domain:      cnameEvidence.Domain,
			RecordType:  "CNAME",
			Target:      cnameEvidence.Target,
			Provider:    cnameHit.Provider,
			ReasonCode:  cnameHit.ReasonCode,
			Confidence:  "",
			Remediation: "",
		})
	}

	nsEvidence := ExtractNSEvidence(input)
	nsHit := MatchNSProviderRules(*nsEvidence, NSProviderFingerprints)
	if ShouldEmitNSHijack(*nsEvidence, nsHit) {
		// compute confidence
		// compute reason/remediation
		findings = append(findings, model.Finding{
			Domain: input.Domain,
		})
	}
	return findings, nil
}
