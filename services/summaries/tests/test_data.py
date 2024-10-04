chart_summary_criteria_data = {
    "mailSummaryCriteria": {"pass": ["dmarc23", "dmarc10", "spf12"], "fail": [""]},
    "webSummaryCriteria": {
        "pass": ["ssl5"],
        "fail": [
            "https2",
            "https3",
            "https4",
            "https5",
            "https6",
            "https7",
            "https8",
            "https9",
            "https11",
            "https12",
            "https13",
            "https14",
            "ssl2",
            "ssl3",
            "ssl4",
            "ssl6",
            "ssl7",
            "ssl8",
        ],
    },
}

scan_summary_criteria_data = {
    "httpsScanSummaryCriteria": {
        "pass": [""],
        "fail": [
            "https2",
            "https3",
            "https4",
            "https5",
            "https6",
            "https7",
            "https8",
            "https9",
            "https11",
            "https12",
            "https13",
            "https14",
        ],
        "info": ["https1"],
        "warning": [""],
    },
    "sslScanSummaryCriteria": {
        "pass": ["ssl5"],
        "fail": ["ssl2", "ssl3", "ssl4", "ssl6", "ssl7", "ssl8"],
        "info": ["ssl1"],
        "warning": [""],
    },
    "dkimScanSummaryCriteria": {
        "pass": ["dkim7", "dkim8"],
        "fail": [
            "dkim2",
            "dkim3",
            "dkim4",
            "dkim5",
            "dkim6",
            "dkim9",
            "dkim11",
            "dkim12",
        ],
        "warning": ["dkim10", "dkim13"],
        "info": ["dkim1"],
    },
    "spfScanSummaryCriteria": {
        "pass": "spf12",
        "fail": [""],
        "info": [""],
        "warning": [""],
    },
    "dmarcScanSummaryCriteria": {
        "pass": "dmarc23",
        "fail": [""],
        "info": [""],
        "warning": [""],
    },
}

aggregate_tag_data = {
    "agg1": {
        "tagName": "agg-spf-no-record",
        "guidance": "No SPF record for envelope-from domain",
        "refLinksGuide": [{"description": "SPF record"}],
        "refLinksTechnical": [""],
    },
    "agg2": {
        "tagName": "agg-spf-invalid",
        "guidance": "SPF record is invalid",
        "refLinksGuide": [{"description": "SPF record"}],
        "refLinksTechnical": [""],
    },
    "agg3": {
        "tagName": "agg-spf-failed",
        "guidance": "IP address not authorized for envelope-from or header-from domain",
        "refLinksGuide": [{"description": "SPF record"}],
        "refLinksTechnical": [""],
    },
    "agg4": {
        "tagName": "agg-spf-mismatch",
        "guidance": "Header-from and envelope-from are different public domains",
        "refLinksGuide": [""],
        "refLinksTechnical": [""],
    },
    "agg5": {
        "tagName": "agg-spf-strict",
        "guidance": "Header-from and envelope-from domains are not strictly aligned",
        "refLinksGuide": [{"description": "DMARC record"}],
        "refLinksTechnical": [""],
    },
    "agg6": {
        "tagName": "agg-dkim-unsigned",
        "guidance": "No DKIM signature was applied",
        "refLinksGuide": [""],
        "refLinksTechnical": [""],
    },
    "agg7": {
        "tagName": "agg-dkim-invalid",
        "guidance": "DKIM record is invalid",
        "refLinksGuide": [{"description": "DKIM record"}],
        "refLinksTechnical": [""],
    },
    "agg8": {
        "tagName": "agg-dkim-failed",
        "guidance": "DKIM signature verification failed",
        "refLinksGuide": [{"description": "DKIM record"}],
        "refLinksTechnical": [""],
    },
    "agg9": {
        "tagName": "agg-dkim-mismatch",
        "guidance": "DKIM header and envelope-from are different public domains",
        "refLinksGuide": [""],
        "refLinksTechnical": [""],
    },
    "agg10": {
        "tagName": "agg-dkim-strict",
        "guidance": "DKIM header and envelope-from are not strictly aligned",
        "refLinksGuide": [{"description": "DMARC record"}],
        "refLinksTechnical": [""],
    },
}

