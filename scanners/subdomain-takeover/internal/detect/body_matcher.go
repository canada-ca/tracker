package detect

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
)

type BodyFingerprintMatcher interface {
	Contains(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool
}

type HTTPBodyFingerprintMatcher struct {
	client *http.Client
}

func NewHTTPBodyFingerprintMatcher(timeout time.Duration) *HTTPBodyFingerprintMatcher {
	return &HTTPBodyFingerprintMatcher{
		client: &http.Client{Timeout: timeout},
	}
}

type NoopBodyFingerprintMatcher struct{}

func NewNoopBodyFingerprintMatcher() *NoopBodyFingerprintMatcher {
	return &NoopBodyFingerprintMatcher{}
}

func (m *NoopBodyFingerprintMatcher) Contains(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool {
	return false
}

func (m *HTTPBodyFingerprintMatcher) Contains(domain string, fingerprint string, mode fingerprints.FingerprintMode) bool {
	if m == nil || m.client == nil {
		return false
	}

	url := fmt.Sprintf("http://%s", domain)
	res, err := m.client.Get(url)
	if err != nil {
		return false
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return false
	}

	bodyText := string(body)
	resolvedMode := fingerprints.NormalizeMode(mode, fingerprint)

	if resolvedMode == fingerprints.FingerprintModeRegex {
		re, err := regexp.Compile(fingerprint)
		if err != nil {
			return false
		}
		return re.MatchString(bodyText)
	}

	return strings.Contains(bodyText, fingerprint)
}
