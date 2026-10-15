package fingerprints

import (
	"embed"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/rs/zerolog"
)

//go:embed data/*.json
var dataFS embed.FS

var (
	loadOnce sync.Once
	loadErr  error

	cnameProviderFingerprints []CNAMEProviderFingerprint
	nsProviderFingerprints    []NSProviderFingerprint
)

func Load(logger zerolog.Logger) error {
	log := logger.With().Str("component", "fingerprint_loader").Logger()

	loadOnce.Do(func() {
		var cname []CNAMEProviderFingerprint
		var ns []NSProviderFingerprint

		if err := loadJSON("data/cname_fingerprints.json", &cname); err != nil {
			log.Error().Err(err).Str("dataset", "cname_fingerprints").Msg("failed to load fingerprint dataset")
			loadErr = err
			return
		}

		if err := loadJSON("data/ns_fingerprints.json", &ns); err != nil {
			log.Error().Err(err).Str("dataset", "ns_fingerprints").Msg("failed to load fingerprint dataset")
			loadErr = err
			return
		}

		if err := validateCNAMEFingerprints(cname); err != nil {
			log.Error().Err(err).Str("dataset", "cname_fingerprints").Msg("invalid fingerprint dataset")
			loadErr = err
			return
		}

		if err := validateNSFingerprints(ns); err != nil {
			log.Error().Err(err).Str("dataset", "ns_fingerprints").Msg("invalid fingerprint dataset")
			loadErr = err
			return
		}

		cnameProviderFingerprints = cname
		nsProviderFingerprints = ns

		log.Info().Int("cname_fingerprints", len(cname)).Int("ns_fingerprints", len(ns)).Msg("fingerprint datasets loaded")
	})

	return loadErr
}

func CNAME() []CNAMEProviderFingerprint {
	return cnameProviderFingerprints
}

func NS() []NSProviderFingerprint {
	return nsProviderFingerprints
}

func loadJSON(path string, out any) error {
	b, err := dataFS.ReadFile(path)
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

		fingerprints[i].Mode = NormalizeMode(fp.Mode, fp.Fingerprint)
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
