package detect

import (
	"fmt"
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func ExtractCNAMEEvidence(input model.Input) *model.Finding {
	cname := parseCname(*input.CnameRecord)
	for _, fp := range Fingerprints {
		if fp.ContainsCname(cname) {
			fmt.Println(fp.Name)
			if fp.Nxdomain {
				fmt.Println("check for nxdomain on A record")
				if input.QueryAnswers.A == "NXDOMAIN" {
					fmt.Println("fingerprint match, CNAME takeover possible")
					return &model.Finding{
						Domain:     input.Domain,
						RecordType: "CNAME",
						Provider:   fp.Name,
						Confidence: "confirmed",
						Target:     cname,
					}
				}
			} else {
				fmt.Println("check for other fingerprint")
			}
		}
	}

	return nil
}

func ExtractNSEvidence(input model.Input) *model.Finding {
	return nil
}

func ClassifyLameType(nsChecks []model.NsCheck) {
	return
}

func parseCname(record string) string {
	trimmed := strings.Trim(record, ".")
	lower := strings.ToLower(trimmed)
	record_tokens := strings.Split(lower, " ")
	return record_tokens[len(record_tokens)-1]
}
