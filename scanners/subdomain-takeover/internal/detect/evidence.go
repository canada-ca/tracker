package detect

import (
	"slices"
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
	if results.CnameRecord == nil || results.Domain == nil {
		return nil
	}

	return &CNAMEEvidence{
		Domain:    *results.Domain,
		Target:    parseCname(*results.CnameRecord),
		NoResolve: len(results.ResolveChain) == 0,
	}
}

func ExtractNSEvidence(input model.ScanResults) *NSEvidence {
	nsDelegations := input.NsDelegations
	if input.Domain == nil || nsDelegations == nil || len(nsDelegations.Hosts) == 0 {
		return nil
	}

	return &NSEvidence{
		Domain:        *input.Domain,
		NSHosts:       parseHostnames(input.NsDelegations.Hosts),
		NSDelegations: *input.NsDelegations,
	}

}

func parseCname(record string) string {
	normalRecord := normalizeHost(record)
	recordTokens := strings.Split(normalRecord, " ")
	return recordTokens[len(recordTokens)-1]
}

func parseHostnames(hosts []string) []string {
	var normalizedHosts = []string{}
	for _, host := range hosts {
		normalHost := normalizeHost(host)
		normalizedHosts = append(normalizedHosts, normalHost)
	}
	slices.Sort(normalizedHosts)
	return slices.Compact(normalizedHosts)
}

func normalizeHost(host string) string {
	return strings.Trim(strings.ToLower(host), ".")
}
