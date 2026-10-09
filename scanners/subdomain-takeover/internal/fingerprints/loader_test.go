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
	if err := validateCNAMEFingerprints([]CNAMEProviderFingerprint{{Name: "ok", Cname: nil, Fingerprint: "fp"}}); err == nil {
		t.Fatal("expected error for missing cname patterns")
	}
	if err := validateCNAMEFingerprints([]CNAMEProviderFingerprint{{Name: "ok", Cname: []string{""}, Fingerprint: "fp"}}); err == nil {
		t.Fatal("expected error for empty cname pattern")
	}
	if err := validateCNAMEFingerprints([]CNAMEProviderFingerprint{{Name: "ok", Cname: []string{"example.net"}, Fingerprint: ""}}); err == nil {
		t.Fatal("expected error for missing fingerprint")
	}

	validCNAME := []CNAMEProviderFingerprint{{
		Name:        "ok",
		Cname:       []string{"example.net"},
		Fingerprint: "service unavailable",
	}}
	if err := validateCNAMEFingerprints(validCNAME); err != nil {
		t.Fatalf("expected valid cname fingerprints, got error: %v", err)
	}
	if validCNAME[0].Mode != FingerprintModeLiteral {
		t.Fatalf("expected normalized literal mode, got %q", validCNAME[0].Mode)
	}

	if err := validateNSFingerprints([]NSProviderFingerprint{{Name: "", HostPatterns: []string{"*.example.net"}}}); err == nil {
		t.Fatal("expected error for missing ns name")
	}
	if err := validateNSFingerprints([]NSProviderFingerprint{{Name: "ok", HostPatterns: nil}}); err == nil {
		t.Fatal("expected error for missing ns host patterns")
	}
	if err := validateNSFingerprints([]NSProviderFingerprint{{Name: "ok", HostPatterns: []string{""}}}); err == nil {
		t.Fatal("expected error for empty ns host pattern")
	}
	if err := validateNSFingerprints([]NSProviderFingerprint{{Name: "ok", HostPatterns: []string{"*.example.net"}}}); err != nil {
		t.Fatalf("expected valid ns fingerprints, got error: %v", err)
	}
}

func TestLoadJSON(t *testing.T) {
	t.Run("returns read error for missing file", func(t *testing.T) {
		var out []CNAMEProviderFingerprint
		err := loadJSON("data/missing.json", &out)
		if err == nil {
			t.Fatal("expected read error")
		}
	})

	t.Run("returns decode error for invalid target", func(t *testing.T) {
		err := loadJSON("data/cname_fingerprints.json", nil)
		if err == nil {
			t.Fatal("expected decode error")
		}
	})
}
