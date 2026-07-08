package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func MatchCNAMEFingerprints(evidence model.Finding, fingerprints []Fingerprint) {
	return
}

func MatchNSProviderRules(evidence model.Finding, providerRules []string) {
	return
}

func ShouldEmitCNAME() {
	return
}

func ShouldEmitNSHijack() {
	return
}
