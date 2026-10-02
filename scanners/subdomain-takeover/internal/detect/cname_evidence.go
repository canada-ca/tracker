package detect

import (
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

type CNAMEEvidence struct {
	Domain    string
	Target    string
	NoResolve bool
}

func ExtractCNAMEEvidence(results model.ScanResults) *CNAMEEvidence {
	if results.CnameRecord == nil || results.Domain == nil {
		return nil
	}

	return &CNAMEEvidence{
		Domain:    *results.Domain,
		Target:    parseCname(*results.CnameRecord),
		NoResolve: len(results.ResolveChain) == 0,
	}
}

func parseCname(record string) string {
	normalRecord := normalizeHost(record)
	recordTokens := strings.Split(normalRecord, " ")
	return recordTokens[len(recordTokens)-1]
}
