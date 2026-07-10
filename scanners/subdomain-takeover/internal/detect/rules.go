package detect

import (
	"fmt"
	"io"
	"net/http"
	"strings"
)

type CNAMEHit struct {
	Matched    bool
	Provider   string
	ReasonCode string
	NeedsNX    bool
}

type NSHit struct {
	Matched            bool
	Provider           string
	ReasonCode         string
	ProviderVulnerable bool
	RegistrarMismatch  bool
}

func MatchCNAMEFingerprints(evidence CNAMEEvidence, fingerprints []CNAMEProviderFingerprint) *CNAMEHit {
	for _, fp := range fingerprints {
		if fp.ContainsTarget(evidence.Target) {
			hit := CNAMEHit{
				Matched:    false,
				Provider:   fp.Name,
				ReasonCode: "",
				NeedsNX:    fp.Nxdomain,
			}
			if hit.NeedsNX {
				hit.ReasonCode = "CNAME_TARGET_MATCH_MISSING_NXDOMAIN"
				if evidence.QueryAnswer.A == "NXDOMAIN" {
					hit.Matched = true
					hit.ReasonCode = "CNAME_DANGLING_NXDOMAIN"
				}
			} else {
				hit.ReasonCode = "CNAME_TARGET_MATCH_MISSING_BODY_FINGERPRINT"
				if urlBodyContainsFingerprint(evidence.Domain, fp.Fingerprint) {
					hit.Matched = true
					hit.ReasonCode = "CNAME_PROVIDER_FINGERPRINT_BODY_MATCH"
				}
			}
			return &hit
		}
	}
	return nil
}

func MatchNSProviderRules(evidence NSEvidence, fingerprints []NSProviderFingerprint) *NSHit {
	return &NSHit{}
}

func ShouldEmitCNAME(hit *CNAMEHit) bool {
	if hit == nil {
		return false
	}
	if hit.Matched {
		return true
	}
	return false
}

func ShouldEmitNSHijack(evidence NSEvidence, hit *NSHit) bool {
	return false
}

func urlBodyContainsFingerprint(domain string, fp string) bool {
	// curl domain and look for matching fp in body
	url := fmt.Sprintf("http://%s", domain)
	res, err := http.Get(url)
	if err != nil {
		// log error
		return false
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		// log err
		return false
	}

	if strings.Contains(string(body), fp) {
		return true
	}
	return false
}
