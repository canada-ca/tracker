export const rawDmarcGuidancePageData = {
	"data": {
		"findDomainByDomain": {
			"domain": "canada.ca",
			"lastRan": "",
			"status": {
				"https": "FAIL",
				"ssl": "FAIL",
				"__typename": "DomainStatus"
			},
			"dmarcPhase": "deploy",
			"hasDMARCReport": false,
			"web": {
				"edges": [
					{
						"node": {
							"results": [
								{
									"ipAddress": "167.40.79.24",
									"status": "complete",
									"results": {
										"tlsResult": {
											"supportsEcdhKeyExchange": false,
											"acceptedCipherSuites": {
												"ssl2-0CipherSuites": [],
												"ssl3-0CipherSuites": [],
												"tls1-0CipherSuites": [],
												"tls1-1CipherSuites": [],
												"tls1-2CipherSuites": [
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
														"strength": "weak"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
														"strength": "weak"
													}
												],
												"tls1-3CipherSuites": []
											},
											"acceptedEllipticCurves": [
												{
													"name": "X25519",
													"strength": "weak"
												},
												{
													"name": "secp256r1",
													"strength": "strong"
												},
												{
													"name": "secp384r1",
													"strength": "strong"
												}
											],
											"positiveTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNQ==",
													"tagId": "ssl5",
													"tagName": "Acceptable-certificate",
													"guidance": "Certificate chain signed using SHA-256/SHA-384/AEAD",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"neutralTags": [],
											"negativeTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNg==",
													"tagId": "ssl6",
													"tagName": "Invalid-cipher",
													"guidance": "One or more ciphers in use are not compliant with guidelines",
													"refLinks": [
														{
															"description": "6.1.3/6.1.4/6.1.5 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												},
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsMTA=",
													"tagId": "ssl10",
													"tagName": "Bad-chain",
													"guidance": "HTTPS certificate chain is invalid",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": null,
															"refLink": null,
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"__typename": "TLSResult"
										},
										"connectionResults": {
											"httpLive": true,
											"httpsLive": true,
											"httpsDowngrades": false,
											"httpImmediatelyUpgrades": true,
											"httpEventuallyUpgrades": false,
											"httpsEventuallyDowngrades": false,
											"hstsParsed": {
												"maxAge": 31536000,
												"includeSubdomains": null,
												"preload": null
											},
											"positiveTags": [],
											"neutralTags": [],
											"negativeTags": [],
											"__typename": "WebConnectionResult"
										},
										"__typename": "WebScanResult"
									},
									"__typename": "WebScan"
								},
								{
									"ipAddress": "160.106.123.29",
									"status": "complete",
									"results": {
										"tlsResult": {
											"supportsEcdhKeyExchange": false,
											"acceptedCipherSuites": {
												"ssl2-0CipherSuites": [],
												"ssl3-0CipherSuites": [],
												"tls1-0CipherSuites": [],
												"tls1-1CipherSuites": [],
												"tls1-2CipherSuites": [
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
														"strength": "weak"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
														"strength": "weak"
													}
												],
												"tls1-3CipherSuites": []
											},
											"acceptedEllipticCurves": [
												{
													"name": "X25519",
													"strength": "weak"
												},
												{
													"name": "secp256r1",
													"strength": "strong"
												},
												{
													"name": "secp384r1",
													"strength": "strong"
												}
											],
											"positiveTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNQ==",
													"tagId": "ssl5",
													"tagName": "Acceptable-certificate",
													"guidance": "Certificate chain signed using SHA-256/SHA-384/AEAD",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"neutralTags": [],
											"negativeTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNg==",
													"tagId": "ssl6",
													"tagName": "Invalid-cipher",
													"guidance": "One or more ciphers in use are not compliant with guidelines",
													"refLinks": [
														{
															"description": "6.1.3/6.1.4/6.1.5 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												},
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsMTA=",
													"tagId": "ssl10",
													"tagName": "Bad-chain",
													"guidance": "HTTPS certificate chain is invalid",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": null,
															"refLink": null,
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"__typename": "TLSResult"
										},
										"connectionResults": {
											"httpLive": true,
											"httpsLive": true,
											"httpsDowngrades": false,
											"httpImmediatelyUpgrades": true,
											"httpEventuallyUpgrades": false,
											"httpsEventuallyDowngrades": false,
											"hstsParsed": {
												"maxAge": 31536000,
												"includeSubdomains": null,
												"preload": null
											},
											"positiveTags": [],
											"neutralTags": [],
											"negativeTags": [],
											"__typename": "WebConnectionResult"
										},
										"__typename": "WebScanResult"
									},
									"__typename": "WebScan"
								},
								{
									"ipAddress": "205.193.215.159",
									"status": "complete",
									"results": {
										"tlsResult": {
											"supportsEcdhKeyExchange": false,
											"acceptedCipherSuites": {
												"ssl2-0CipherSuites": [],
												"ssl3-0CipherSuites": [],
												"tls1-0CipherSuites": [],
												"tls1-1CipherSuites": [],
												"tls1-2CipherSuites": [
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
														"strength": "weak"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
														"strength": "weak"
													}
												],
												"tls1-3CipherSuites": []
											},
											"acceptedEllipticCurves": [
												{
													"name": "X25519",
													"strength": "weak"
												},
												{
													"name": "secp256r1",
													"strength": "strong"
												},
												{
													"name": "secp384r1",
													"strength": "strong"
												}
											],
											"positiveTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNQ==",
													"tagId": "ssl5",
													"tagName": "Acceptable-certificate",
													"guidance": "Certificate chain signed using SHA-256/SHA-384/AEAD",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"neutralTags": [],
											"negativeTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNg==",
													"tagId": "ssl6",
													"tagName": "Invalid-cipher",
													"guidance": "One or more ciphers in use are not compliant with guidelines",
													"refLinks": [
														{
															"description": "6.1.3/6.1.4/6.1.5 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												},
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsMTA=",
													"tagId": "ssl10",
													"tagName": "Bad-chain",
													"guidance": "HTTPS certificate chain is invalid",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": null,
															"refLink": null,
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"__typename": "TLSResult"
										},
										"connectionResults": {
											"httpLive": true,
											"httpsLive": true,
											"httpsDowngrades": false,
											"httpImmediatelyUpgrades": true,
											"httpEventuallyUpgrades": false,
											"httpsEventuallyDowngrades": false,
											"hstsParsed": {
												"maxAge": 31536000,
												"includeSubdomains": null,
												"preload": null
											},
											"positiveTags": [],
											"neutralTags": [],
											"negativeTags": [],
											"__typename": "WebConnectionResult"
										},
										"__typename": "WebScanResult"
									},
									"__typename": "WebScan"
								},
								{
									"ipAddress": "205.193.117.159",
									"status": "complete",
									"results": {
										"tlsResult": {
											"supportsEcdhKeyExchange": false,
											"acceptedCipherSuites": {
												"ssl2-0CipherSuites": [],
												"ssl3-0CipherSuites": [],
												"tls1-0CipherSuites": [],
												"tls1-1CipherSuites": [],
												"tls1-2CipherSuites": [
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
														"strength": "weak"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
														"strength": "strong"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
														"strength": "acceptable"
													},
													{
														"name": "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
														"strength": "weak"
													}
												],
												"tls1-3CipherSuites": []
											},
											"acceptedEllipticCurves": [
												{
													"name": "X25519",
													"strength": "weak"
												},
												{
													"name": "secp256r1",
													"strength": "strong"
												},
												{
													"name": "secp384r1",
													"strength": "strong"
												}
											],
											"positiveTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNQ==",
													"tagId": "ssl5",
													"tagName": "Acceptable-certificate",
													"guidance": "Certificate chain signed using SHA-256/SHA-384/AEAD",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"neutralTags": [],
											"negativeTags": [
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsNg==",
													"tagId": "ssl6",
													"tagName": "Invalid-cipher",
													"guidance": "One or more ciphers in use are not compliant with guidelines",
													"refLinks": [
														{
															"description": "6.1.3/6.1.4/6.1.5 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": "See ITSP.40.062 for approved cipher list",
															"refLink": "https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062",
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												},
												{
													"id": "Z3VpZGFuY2VUYWc6c3NsMTA=",
													"tagId": "ssl10",
													"tagName": "Bad-chain",
													"guidance": "HTTPS certificate chain is invalid",
													"refLinks": [
														{
															"description": "6.1.3 Direction",
															"refLink": "https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html#toc6",
															"__typename": "RefLinks"
														}
													],
													"refLinksTech": [
														{
															"description": null,
															"refLink": null,
															"__typename": "RefLinks"
														}
													],
													"__typename": "GuidanceTag"
												}
											],
											"__typename": "TLSResult"
										},
										"connectionResults": {
											"httpLive": true,
											"httpsLive": true,
											"httpsDowngrades": false,
											"httpImmediatelyUpgrades": true,
											"httpEventuallyUpgrades": false,
											"httpsEventuallyDowngrades": false,
											"hstsParsed": {
												"maxAge": 31536000,
												"includeSubdomains": null,
												"preload": null
											},
											"positiveTags": [],
											"neutralTags": [],
											"negativeTags": [],
											"__typename": "WebConnectionResult"
										},
										"__typename": "WebScanResult"
									},
									"__typename": "WebScan"
								}
							],
							"__typename": "Web"
						},
						"__typename": "WebEdge"
					}
				],
				"__typename": "WebConnection"
			},
			"dnsScan": {
				"edges": [
					{
						"cursor": "dGltZXN0YW1wOjoyMDIyLTA5LTA3IDE4OjQ5OjI5LjE0MDI5NnxpZDo6MjQ0Mjg1",
						"node": {
							"id": "ZG5zOjI0NDI4NQ==",
							"dkim": {
								"selectors": [
									{
										"selector": "selector1",
										"positiveTags": [],
										"neutralTags": [
											{
												"id": "Z3VpZGFuY2VUYWc6ZGtpbTc=",
												"tagId": "dkim7",
												"tagName": "P-2048",
												"guidance": "Public key RSA and key length 2048",
												"refLinks": [
													{
														"description": "B.2.2 Cryptographic Considerations",
														"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb22",
														"__typename": "RefLinks"
													}
												],
												"refLinksTech": [
													{
														"description": "RFC 6376 (DKIM), 3.3 Signing and Verification Algorithms",
														"refLink": null,
														"__typename": "RefLinks"
													}
												],
												"__typename": "GuidanceTag"
											}
										],
										"negativeTags": [],
										"__typename": "DKIMSelectorResult"
									}
								],
								"__typename": "DKIM"
							},
							"dmarc": {
								"record": "v=DMARC1; p=none; rua=mailto:ssc.dmarc.spc@canada.ca,mailto:dmarc@cyber.gc.ca; adkim=s; aspf=s",
								"pPolicy": "none",
								"spPolicy": "none",
								"pct": 100,
								"positiveTags": [
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmMyMw==",
										"tagId": "dmarc23",
										"tagName": "Valid",
										"guidance": "DMARC record is properly formed",
										"refLinks": [
											{
												"description": "B.3.1 DMARC Records",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									},
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmMxMA==",
										"tagId": "dmarc10",
										"tagName": "RUA-CCCS",
										"guidance": "CCCS as aggregate report destination",
										"refLinks": [
											{
												"description": "B.3.1 DMARC Records",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									}
								],
								"neutralTags": [
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmM0",
										"tagId": "dmarc4",
										"tagName": "P-none",
										"guidance": "DMARC enforcement policy of \"none\"",
										"refLinks": [
											{
												"description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna35",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									},
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmM3",
										"tagId": "dmarc7",
										"tagName": "PCT-100",
										"guidance": "Policy applied to all DMARC failures",
										"refLinks": [
											{
												"description": "B.3.1 DMARC Records",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb31",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									},
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmMxMw==",
										"tagId": "dmarc13",
										"tagName": "RUF-none",
										"guidance": "No forensic report destinations",
										"refLinks": [
											{
												"description": "2.4.2 DMARC Reporting",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a242",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									},
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmMxNA==",
										"tagId": "dmarc14",
										"tagName": "TXT-DMARC-enabled",
										"guidance": "Third-party report destinations valid",
										"refLinks": [
											{
												"description": "3.2.3 Third Parties and DMARC",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#a323",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 7.1 Verifying External Destinations",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									},
									{
										"id": "Z3VpZGFuY2VUYWc6ZG1hcmMxNw==",
										"tagId": "dmarc17",
										"tagName": "SP-none",
										"guidance": "Subdomain policy of \"none\"",
										"refLinks": [
											{
												"description": "A.3.5 Monitor DMARC Reports and Correct Misconfigurations",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna35",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7489 (DMARC), 6.3 General Record Format",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									}
								],
								"negativeTags": [],
								"__typename": "DMARC"
							},
							"spf": {
								"lookups": 3,
								"record": "v=spf1 mx ip4:167.43.9.15 ip4:167.43.9.16/28 ip4:160.106.69.15 ip4:160.106.69.16/28 ip4:205.193.230.128/28 ip4:205.193.216.128/27 ip4:205.193.230.166 ip4:205.193.216.166 include:spf.protection.outlook.com -all",
								"spfDefault": "fail",
								"positiveTags": [
									{
										"id": "Z3VpZGFuY2VUYWc6c3BmMTI=",
										"tagId": "spf12",
										"tagName": "Valid",
										"guidance": "SPF record is properly formed",
										"refLinks": [
											{
												"description": "Implementation Guidance: Email Domain Protection",
												"refLink": "https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7208 (SPF), 3 SPF Records",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									}
								],
								"neutralTags": [
									{
										"id": "Z3VpZGFuY2VUYWc6c3BmOA==",
										"tagId": "spf8",
										"tagName": "ALL-hardfail",
										"guidance": "Record terminated with \"-all\"",
										"refLinks": [
											{
												"description": "B.1.1 SPF Records",
												"refLink": "https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#annb11",
												"__typename": "RefLinks"
											}
										],
										"refLinksTech": [
											{
												"description": "RFC 7208 (SPF), 4.6.2 Mechanisms",
												"refLink": null,
												"__typename": "RefLinks"
											}
										],
										"__typename": "GuidanceTag"
									}
								],
								"negativeTags": [],
								"__typename": "SPF"
							},
							"__typename": "DNSScan"
						},
						"__typename": "DNSScanEdge"
					}
				],
				"__typename": "DNSScanConnection"
			},
			"__typename": "Domain"
		}
	}
}
