package detect

import (
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func GetEvidence(input model.Input) []model.Finding {
	evidence := []model.Finding{}

	// parse CNAME chain
	if input.CnameRecord != nil {
		cname := parseCname(*input.CnameRecord)
		cnameEvidence := GetCnameTakeoverEvidence(cname, input.Rcode)
		evidence = append(evidence, *cnameEvidence)
	}

	// parse NS hostnames
	if len(input.NsRecords.Hostnames) > 0 {
		nsEvidence := getNsTakeoverEvidence(input.NsRecords.Hostnames)
		evidence = append(evidence, *nsEvidence)
	}

	return evidence
}

func parseCname(record string) string {
	record_tokens := strings.Split(strings.Trim(record, "."), " ")
	return record_tokens[len(record_tokens)-1]
}
