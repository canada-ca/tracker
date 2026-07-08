package detect

import "strings"

type Fingerprint struct {
	Cname       []string
	Name        string
	Nxdomain    bool
	Fingerprint string
}

type NSProviderStatus string

const (
	NSStatusVulnerable             NSProviderStatus = "vulnerable"
	NSStatusNotVulnerable          NSProviderStatus = "not_vulnerable"
	NSStatusEdgeCase               NSProviderStatus = "edge_case"
	NSStatusVulnerableWithPurchase NSProviderStatus = "vulnerable_with_purchase"
	NSStatusRegistrationClosed     NSProviderStatus = "registration_closed"
)

type NSProviderFingerprint struct {
	Name            string
	ProviderURL     string
	Status          NSProviderStatus
	HostPatterns    []string
	InstructionsURL string
	PrivateDNS      bool
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

var NSProviderFingerprints = []NSProviderFingerprint{
	{
		Name:            "000Domains",
		ProviderURL:     "https://000domains.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.000domains.com", "ns2.000domains.com", "fwns1.000domains.com", "fwns2.000domains.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/19",
	},
	{
		Name:            "AWS Route 53",
		ProviderURL:     "https://aws.amazon.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns-*.awsdns-*.org", "ns-*.awsdns-*.co.uk", "ns-*.awsdns-*.com", "ns-*.awsdns-*.net"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/1",
	},
	{
		Name:            "Azure (Microsoft)",
		ProviderURL:     "https://azure.microsoft.com/",
		Status:          NSStatusEdgeCase,
		HostPatterns:    []string{"ns1-*.azure-dns.com", "ns2-*.azure-dns.net", "ns3-*.azure-dns.org", "ns4-*.azure-dns.info"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/5",
	},
	{
		Name:            "BigCommerce",
		ProviderURL:     "https://bigcommerce.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.bigcommerce.com", "ns2.bigcommerce.com", "ns3.bigcommerce.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/35",
	},
	{
		Name:            "Bizland",
		ProviderURL:     "https://bizland.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.bizland.com", "ns2.bizland.com", "clickme.click2site.com", "clickme2.click2site.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/3",
	},
	{
		Name:         "ClouDNS",
		ProviderURL:  "https://cloudns.net/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"*.cloudns.net"},
	},
	{
		Name:            "Cloudflare",
		ProviderURL:     "https://cloudflare.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"*.ns.cloudflare.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/10",
	},
	{
		Name:            "Digital Ocean",
		ProviderURL:     "https://digitalocean.com/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.digitalocean.com", "ns2.digitalocean.com", "ns3.digitalocean.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/22",
	},
	{
		Name:            "DNSMadeEasy",
		ProviderURL:     "https://dnsmadeeasy.com/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns*.dnsmadeeasy.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/6",
	},
	{
		Name:            "DNSimple",
		ProviderURL:     "https://dnsimple.com/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.dnsimple.com", "ns2.dnsimple.com", "ns3.dnsimple.com", "ns4.dnsimple.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/16",
	},
	{
		Name:            "Domain.com",
		ProviderURL:     "https://domain.com/",
		Status:          NSStatusVulnerableWithPurchase,
		HostPatterns:    []string{"ns1.domain.com", "ns2.domain.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/17",
	},
	{
		Name:            "DomainPeople",
		ProviderURL:     "https://domainpeople.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.domainpeople.com", "ns2.domainpeople.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/14",
	},
	{
		Name:            "Dotster",
		ProviderURL:     "https://dotster.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.dotster.com", "ns2.dotster.com", "ns1.nameresolve.com", "ns2.nameresolve.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/18",
	},
	{
		Name:            "Dreamhost",
		ProviderURL:     "https://dreamhost.com/",
		Status:          NSStatusEdgeCase,
		HostPatterns:    []string{"ns1.dreamhost.com", "ns2.dreamhost.com", "ns3.dreamhost.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/40",
	},
	{
		Name:            "EasyDNS",
		ProviderURL:     "https://easydns.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"dns1.easydns.com", "dns2.easydns.net", "dns3.easydns.org", "dns4.easydns.info"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/9",
	},
	{
		Name:         "Gandi.net",
		ProviderURL:  "https://gandi.net/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"a.dns.gandi.net", "b.dns.gandi.net", "c.dns.gandi.net"},
	},
	{
		Name:            "Google Cloud",
		ProviderURL:     "https://cloud.google.com/",
		Status:          NSStatusEdgeCase,
		HostPatterns:    []string{"ns-cloud-*.googledomains.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/2",
	},
	{
		Name:         "Hostinger (old NS)",
		ProviderURL:  "https://hostinger.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns1.hostinger.com", "ns2.hostinger.com"},
	},
	{
		Name:            "Hover",
		ProviderURL:     "https://hover.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.hover.com", "ns2.hover.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/21",
	},
	{
		Name:            "Hurricane Electric",
		ProviderURL:     "https://dns.he.net/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.he.net", "ns2.he.net", "ns3.he.net", "ns4.he.net", "ns5.he.net"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/25",
	},
	{
		Name:            "Linode",
		ProviderURL:     "https://linode.com/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.linode.com", "ns2.linode.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/26",
	},
	{
		Name:            "MediaTemple (mt)",
		ProviderURL:     "https://mediatemple.net/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.mediatemple.net", "ns2.mediatemple.net"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/23",
	},
	{
		Name:            "MyDomain",
		ProviderURL:     "https://mydomain.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns1.mydomain.com", "ns2.mydomain.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/4",
	},
	{
		Name:            "Name.com",
		ProviderURL:     "https://name.com/",
		Status:          NSStatusVulnerableWithPurchase,
		HostPatterns:    []string{"ns1*.name.com", "ns2*.name.com", "ns3*.name.com", "ns4*.name.com"},
		InstructionsURL: "https://github.com/libertalialtd/can-i-take-over-dns/issues/8",
	},
	{
		Name:         "Namecheap",
		ProviderURL:  "https://namecheap.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"*.namecheaphosting.com", "*.registrar-servers.com"},
	},
	{
		Name:            "Network Solutions",
		ProviderURL:     "https://networksolutions.com/",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"ns*.worldnic.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/15",
	},
	{
		Name:            "NS1",
		ProviderURL:     "https://nsone.net/",
		Status:          NSStatusRegistrationClosed,
		HostPatterns:    []string{"dns1.p*.nsone.net", "dns2.p*.nsone.net", "dns3.p*.nsone.net", "dns4.p*.nsone.net"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/7",
	},
	{
		Name:            "TierraNet",
		ProviderURL:     "https://tierra.net/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.domaindiscover.com", "ns2.domaindiscover.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/24",
	},
	{
		Name:            "Reg.ru",
		ProviderURL:     "https://reg.ru/",
		Status:          NSStatusVulnerable,
		HostPatterns:    []string{"ns1.reg.ru", "ns2.reg.ru"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/28",
	},
	{
		Name:            "UltraDNS",
		ProviderURL:     "https://www.home.neustar/dns-services/ultra-dns",
		Status:          NSStatusNotVulnerable,
		HostPatterns:    []string{"pdns*.ultradns.com", "udns*.ultradns.com", "sdns*.ultradns.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/29",
	},
	{
		Name:            "Yahoo Small Business",
		ProviderURL:     "https://yahoosmallbusiness.com/",
		Status:          NSStatusVulnerableWithPurchase,
		HostPatterns:    []string{"yns1.yahoo.com", "yns2.yahoo.com"},
		InstructionsURL: "https://github.com/indianajson/can-i-take-over-dns/issues/20",
	},
	{
		Name:         "Activision",
		ProviderURL:  "https://activision.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns*.activision.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Adobe",
		ProviderURL:  "https://adobe.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"adobe-dns-0*.adobe.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Apple",
		ProviderURL:  "https://apple.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"a.ns.apple.com", "b.ns.apple.com", "c.ns.apple.com", "d.ns.apple.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Automattic",
		ProviderURL:  "https://automattic.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns*.automattic.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Capital One",
		ProviderURL:  "https://capitalone.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns*.capitalone.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Disney",
		ProviderURL:  "https://disney.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns*.twdcns.com", "ns*.twdcns.info", "ns*.twdcns.co.uk"},
		PrivateDNS:   true,
	},
	{
		Name:         "Google",
		ProviderURL:  "https://google.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns*.google.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "Lowe's",
		ProviderURL:  "https://lowes.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"authns*.lowes.com"},
		PrivateDNS:   true,
	},
	{
		Name:         "T-Mobile",
		ProviderURL:  "https://tmobileus.com/",
		Status:       NSStatusNotVulnerable,
		HostPatterns: []string{"ns10.tmobileus.com", "ns10.tmobileus.net"},
		PrivateDNS:   true,
	},
}

func (f *Fingerprint) ContainsCname(target string) bool {
	for _, cname := range f.Cname {
		if strings.HasSuffix(target, cname) {
			return true
		}
	}
	return false
}

var Fingerprints = []Fingerprint{
	{
		Cname: []string{
			"elasticbeanstalk.com",
		},
		Nxdomain:    true,
		Name:        "AWS/Elastic Beanstalk",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"s3.amazonaws.com",
		},
		Nxdomain:    false,
		Name:        "AWS/S3",
		Fingerprint: "The specified bucket does not exist",
	},
	{
		Cname: []string{
			"agilecrm.com",
		},
		Nxdomain:    false,
		Name:        "Agile CRM",
		Fingerprint: "Sorry, this page is no longer available.",
	},
	{
		Cname: []string{
			"airee.ru",
		},
		Nxdomain:    false,
		Name:        "Airee.ru",
		Fingerprint: "Ошибка 402. Сервис Айри.рф не оплачен",
	},
	{
		Cname: []string{
			"animaapp.io",
		},
		Nxdomain:    false,
		Name:        "Anima",
		Fingerprint: "The page you were looking for does not exist.",
	},
	{
		Cname: []string{
			"bitbucket.io",
		},
		Nxdomain:    false,
		Name:        "Bitbucket",
		Fingerprint: "Repository not found",
	},
	{
		Cname: []string{
			"trydiscourse.com",
		},
		Nxdomain:    true,
		Name:        "Discourse",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"furyns.com",
		},
		Nxdomain:    false,
		Name:        "Gemfury",
		Fingerprint: "404: This page could not be found.",
	},
	{
		Cname: []string{
			"ghost.io",
		},
		Nxdomain:    false,
		Name:        "Ghost",
		Fingerprint: "Site unavailable\\.&#124;Failed to resolve DNS path for this host",
	},
	{
		Cname: []string{
			"hatenablog.com",
		},
		Nxdomain:    false,
		Name:        "HatenaBlog",
		Fingerprint: "404 Blog is not found",
	},
	{
		Cname: []string{
			"helpjuice.com",
		},
		Nxdomain:    false,
		Name:        "Help Juice",
		Fingerprint: "We could not find what you're looking for.",
	},
	{
		Cname: []string{
			"helpscoutdocs.com",
		},
		Nxdomain:    false,
		Name:        "Help Scout",
		Fingerprint: "No settings were found for this company:",
	},
	{
		Cname: []string{
			"helprace.com",
		},
		Nxdomain:    false,
		Name:        "Helprace",
		Fingerprint: "HTTP_STATUS=301",
	},
	{
		Cname: []string{
			"youtrack.cloud",
		},
		Nxdomain:    false,
		Name:        "JetBrains",
		Fingerprint: "is not a registered InCloud YouTrack",
	},
	{
		Cname: []string{
			"launchrock.com",
		},
		Nxdomain:    false,
		Name:        "LaunchRock",
		Fingerprint: "HTTP_STATUS=500",
	},
	{
		Cname: []string{
			"cloudapp.azure.com",
			"azurewebsites.net",
			"blob.core.windows.net",
			"cloudapp.azure.com",
			"azure-api.net",
			"azurehdinsight.net",
			"azureedge.net",
			"azurecontainer.io",
			"database.windows.net",
			"azuredatalakestore.net",
			"search.windows.net",
			"azurecr.io",
			"redis.cache.windows.net",
			"azurehdinsight.net",
			"servicebus.windows.net",
			"trafficmanager.net",
			"visualstudio.com",
		},
		Nxdomain:    true,
		Name:        "Microsoft Azure",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"ngrok.io",
		},
		Nxdomain:    false,
		Name:        "Ngrok",
		Fingerprint: "Tunnel .*.ngrok.io not found",
	},
	{
		Cname: []string{
			"readme.io",
		},
		Nxdomain:    false,
		Name:        "Readme.io",
		Fingerprint: "The creators of this project are still working on making everything perfect!",
	},
	{
		Cname: []string{
			"52.16.160.97",
		},
		Nxdomain:    false,
		Name:        "SmartJobBoard",
		Fingerprint: "This job board website is either expired or its domain name is invalid.",
	},
	{
		Cname: []string{
			"s.strikinglydns.com",
		},
		Nxdomain:    false,
		Name:        "Strikingly",
		Fingerprint: "PAGE NOT FOUND.",
	},
	{
		Cname: []string{
			"na-west1.surge.sh",
		},
		Nxdomain:    false,
		Name:        "Surge.sh",
		Fingerprint: "project not found",
	},
	{
		Cname: []string{
			"surveysparrow.com",
		},
		Nxdomain:    false,
		Name:        "SurveySparrow",
		Fingerprint: "Account not found.",
	},
	{
		Cname: []string{
			"read.uberflip.com",
		},
		Nxdomain:    false,
		Name:        "Uberflip",
		Fingerprint: "The URL you've accessed does not provide a hub.",
	},
	{
		Cname: []string{
			"stats.uptimerobot.com",
		},
		Nxdomain:    false,
		Name:        "Uptimerobot",
		Fingerprint: "page not found",
	},
	{
		Cname: []string{
			"wordpress.com",
		},
		Nxdomain:    false,
		Name:        "Wordpress",
		Fingerprint: "Do you want to register .*.wordpress.com?",
	},
	{
		Cname: []string{
			"worksites.net",
			"69.164.223.206",
		},
		Nxdomain:    false,
		Name:        "Worksites",
		Fingerprint: "Hello! Sorry, but the website you&rsquo;re looking for doesn&rsquo;t exist.",
	},
}
