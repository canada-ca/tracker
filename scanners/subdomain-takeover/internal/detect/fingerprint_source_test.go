package detect

import (
	"testing"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/rs/zerolog"
)

func TestGlobalFingerprintSource(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}

	src := GlobalFingerprintSource{}
	if got := src.CNAME(); len(got) == 0 {
		t.Fatal("expected cname source to be populated")
	}
	if got := src.NS(); len(got) == 0 {
		t.Fatal("expected ns source to be populated")
	}
}
