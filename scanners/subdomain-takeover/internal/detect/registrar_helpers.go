package detect

import "strings"

func normalizeOrgName(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	if s == "" {
		return ""
	}

	// Replace punctuation/separators with spaces.
	replacer := strings.NewReplacer(
		".", " ",
		",", " ",
		";", " ",
		":", " ",
		"(", " ",
		")", " ",
		"[", " ",
		"]", " ",
		"{", " ",
		"}", " ",
		"/", " ",
		"\\", " ",
		"-", " ",
		"_", " ",
		"&", " and ",
		"'", "",
		"\"", "",
	)
	s = replacer.Replace(s)

	// Collapse repeated whitespace.
	s = strings.Join(strings.Fields(s), " ")
	if s == "" {
		return ""
	}

	// Remove common legal/company suffixes and generic noise words.
	stop := map[string]struct{}{
		"inc": {}, "incorporated": {}, "llc": {}, "l l c": {}, "ltd": {}, "limited": {},
		"corp": {}, "corporation": {}, "co": {}, "company": {}, "gmbh": {}, "ag": {},
		"sa": {}, "s a": {}, "sas": {}, "plc": {}, "pte": {}, "bv": {}, "nv": {},
		"the": {}, "group": {}, "holdings": {}, "technologies": {}, "technology": {},
		"services": {}, "service": {},
	}

	tokens := strings.Fields(s)
	out := make([]string, 0, len(tokens))
	for _, t := range tokens {
		if _, drop := stop[t]; drop {
			continue
		}
		out = append(out, t)
	}

	return strings.Join(out, " ")
}
func canonicalProviderKey(raw string) string {

	var canonicalProviderAliases = map[string][]string{
		"aws-route53": {
			"aws route 53", "route 53", "route53", "amazon route 53", "amazon web services", "aws",
		},
		"azure-dns": {
			"azure", "azure dns", "microsoft", "microsoft azure",
		},
		"cloudflare": {
			"cloudflare", "cloudflare inc",
		},
		"digitalocean": {
			"digital ocean", "digitalocean",
		},
		"dnsmadeeasy": {
			"dns made easy", "dnsmadeeasy",
		},
		"dnsimple": {
			"dnsimple",
		},
		"domaincom": {
			"domain com", "domain.com", "domain",
		},
		"dreamhost": {
			"dreamhost",
		},
		"easydns": {
			"easydns", "easy dns",
		},
		"gandi": {
			"gandi", "gandi sas", "gandi.net",
		},
		"google-cloud-dns": {
			"google cloud", "google cloud dns", "google domains", "googledomains", "google",
		},
		"hurricane-electric": {
			"hurricane electric", "he net", "he",
		},
		"linode": {
			"linode", "akamai linode", "akamai",
		},
		"namecom": {
			"name.com", "name com", "namecom",
		},
		"namecheap": {
			"namecheap",
		},
		"network-solutions": {
			"network solutions", "web.com", "webcom",
		},
		"ns1": {
			"ns1", "nsone", "nsone.net",
		},
		"reg-ru": {
			"reg ru", "reg.ru",
		},
		"tierranet": {
			"tierranet", "tierra net", "domaindiscover",
		},
		"ultradns": {
			"ultradns", "neustar ultradns", "neustar",
		},
		"yahoo-smb": {
			"yahoo small business", "yahoo", "yns",
		},
	}

	s := normalizeOrgName(raw) // lowercase, trim, collapse spaces, strip punctuation/legal suffixes
	if s == "" {
		return ""
	}
	for key, aliases := range canonicalProviderAliases {
		for _, a := range aliases {
			if s == a {
				return key
			}
		}
	}
	return ""
}
