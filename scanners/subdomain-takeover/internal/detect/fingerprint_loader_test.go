package detect

import (
	"sync"
	"testing"

	"github.com/rs/zerolog"
)

func TestLoadFingerprints(t *testing.T) {
	origOnce := loadFingerprintsOnce
	origErr := loadFingerprintsErr
	origCNAME := CNAMEProviderFingerprints
	origNS := NSProviderFingerprints

	loadFingerprintsOnce = sync.Once{}
	loadFingerprintsErr = nil
	CNAMEProviderFingerprints = nil
	NSProviderFingerprints = nil

	t.Cleanup(func() {
		loadFingerprintsOnce = origOnce
		loadFingerprintsErr = origErr
		CNAMEProviderFingerprints = origCNAME
		NSProviderFingerprints = origNS
	})

	err := LoadFingerprints(zerolog.Nop())
	if err != nil {
		t.Fatalf("LoadFingerprints returned error: %v", err)
	}
	if len(CNAMEProviderFingerprints) == 0 {
		t.Fatal("expected cname fingerprints to be loaded")
	}
	if len(NSProviderFingerprints) == 0 {
		t.Fatal("expected ns fingerprints to be loaded")
	}
}

func TestValidateFingerprintHelpers(t *testing.T) {
	if err := validateCNAMEFingerprints([]CNAMEProviderFingerprint{{Name: "", Cname: []string{"x"}, Fingerprint: "fp"}}); err == nil {
		t.Fatal("expected error for missing cname fingerprint name")
	}
	if err := validateNSFingerprints([]NSProviderFingerprint{{Name: "ok", HostPatterns: []string{""}}}); err == nil {
		t.Fatal("expected error for empty ns host pattern")
	}
}
