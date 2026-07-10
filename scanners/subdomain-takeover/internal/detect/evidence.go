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

func ExtractCNAMEEvidence(input model.Input) *CNAMEEvidence {
	if input.CnameRecord == nil {
		return nil
	}

	return &CNAMEEvidence{
		Domain:    input.Domain,
		Target:    parseCname(*input.CnameRecord),
		NoResolve: input.ResolveChain == nil,
	}
}

func ExtractNSEvidence(input model.Input) *NSEvidence {
	if len(input.NsDelegations.Hosts) == 0 {
		return nil
	}
	return &NSEvidence{}
}

func ClassifyLameType(nsChecks []model.NsCheck) {
	return
}

func parseCname(record string) string {
	trimmed := strings.Trim(record, ".")
	lower := strings.ToLower(trimmed)
	recordTokens := strings.Split(lower, " ")
	return recordTokens[len(recordTokens)-1]
}
