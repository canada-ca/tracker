package detect

import (
	"fmt"
)

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode string
	RuleID     string
	NeedsNX    bool
}

type NSHit struct {
	Matched            bool
	Provider           string
	ReasonCode         string
	RuleID             string
	ProviderVulnerable bool
	RegistrarMismatch  bool
}

func MatchCNAMEFingerprints(evidence CNAMEEvidence, fingerprints []CNAMEProviderFingerprint) *CNAMEHit {
	for _, fp := range fingerprints {
		if fp.ContainsTarget(evidence.Target) {
			if fp.Nxdomain {
				fmt.Println("check for nxdomain on A record")
				if evidence.QueryAnswer.A == "NXDOMAIN" {
					fmt.Println("Bingo")
				}
			} // else {
			// 	fmt.Println("check for other fingerprint")
			// }
		}
	}
}

func MatchNSProviderRules(evidence NSEvidence, fingerprints []NSProviderFingerprint) *NSHit {
	return
}

func ShouldEmitCNAME(evidence CNAMEEvidence, hit *CNAMEHit) bool {
	return false
}

func ShouldEmitNSHijack(evidence NSEvidence, hit *NSHit) bool {
	return false
}
