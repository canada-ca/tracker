package detect

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
)

func TestNoopBodyFingerprintMatcher(t *testing.T) {
	matcher := NewNoopBodyFingerprintMatcher()
	if matcher.Contains("example.ca", "anything", fingerprints.FingerprintModeLiteral) {
		t.Fatal("noop matcher should never match")
	}
}

func TestHTTPBodyFingerprintMatcher(t *testing.T) {
	t.Run("returns false when matcher/client nil", func(t *testing.T) {
		var matcher *HTTPBodyFingerprintMatcher
		if matcher.Contains("example.ca", "x", fingerprints.FingerprintModeLiteral) {
			t.Fatal("expected false for nil matcher")
		}

		matcher = &HTTPBodyFingerprintMatcher{}
		if matcher.Contains("example.ca", "x", fingerprints.FingerprintModeLiteral) {
			t.Fatal("expected false for nil client")
		}
	})

	t.Run("literal and regex matching", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("Hello from sample app. Error Code: 503"))
		}))
		t.Cleanup(server.Close)

		domain := strings.TrimPrefix(server.URL, "http://")
		matcher := NewHTTPBodyFingerprintMatcher(2 * time.Second)

		if !matcher.Contains(domain, "sample app", fingerprints.FingerprintModeLiteral) {
			t.Fatal("expected literal substring match")
		}
		if !matcher.Contains(domain, `Error Code: \d+`, fingerprints.FingerprintModeRegex) {
			t.Fatal("expected regex match")
		}
		if matcher.Contains(domain, "does-not-exist", fingerprints.FingerprintModeLiteral) {
			t.Fatal("did not expect missing literal to match")
		}
	})

	t.Run("invalid regex returns false", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("anything"))
		}))
		t.Cleanup(server.Close)

		domain := strings.TrimPrefix(server.URL, "http://")
		matcher := NewHTTPBodyFingerprintMatcher(2 * time.Second)
		if matcher.Contains(domain, "(", fingerprints.FingerprintModeRegex) {
			t.Fatal("expected false for invalid regex")
		}
	})
}