dkim_tag_data = {
    "dkim1": {
        "tagName": "DKIM-GC",
        "guidance": "Government of Canada domains subject to TBS guidelines",
        "refLinksGuide": [{"description": "IT PIN"}],
        "refLinksTechnical": [""],
    },
    "dkim2": {
        "tagName": "DKIM-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.3.4 Deploy DKIM for All Domains and Senders",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna34",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim3": {
        "tagName": "DKIM-missing-mx-O365",
        "guidance": "DKIM record missing but MX uses O365.  Follow cloud-specific guidance.",
        "refLinksGuide": [
            {
                "description": "3.2.2 Third Parties and DKIM",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "Microsoft DKIM Guidance",
                "ref_link": "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide",
            }
        ],
    },
    "dkim4": {
        "tagName": "DKIM-missing-O365-misconfigured",
        "guidance": "DKIM CNAMEs do not exist, but MX points to *.onmicrosoft.com and SPF record includes O365",
        "refLinksGuide": [
            {
                "description": "3.2.2 Third Parties and DKIM",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a322",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "Microsoft DKIM Guidance",
                "ref_link": "https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/use-dkim-to-validate-outbound-email?view=o365-worldwide",
            }
        ],
    },
    "dkim5": {
        "tagName": "P-sub1024",
        "guidance": "Public key RSA and key length <1024",
        "refLinksGuide": [
            {
                "description": "B.2.2 Cryptographic Considerations",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim6": {
        "tagName": "P-1024",
        "guidance": "Public key RSA and key length 1024",
        "refLinksGuide": [
            {
                "description": "B.2.2 Cryptographic Considerations",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim7": {
        "tagName": "P-2048",
        "guidance": "Public key RSA and key length 2048",
        "refLinksGuide": [
            {
                "description": "B.2.2 Cryptographic Considerations",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim8": {
        "tagName": "P-4096",
        "guidance": "Public key RSA and key length 4096 or higher",
        "refLinksGuide": [
            {
                "description": "B.2.2 Cryptographic Considerations",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim9": {
        "tagName": "P-invalid",
        "guidance": "Invalid public key",
        "refLinksGuide": [
            {
                "description": "B.2.1 DKIM Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb21",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim10": {
        "tagName": "P-update-recommended",
        "guidance": "Public key in use for longer than 1 year",
        "refLinksGuide": [
            {
                "description": "A.5.3 Rotate DKIM Keys",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna53",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim11": {
        "tagName": "DKIM-invalid-crypto",
        "guidance": "DKIM key does not use RSA",
        "refLinksGuide": [
            {
                "description": "B.2.2 Cryptographic Considerations",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim12": {
        "tagName": "DKIM-value-invalid",
        "guidance": "DKIM TXT record invalid",
        "refLinksGuide": [
            {
                "description": "B.2.1 DKIM Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb21",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dkim13": {
        "tagName": "T-enabled",
        "guidance": "Testing enabled",
        "refLinksGuide": [{"description": "DKIM Flag t"}],
        "refLinksTechnical": [
            {
                "description": "Testing flag t=y means Verifiers MUST treat messages as unsigned (i.e. DKIM is not enabled), so this flag should not be enabled.",
                "tech_link": "https://tools.ietf.org/html/rfc6376#section-3.6.1",
            }
        ],
    },
}

dmarc_tag_data = {
    "dmarc1": {
        "tagName": "DMARC-GC",
        "guidance": "Government of Canada domains subject to TBS guidelines",
        "refLinksGuide": [{"description": "IT PIN", "ref_link": ""}],
        "refLinksTechnical": [""],
    },
    "dmarc2": {
        "tagName": "DMARC-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.2.3 Deploy Initial DMARC record",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dmarc3": {
        "tagName": "P-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.2.3 Deploy Initial DMARC record",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dmarc4": {
        "tagName": "P-none",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna35",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, P",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc5": {
        "tagName": "P-quarantine",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.4 Enforce",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna4",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, P",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc6": {
        "tagName": "P-reject",
        "guidance": "Maintain deployment",
        "refLinksGuide": [
            {
                "description": "A.5 Maintain",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna5",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, P",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc7": {
        "tagName": "PCT-100",
        "guidance": "Policy applies to all of maniflow",
        "refLinksGuide": [
            {
                "description": "B.3.1 DMARC Records",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, PCT",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc8": {
        "tagName": "PCT-xx",
        "guidance": "Policy applies to percentage of maniflow",
        "refLinksGuide": [{"description": "TBD"}],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, PCT",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc9": {
        "tagName": "PCT-invalid",
        "guidance": "Invalid percentage",
        "refLinksGuide": [
            {
                "description": "B.3.1 DMARC Records",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, PCT",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc10": {
        "tagName": "RUA-CCCS",
        "guidance": "CCCS added to Aggregate sender list",
        "refLinksGuide": [
            {
                "description": "B.3.1 DMARC Records",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dmarc11": {
        "tagName": "RUF-CCCS",
        "guidance": "CCCS added to Forensic sender list",
        "refLinksGuide": [{"description": "Missing from guide"}],
        "refLinksTechnical": [""],
    },
    "dmarc12": {
        "tagName": "RUA-none",
        "guidance": "No RUAs defined",
        "refLinksGuide": [
            {
                "description": "Owner has not configured Aggregate reporting.  A.2.3 Deploy Initial DMARC record",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, RUA",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc13": {
        "tagName": "RUF-none",
        "guidance": "No RUFs defined",
        "refLinksGuide": [
            {"description": "Owner has not configured Forensic reporting."}
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, RUF",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc14": {
        "tagName": "TXT-DMARC-enabled",
        "guidance": "Verification TXT records for all 3rd party senders exist",
        "refLinksGuide": [{"description": "TBD"}],
        "refLinksTechnical": [""],
    },
    "dmarc15": {
        "tagName": "TXT-DMARC-missing",
        "guidance": "Verification TXT records for some/all 3rd party senders missing",
        "refLinksGuide": [{"description": "Contact 3rd party"}],
        "refLinksTechnical": [
            {
                "description": "RFC 7.1. Verifying External Destinations",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-7.1",
            }
        ],
    },
    "dmarc16": {
        "tagName": "SP-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.2.3 Deploy Initial DMARC record",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23",
            }
        ],
        "refLinksTechnical": [""],
    },
    "dmarc17": {
        "tagName": "SP-none",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna23",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, SP",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc18": {
        "tagName": "SP-quarantine",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.4 Enforce",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna4",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, SP",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc19": {
        "tagName": "SP-reject",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.5 Maintain",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna5",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, SP",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc20": {
        "tagName": "PCT-none-exists",
        "guidance": "PCT should be 100, or not included if p=none",
        "refLinksGuide": [""],
        "refLinksTechnical": [
            {
                "description": "RFC 6.3 General Record Format, PCT",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-6.3",
            }
        ],
    },
    "dmarc21": {
        "tagName": "PCT-0",
        "guidance": "Policy applies to no part of maniflow - irregular config",
        "refLinksGuide": [
            {
                "description": "B.3.1 DMARC Records",
                "guide_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "pct=0 will use the next lower level of enforcement and may result in irregular mail flow if parsed incorrectly (p=quarantine; pct=0 should be 'none' but mail agents may process messages based on Quarantine)"
            }
        ],
    },
    "dmarc22": {
        "tagName": "CNAME-DMARC",
        "guidance": "Domain uses potentially outsourced DMARC service",
        "refLinksGuide": [""],
        "refLinksTechnical": [
            {
                "description": "RFC 7.1. Verifying External Destinations",
                "tech_link": "https://tools.ietf.org/html/rfc7489#section-7.1",
            }
        ],
    },
    "dmarc23": {
        "tagName": "DMARC-valid",
        "guidance": "DMARC record is properly formed",
        "refLinksGuide": [
            {
                "description": "Implementation Guidance: Email Domain Protection",
                "guide_link": "https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection",
            }
        ],
        "refLinksTechnical": [""],
    },
}

https_tag_data = {
    "https1": {
        "tagName": "HTTPS-GC",
        "guidance": "Government of Canada domains subject to TBS guidelines",
        "refLinksGuide": [
            {
                "description": "ITPIN 2018-01",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https2": {
        "tagName": "HTTPS-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "6.1 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https3": {
        "tagName": "HTTPS-downgraded",
        "guidance": "Canonical HTTPS endpoint internally redirects to HTTP. Follow guidance.",
        "refLinksGuide": [
            {
                "description": "6.1.1 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https4": {
        "tagName": "HTTPS-bad-chain",
        "guidance": "HTTPS certificate chain is invalid",
        "refLinksGuide": [
            {
                "description": "6.1.3 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https5": {
        "tagName": "HTTPS-bad-hostname",
        "guidance": "HTTPS endpoint failed hostname validation",
        "refLinksGuide": [
            {
                "description": "6.1.1 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https6": {
        "tagName": "HTTPS-not-enforced",
        "guidance": "Domain does not enforce HTTPS",
        "refLinksGuide": [
            {
                "description": "6.1.1/6.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https7": {
        "tagName": "HTTPS-weakly-enforced",
        "guidance": "Domain does not default to HTTPS",
        "refLinksGuide": [
            {
                "description": "6.1.1/6.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https8": {
        "tagName": "HTTPS-moderately-enforced",
        "guidance": "Domain defaults to HTTPS, but eventually redirects to HTTP",
        "refLinksGuide": [
            {
                "description": "6.1.1 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https9": {
        "tagName": "HSTS-missing",
        "guidance": "HTTP Strict Transport Security (HSTS) not implemented",
        "refLinksGuide": [
            {
                "description": "6.1.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https10": {
        "tagName": "HSTS-short-age",
        "guidance": "HTTP Strict Transport Security (HSTS) policy maximum age is shorter than one year",
        "refLinksGuide": [
            {
                "description": "6.1.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https11": {
        "tagName": "HSTS-preload-ready",
        "guidance": "Domain not pre-loaded by HSTS, but is pre-load ready",
        "refLinksGuide": [
            {
                "description": "6.1.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https12": {
        "tagName": "HSTS-not-preloaded",
        "guidance": "Domain not pre-loaded by HSTS",
        "refLinksGuide": [
            {
                "description": "6.1.2 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https13": {
        "tagName": "HTTPS-certificate-expired",
        "guidance": "HTTPS certificate is expired",
        "refLinksGuide": [
            {
                "description": "6.1.3 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
    "https14": {
        "tagName": "HTTPS-certificate-self-signed",
        "guidance": "HTTPS certificate is self-signed",
        "refLinksGuide": [
            {
                "description": "6.1.3 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [""],
    },
}

spf_tag_data = {
    "spf1": {
        "tagName": "SPF-GC",
        "guidance": "Government of Canada domains subject to TBS guidelines",
        "refLinksGuide": [{"description": "IT PIN", "ref_link": ""}],
        "refLinksTechnical": [""],
    },
    "spf2": {
        "tagName": "SPF-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "A.3.3 Deploy SPF for All Domains",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna33",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf3": {
        "tagName": "SPF-bad-path",
        "guidance": "SPF implemented in incorrect subdomain",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf4": {
        "tagName": "ALL-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf5": {
        "tagName": "ALL-allow",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf6": {
        "tagName": "ALL-neutral",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf7": {
        "tagName": "ALL-softfail",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf8": {
        "tagName": "ALL-hardfail",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf9": {
        "tagName": "ALL-redirect",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 6.1 redirect: Redirected Query",
                "ref_link": "https://tools.ietf.org/html/rfc7208#section-6.1",
            }
        ],
    },
    "spf10": {
        "tagName": "A-all",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.1 SPF Records",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
            }
        ],
        "refLinksTechnical": [""],
    },
    "spf11": {
        "tagName": "INCLUDE-limit",
        "guidance": "More than 10 lookups -- Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "B.1.3 DNS Lookup Limit",
                "ref_link": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb13",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "RFC 4.6.4 DNS Lookup Limits",
                "ref_link": "https://tools.ietf.org/html/rfc7208#section-4.6.4",
            }
        ],
    },
    "spf12": {
        "tagName": "SPF-valid",
        "guidance": "SPF record is properly formed",
        "refLinksGuide": [
            {
                "description": "Implementation Guidance: Email Domain Protection",
                "guide_link": "https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection",
            }
        ],
        "refLinksTechnical": [""],
    },
}

ssl_tag_data = {
    "ssl1": {
        "tagName": "SSL-GC",
        "guidance": "Government of Canada domains subject to TBS guidelines",
        "refLinksGuide": [
            {
                "description": "ITPIN 2018-01",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html",
            }
        ],
        "refLinksTechnical": [""],
    },
    "ssl2": {
        "tagName": "SSL-missing",
        "guidance": "Follow implementation guide",
        "refLinksGuide": [
            {
                "description": "6.1.3 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl3": {
        "tagName": "SSL-rc4",
        "guidance": "Accepted cipher list contains RC4 stream cipher, as prohibited by BOD 18.01",
        "refLinksGuide": [
            {
                "description": "6.1.5 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl4": {
        "tagName": "SSL-3des",
        "guidance": "Accepted cipher list contains 3DES symmetric-key block cipher, as prohibited by BOD 18-01",
        "refLinksGuide": [
            {
                "description": "6.1.5 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl5": {
        "tagName": "SSL-acceptable-certificate",
        "guidance": "Certificate chain signed using SHA-256/SHA-384/AEAD",
        "refLinksGuide": [
            {
                "description": "6.1.3 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl6": {
        "tagName": "SSL-invalid-cipher",
        "guidance": "One or more ciphers in use are not compliant with guidelines",
        "refLinksGuide": [
            {
                "description": "6.1.3/6.1.4/6.1.5 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl7": {
        "tagName": "Vulnerability-heartbleed",
        "guidance": "Vulnerable to heartbleed bug",
        "refLinksGuide": [
            {
                "description": "6.1.3/6.1.4 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
    "ssl8": {
        "tagName": "Vulnerability-ccs-injection",
        "guidance": "Vulnerable to OpenSSL CCS Injection",
        "refLinksGuide": [
            {
                "description": "6.1.3/6.1.4 Direction",
                "ref_link": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
            }
        ],
        "refLinksTechnical": [
            {
                "description": "See ITSP.40.062 for approved cipher list",
                "ref_link": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
            }
        ],
    },
}
