package detect

import (
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

// inputs from evidence.go
type CNAMEEvidence struct {
	Domain    string
	Target    string
	NoResolve bool
}

type NSEvidence struct {
	Domain        string
	NSHosts       []string
	NSDelegations model.NsDelegations
	// Registrar     model.RegistrarContext // if/when added
}

func ExtractCNAMEEvidence(results model.ScanResults) *CNAMEEvidence {
	if results.CnameRecord == nil {
		return nil
	}

	domain := results.Domain

	return &CNAMEEvidence{
		Domain:    *domain,
		Target:    parseCname(*results.CnameRecord),
		NoResolve: len(results.ResolveChain) == 0,
	}
}

func ExtractNSEvidence(input model.Input) *NSEvidence {
	nsDelegations := input.Results.NsDelegations
	if nsDelegations == nil || len(nsDelegations.Hosts) == 0 {
		return nil
	}
	return &NSEvidence{}
}

func ClassifyLameType(nsChecks []any) {
	return
}

func parseCname(record string) string {
	trimmed := strings.Trim(record, ".")
	lower := strings.ToLower(trimmed)
	recordTokens := strings.Split(lower, " ")
	return recordTokens[len(recordTokens)-1]
}
