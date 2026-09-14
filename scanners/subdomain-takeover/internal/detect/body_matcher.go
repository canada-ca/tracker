package detect

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
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

var httpStatusFingerprintRegex = regexp.MustCompile(`^HTTP_STATUS=(\d{3})$`)

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

	res, err := m.client.Get(fmt.Sprintf("https://%s", domain))
	if err != nil {
		res, err = m.client.Get(fmt.Sprintf("http://%s", domain))
	}
	if err != nil {
		return false
	}
	defer res.Body.Close()

	if expectedStatus, ok := parseHTTPStatusFingerprint(fingerprint); ok {
		return res.StatusCode == expectedStatus
	}

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

func parseHTTPStatusFingerprint(fingerprint string) (int, bool) {
	matches := httpStatusFingerprintRegex.FindStringSubmatch(fingerprint)
	if len(matches) != 2 {
		return 0, false
	}

	statusCode, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, false
	}

	return statusCode, true
}
