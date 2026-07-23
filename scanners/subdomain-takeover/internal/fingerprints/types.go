package fingerprints

import "strings"

type CNAMEProviderFingerprint struct {
	Cname       []string        `json:"cname"`
	Name        string          `json:"name"`
	Nxdomain    bool            `json:"nxdomain"`
	Fingerprint string          `json:"fingerprint"`
	Mode        FingerprintMode `json:"mode,omitempty"`
}

type FingerprintMode string

const (
	FingerprintModeLiteral FingerprintMode = "literal"
	FingerprintModeRegex   FingerprintMode = "regex"
)

type NSProviderStatus string

const (
	NSStatusVulnerable             NSProviderStatus = "vulnerable"
	NSStatusNotVulnerable          NSProviderStatus = "not_vulnerable"
	NSStatusEdgeCase               NSProviderStatus = "edge_case"
	NSStatusVulnerableWithPurchase NSProviderStatus = "vulnerable_with_purchase"
	NSStatusRegistrationClosed     NSProviderStatus = "registration_closed"
)

type NSProviderFingerprint struct {
	Name            string           `json:"name"`
	ProviderURL     string           `json:"provider_url"`
	Status          NSProviderStatus `json:"status"`
	HostPatterns    []string         `json:"host_patterns"`
	InstructionsURL string           `json:"instructions_url,omitempty"`
	PrivateDNS      bool             `json:"private_dns,omitempty"`
}

func (f *NSProviderFingerprint) ContainsNSHost(host string) bool {
	host = strings.ToLower(strings.TrimSuffix(host, "."))
	for _, pattern := range f.HostPatterns {
		if wildcardHostMatch(pattern, host) {
			return true
		}
	}
	return false
}

func wildcardHostMatch(pattern, host string) bool {
	pattern = strings.ToLower(strings.TrimSuffix(pattern, "."))
	if !strings.Contains(pattern, "*") {
		return host == pattern
	}

	parts := strings.Split(pattern, "*")
	if len(parts) == 2 {
		return strings.HasPrefix(host, parts[0]) && strings.HasSuffix(host, parts[1])
	}

	idx := 0
	for i, part := range parts {
		if part == "" {
			continue
		}

		pos := strings.Index(host[idx:], part)
		if pos < 0 {
			return false
		}

		if i == 0 && !strings.HasPrefix(host, part) {
			return false
		}

		idx += pos + len(part)
	}

	last := parts[len(parts)-1]
	if last != "" && !strings.HasSuffix(host, last) {
		return false
	}

	return true
}

func (f *CNAMEProviderFingerprint) ContainsTarget(target string) bool {
	for _, cname := range f.Cname {
		if strings.HasSuffix(target, cname) {
			return true
		}
	}
	return false
}

func NormalizeMode(mode FingerprintMode, fingerprint string) FingerprintMode {
	if mode == FingerprintModeLiteral || mode == FingerprintModeRegex {
		return mode
	}

	if strings.Contains(fingerprint, ".*") || strings.Contains(fingerprint, "\\") {
		return FingerprintModeRegex
	}

	return FingerprintModeLiteral
}
