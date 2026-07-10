package detect

import (
	"embed"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
)

//go:embed data/*.json
var fingerprintFS embed.FS

var (
	loadFingerprintsOnce sync.Once
	loadFingerprintsErr  error
)

func LoadFingerprints() error {
	loadFingerprintsOnce.Do(func() {
		var cname []CNAMEProviderFingerprint
		var ns []NSProviderFingerprint

		if err := loadJSON("data/cname_fingerprints.json", &cname); err != nil {
			loadFingerprintsErr = err
			return
		}

		if err := loadJSON("data/ns_fingerprints.json", &ns); err != nil {
			loadFingerprintsErr = err
			return
		}

		if err := validateCNAMEFingerprints(cname); err != nil {
			loadFingerprintsErr = err
			return
		}

		if err := validateNSFingerprints(ns); err != nil {
			loadFingerprintsErr = err
			return
		}

		CNAMEProviderFingerprints = cname
		NSProviderFingerprints = ns
	})

	return loadFingerprintsErr
}

func loadJSON(path string, out any) error {
	b, err := fingerprintFS.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s: %w", path, err)
	}

	if err := json.Unmarshal(b, out); err != nil {
		return fmt.Errorf("decode %s: %w", path, err)
	}

	return nil
}

func validateCNAMEFingerprints(fingerprints []CNAMEProviderFingerprint) error {
	for i, fp := range fingerprints {
		if strings.TrimSpace(fp.Name) == "" {
			return fmt.Errorf("cname fingerprint[%d] missing name", i)
		}
		if len(fp.Cname) == 0 {
			return fmt.Errorf("cname fingerprint[%d] has no cname patterns", i)
		}

		for j, cname := range fp.Cname {
			if strings.TrimSpace(cname) == "" {
				return fmt.Errorf("cname fingerprint[%d] has empty cname pattern at index %d", i, j)
			}
		}

		if strings.TrimSpace(fp.Fingerprint) == "" {
			return fmt.Errorf("cname fingerprint[%d] missing fingerprint", i)
		}

		fingerprints[i].Mode = normalizeFingerprintMode(fp.Mode, fp.Fingerprint)
	}

	return nil
}

func validateNSFingerprints(fingerprints []NSProviderFingerprint) error {
	for i, fp := range fingerprints {
		if strings.TrimSpace(fp.Name) == "" {
			return fmt.Errorf("ns fingerprint[%d] missing name", i)
		}

		if len(fp.HostPatterns) == 0 {
			return fmt.Errorf("ns fingerprint[%d] has no host patterns", i)
		}

		for j, pattern := range fp.HostPatterns {
			if strings.TrimSpace(pattern) == "" {
				return fmt.Errorf("ns fingerprint[%d] has empty host pattern at index %d", i, j)
			}
		}
	}

	return nil
}
