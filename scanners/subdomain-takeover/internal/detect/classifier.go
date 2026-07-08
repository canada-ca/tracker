package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"

func Classify(input model.Input) ([]model.Finding, error) {
	evidence := []model.Finding{}

	// parse CNAME chain
	if input.CnameRecord != nil {
		cnameEvidence := ExtractCNAMEEvidence(input)
		evidence = append(evidence, *cnameEvidence)
	}

	// parse NS hostnames
	if len(input.NsRecords.Hostnames) > 0 {
		nsEvidence := ExtractNSEvidence(input)
		evidence = append(evidence, *nsEvidence)
	}

	return evidence, nil
}
