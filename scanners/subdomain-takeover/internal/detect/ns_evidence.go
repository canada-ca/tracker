package detect

import (
	"slices"
	"strings"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

type NSEvidence struct {
	Domain        string
	NSHosts       []string
	NSDelegations model.NsDelegations
	// Registrar     model.RegistrarContext // if/when added
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

func parseHostnames(hosts []string) []string {
	normalizedHosts := make([]string, 0, len(hosts))
	for _, host := range hosts {
		normalizedHosts = append(normalizedHosts, normalizeHost(host))
	}

	slices.Sort(normalizedHosts)
	return slices.Compact(normalizedHosts)
}

func normalizeHost(host string) string {
	return strings.Trim(strings.ToLower(host), ".")
}
