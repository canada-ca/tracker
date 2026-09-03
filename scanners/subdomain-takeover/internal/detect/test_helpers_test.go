package detect

import (
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

type fakeMatcher struct {
	containsFn func(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool
}

func (f fakeMatcher) Contains(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool {
	if f.containsFn == nil {
		return false
	}
	return f.containsFn(domain, fingerprint, mode)
}

type fakeSource struct {
	cname []fingerprints.CNAMEProviderFingerprint
	ns    []fingerprints.NSProviderFingerprint
}

func (f fakeSource) CNAME() []fingerprints.CNAMEProviderFingerprint { return f.cname }
func (f fakeSource) NS() []fingerprints.NSProviderFingerprint       { return f.ns }

func strPtr(v string) *string { return &v }

func boolPtr(v bool) *bool { return &v }

func minimalResults(domain string) model.ScanResults {
	return model.ScanResults{Domain: strPtr(domain)}
}
