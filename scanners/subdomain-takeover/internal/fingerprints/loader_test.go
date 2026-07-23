package fingerprints

import (
	"sync"
	"testing"

	"github.com/rs/zerolog"
)

func TestLoad(t *testing.T) {
	origErr := loadErr
	origCNAME := cnameProviderFingerprints
	origNS := nsProviderFingerprints

	loadOnce = sync.Once{}
	loadErr = nil
	cnameProviderFingerprints = nil
	nsProviderFingerprints = nil

	t.Cleanup(func() {
		loadOnce = sync.Once{}
		loadErr = origErr
		cnameProviderFingerprints = origCNAME
		nsProviderFingerprints = origNS
	})

	err := Load(zerolog.Nop())
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if len(CNAME()) == 0 {
		t.Fatal("expected cname fingerprints to be loaded")
	}
	if len(NS()) == 0 {
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
