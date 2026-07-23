package detect

import "github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"

type FingerprintSource interface {
	CNAME() []fingerprints.CNAMEProviderFingerprint
	NS() []fingerprints.NSProviderFingerprint
}

type GlobalFingerprintSource struct{}

func (GlobalFingerprintSource) CNAME() []fingerprints.CNAMEProviderFingerprint {
	return fingerprints.CNAME()
}

func (GlobalFingerprintSource) NS() []fingerprints.NSProviderFingerprint {
	return fingerprints.NS()
}
