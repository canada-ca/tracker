package detect

import "testing"

func TestGlobalFingerprintSource(t *testing.T) {
	origCNAME := CNAMEProviderFingerprints
	origNS := NSProviderFingerprints
	t.Cleanup(func() {
		CNAMEProviderFingerprints = origCNAME
		NSProviderFingerprints = origNS
	})

	CNAMEProviderFingerprints = []CNAMEProviderFingerprint{{Name: "A"}}
	NSProviderFingerprints = []NSProviderFingerprint{{Name: "B"}}

	src := GlobalFingerprintSource{}
	if got := src.CNAME(); len(got) != 1 || got[0].Name != "A" {
		t.Fatalf("unexpected cname source: %+v", got)
	}
	if got := src.NS(); len(got) != 1 || got[0].Name != "B" {
		t.Fatalf("unexpected ns source: %+v", got)
	}
}
