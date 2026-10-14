package detect

import (
	"testing"

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

func strPtr(v string) *string { return &v }

func boolPtr(v bool) *bool { return &v }

func minimalResults(domain string) model.ScanResults {
	return model.ScanResults{Domain: strPtr(domain)}
}

// mustNotPanic runs fn and fails the current test (rather than crashing the
// whole test binary) if it panics, so one nil-dereference doesn't mask the
// rest of the suite.
func mustNotPanic[T any](t *testing.T, fn func() T) (result T) {
	t.Helper()
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("unexpected panic: %v", r)
		}
	}()
	return fn()
}
