package detect

type FingerprintSource interface {
	CNAME() []CNAMEProviderFingerprint
	NS() []NSProviderFingerprint
}

type GlobalFingerprintSource struct{}

func (GlobalFingerprintSource) CNAME() []CNAMEProviderFingerprint {
	return CNAMEProviderFingerprints
}

func (GlobalFingerprintSource) NS() []NSProviderFingerprint {
	return NSProviderFingerprints
}
