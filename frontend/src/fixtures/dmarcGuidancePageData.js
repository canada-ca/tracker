export const rawDmarcGuidancePageData = {
  data: {
    findDomainByDomain: {
      domain: 'amie.info',
      lastRan: '2019-01-03 20:06:12.437Z',
      rcode: 'Hello World',
      userHasPermission: true,
      status: {
        dkim: 'INFO',
        dmarc: 'INFO',
        https: 'FAIL',
        hsts: 'FAIL',
        protocols: 'INFO',
        ciphers: 'FAIL',
        curves: 'FAIL',
        spf: 'FAIL',
      },
      organizations: {
        edges: [
          {
            node: {
              name: 'Littel - Mueller',
              acronym: 'DFO',
              slug: 'Littel---Mueller',
            },
          },
        ],
      },
      dmarcPhase: 'not implemented',
      hasDMARCReport: true,
      dnsScan: {
        edges: [
          {
            cursor: 'Hello World',
            node: {
              id: '22ec82c7-0565-4f6b-8b31-d23517ad6523',
              domain: 'Hello World',
              timestamp: '2019-06-28 09:33:29.075Z',
              baseDomain: 'Hello World',
              recordExists: false,
              cnameRecord: 'Hello World',
              mxRecords: {
                hosts: [
                  {
                    preference: -12,
                    hostname: 'Hello World',
                    addresses: ['Hello World', 'Hello World'],
                  },
                  {
                    preference: -67,
                    hostname: 'Hello World',
                    addresses: ['Hello World', 'Hello World'],
                  },
                ],
                warnings: ['Hello World', 'Hello World'],
              },
              nsRecords: {
                hostnames: ['Hello World', 'Hello World'],
                warnings: ['Hello World', 'Hello World'],
              },
              dkim: {
                selectors: [
                  {
                    selector: 'Hello World',
                    record: 'Hello World',
                    keyLength: 'Hello World',
                    keyType: 'Hello World',
                    positiveTags: [
                      {
                        id: '74811dba-d549-4f38-a44f-4bcf5ee466c0',
                        tagId: 'tag3',
                        tagName: 'TAG-bad-chain',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description: 'Libero enim ut nihil cum enim.',
                            refLink: 'https://jarrell.biz',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Dolorem quis quo.',
                            refLink: 'http://pablo.info',
                          },
                        ],
                      },
                      {
                        id: 'c518170a-eaa6-4e92-9074-1c087f308e95',
                        tagId: 'tag6',
                        tagName: 'TAG-downgraded',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description: 'Dolorem sed libero.',
                            refLink: 'http://rosetta.info',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Omnis deleniti ullam provident nesciunt laudantium laboriosam rerum.',
                            refLink: 'https://leanne.com',
                          },
                        ],
                      },
                    ],
                    neutralTags: [
                      {
                        id: 'a7935214-6232-4de9-b68a-8388f51e3eb4',
                        tagId: 'tag12',
                        tagName: 'TAG-certificate-expired',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description: 'Blanditiis nobis quia labore quaerat quas.',
                            refLink: 'http://buck.name',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Autem quasi atque distinctio qui.',
                            refLink: 'http://xavier.biz',
                          },
                        ],
                      },
                      {
                        id: 'f76a1585-e4b2-4647-af31-de26c0441f31',
                        tagId: 'tag14',
                        tagName: 'TAG-short-age',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description: 'Sequi sint nobis sapiente aliquam soluta doloribus dolorem.',
                            refLink: 'https://doyle.biz',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Quisquam saepe corporis sint debitis cum quo doloremque.',
                            refLink: 'http://jannie.info',
                          },
                        ],
                      },
                    ],
                    negativeTags: [
                      {
                        id: 'd9509cfe-adfc-45db-b0f0-edd1957eee82',
                        tagId: 'tag6',
                        tagName: 'TAG-missing',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description:
                              'Repudiandae consequatur vel est perferendis laborum voluptatibus voluptate ut quis.',
                            refLink: 'https://joelle.org',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Odio repudiandae ea saepe nulla eligendi voluptas.',
                            refLink: 'https://julien.info',
                          },
                        ],
                      },
                      {
                        id: 'eb340f56-a224-4966-b1c0-013f042b5b16',
                        tagId: 'tag9',
                        tagName: 'TAG-downgraded',
                        guidance: 'Hello World',
                        refLinks: [
                          {
                            description: 'Ut quia possimus quisquam fuga voluptatem exercitationem.',
                            refLink: 'https://mallie.com',
                          },
                        ],
                        refLinksTech: [
                          {
                            description: 'Consequatur aut ratione dolorum nam numquam sequi in ipsam.',
                            refLink: 'http://bulah.name',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              dmarc: {
                record: 'Hello World',
                pPolicy: 'Hello World',
                spPolicy: 'Hello World',
                pct: 58,
                positiveTags: [
                  {
                    id: 'd053c83f-919b-412a-af69-b46c128cb09a',
                    tagId: 'tag7',
                    tagName: 'TAG-short-age',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Pariatur reiciendis magni voluptas.',
                        refLink: 'http://pasquale.org',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Aliquid aliquam assumenda fugit qui.',
                        refLink: 'http://carlotta.com',
                      },
                    ],
                  },
                  {
                    id: '95f3f77a-cf84-40d3-9fd7-14915de68398',
                    tagId: 'tag1',
                    tagName: 'TAG-certificate-expired',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Impedit id eius magni aut laborum odit.',
                        refLink: 'http://amie.info',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Error quaerat aliquid nesciunt velit et.',
                        refLink: 'http://ayla.com',
                      },
                    ],
                  },
                ],
                neutralTags: [
                  {
                    id: '47da8959-b3d3-491a-9891-3adc31061341',
                    tagId: 'tag5',
                    tagName: 'TAG-short-age',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Libero optio quod libero sed quas qui optio.',
                        refLink: 'http://ayden.name',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Eligendi exercitationem dolorum sed ipsum.',
                        refLink: 'https://buck.org',
                      },
                    ],
                  },
                  {
                    id: '9774643f-367c-4ced-8199-84b109582cab',
                    tagId: 'tag3',
                    tagName: 'TAG-downgraded',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Aliquam atque aut quam atque impedit aperiam praesentium tempora exercitationem.',
                        refLink: 'http://dalton.name',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Qui veritatis sed architecto et.',
                        refLink: 'https://walton.org',
                      },
                    ],
                  },
                ],
                negativeTags: [
                  {
                    id: 'c603a4c7-d392-4bc0-afc0-0f9d012b283d',
                    tagId: 'tag5',
                    tagName: 'TAG-certificate-expired',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Quaerat molestias ut cumque excepturi est dolor dolor.',
                        refLink: 'http://toby.biz',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Pariatur voluptas ullam quisquam.',
                        refLink: 'https://magdalen.net',
                      },
                    ],
                  },
                  {
                    id: '88054351-a6f7-4064-9162-d0e602711001',
                    tagId: 'tag6',
                    tagName: 'TAG-missing',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Enim officiis aut ut molestiae eaque.',
                        refLink: 'https://armani.name',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Blanditiis aspernatur rem est perspiciatis harum et.',
                        refLink: 'http://jackson.com',
                      },
                    ],
                  },
                ],
              },
              spf: {
                lookups: 50,
                record: 'Hello World',
                spfDefault: 'Hello World',
                positiveTags: [
                  {
                    id: 'beb743cc-2238-4b7a-9146-713cd6d6c649',
                    tagId: 'tag3',
                    tagName: 'TAG-short-age',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Esse omnis recusandae.',
                        refLink: 'https://lennie.org',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Beatae dolorum est temporibus laudantium maxime sint accusamus.',
                        refLink: 'https://ruby.name',
                      },
                    ],
                  },
                  {
                    id: '092dad96-72de-4752-85a9-2508ba2b152d',
                    tagId: 'tag9',
                    tagName: 'TAG-missing',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Ullam placeat eius.',
                        refLink: 'https://candida.name',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Ex ipsum dolorum est rerum nihil saepe quasi.',
                        refLink: 'https://alexanne.name',
                      },
                    ],
                  },
                ],
                neutralTags: [
                  {
                    id: 'f59c45a6-8e77-4fef-b70f-5e001afe06fc',
                    tagId: 'tag1',
                    tagName: 'TAG-certificate-expired',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Atque id nisi distinctio molestias voluptas quis necessitatibus quia est.',
                        refLink: 'https://consuelo.biz',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Ipsum nesciunt repellendus rem qui neque.',
                        refLink: 'https://ernie.net',
                      },
                    ],
                  },
                  {
                    id: '35fc9222-9a82-41e7-a1ed-d33f1e914bed',
                    tagId: 'tag13',
                    tagName: 'TAG-bad-chain',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Est deserunt voluptatem.',
                        refLink: 'https://brionna.com',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Possimus dignissimos sed.',
                        refLink: 'http://zoey.info',
                      },
                    ],
                  },
                ],
                negativeTags: [
                  {
                    id: 'd5bbeca3-28da-403f-bcfb-e9f7b4064ce4',
                    tagId: 'tag5',
                    tagName: 'TAG-bad-chain',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Porro temporibus et corrupti a sed.',
                        refLink: 'http://candice.biz',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Sapiente aperiam fugiat.',
                        refLink: 'https://noemy.net',
                      },
                    ],
                  },
                  {
                    id: '6aa6d360-d085-4bb7-b64b-39e4e0359088',
                    tagId: 'tag7',
                    tagName: 'TAG-certificate-expired',
                    guidance: 'Hello World',
                    refLinks: [
                      {
                        description: 'Vitae sit aut aut est sed atque.',
                        refLink: 'https://edmond.info',
                      },
                    ],
                    refLinksTech: [
                      {
                        description: 'Error quis sequi porro aut voluptas eius ratione.',
                        refLink: 'http://audrey.info',
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
      web: {
        edges: [
          {
            node: {
              timestamp: '2021-05-24 09:51:49.819Z',
              domain: 'Hello World',
              results: [
                {
                  ipAddress: 'Hello World',
                  status: 'Hello World',
                  results: {
                    timestamp: '2021-11-10 19:06:20.068Z',
                    tlsResult: {
                      ipAddress: 'Hello World',
                      supportsEcdhKeyExchange: true,
                      heartbleedVulnerable: false,
                      ccsInjectionVulnerable: true,
                      acceptedCipherSuites: {
                        ssl2_0CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                        ssl3_0CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                        tls1_0CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                        tls1_1CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                        tls1_2CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                        tls1_3CipherSuites: [
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                          {
                            name: 'Hello World',
                            strength: 'Hello World',
                          },
                        ],
                      },
                      acceptedEllipticCurves: [
                        {
                          name: 'Hello World',
                          strength: 'Hello World',
                        },
                        {
                          name: 'Hello World',
                          strength: 'Hello World',
                        },
                      ],
                      positiveTags: [
                        {
                          id: '7f3b979f-8633-4bf2-b46e-22335067807c',
                          tagId: 'tag12',
                          tagName: 'TAG-bad-chain',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Quia incidunt qui eaque repellendus reprehenderit quos est qui ipsa.',
                              refLink: 'https://efren.net',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Molestias eos quas molestias quod.',
                              refLink: 'https://mara.org',
                            },
                          ],
                        },
                        {
                          id: '84f0b868-d3cc-40bb-b0e9-6da4c5e869cd',
                          tagId: 'tag6',
                          tagName: 'TAG-certificate-expired',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Deleniti unde et consequatur laborum.',
                              refLink: 'https://tamara.net',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Ducimus recusandae asperiores consequatur vitae tempora.',
                              refLink: 'http://renee.net',
                            },
                          ],
                        },
                      ],
                      neutralTags: [
                        {
                          id: 'da7bac84-5ead-491c-ab52-e10f3c106505',
                          tagId: 'tag6',
                          tagName: 'TAG-short-age',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Sed voluptatem laudantium dolorem aperiam nulla nemo et ab.',
                              refLink: 'http://vince.name',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Occaecati unde officiis quam laboriosam.',
                              refLink: 'https://ruth.net',
                            },
                          ],
                        },
                        {
                          id: 'e682bfa0-31d4-4561-a10d-97e8ee5ca5e7',
                          tagId: 'tag11',
                          tagName: 'TAG-certificate-expired',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Explicabo maiores et eum dolorem vitae non exercitationem reiciendis.',
                              refLink: 'https://carlotta.info',
                            },
                          ],
                          refLinksTech: [
                            {
                              description:
                                'Porro molestias earum ducimus reprehenderit repellat aperiam voluptatem sit.',
                              refLink: 'http://arden.name',
                            },
                          ],
                        },
                      ],
                      negativeTags: [
                        {
                          id: '50f137a8-0785-4eff-b15d-7ed87aabc154',
                          tagId: 'tag14',
                          tagName: 'TAG-short-age',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Tempore nam illum et tempore maxime placeat impedit omnis.',
                              refLink: 'http://tanya.net',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Omnis quae iusto ad odit velit inventore.',
                              refLink: 'http://edwin.org',
                            },
                          ],
                        },
                        {
                          id: '7571d7e0-a9aa-47ba-94b9-b66e473b995c',
                          tagId: 'tag3',
                          tagName: 'TAG-downgraded',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Minima cupiditate ea voluptatum.',
                              refLink: 'http://vickie.info',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Natus autem et aut quis voluptate quis in pariatur.',
                              refLink: 'http://nicola.biz',
                            },
                          ],
                        },
                      ],
                      certificateChainInfo: {
                        pathValidationResults: [
                          {
                            opensslErrorString: 'Hello World',
                            wasValidationSuccessful: false,
                            trustStore: {
                              name: 'Hello World',
                              version: 'Hello World',
                            },
                          },
                          {
                            opensslErrorString: 'Hello World',
                            wasValidationSuccessful: false,
                            trustStore: {
                              name: 'Hello World',
                              version: 'Hello World',
                            },
                          },
                        ],
                        badHostname: true,
                        mustHaveStaple: true,
                        leafCertificateIsEv: true,
                        receivedChainContainsAnchorCertificate: true,
                        receivedChainHasValidOrder: true,
                        verifiedChainHasSha1Signature: false,
                        verifiedChainHasLegacySymantecAnchor: true,
                        certificateChain: [
                          {
                            notValidBefore: 'Hello World',
                            notValidAfter: 'Hello World',
                            issuer: 'Hello World',
                            subject: 'Hello World',
                            expiredCert: true,
                            selfSignedCert: false,
                            certRevoked: false,
                            certRevokedStatus: 'Hello World',
                            commonNames: ['Hello World', 'Hello World'],
                            serialNumber: 'Hello World',
                            signatureHashAlgorithm: 'Hello World',
                            sanList: ['Hello World', 'Hello World'],
                          },
                          {
                            notValidBefore: 'Hello World',
                            notValidAfter: 'Hello World',
                            issuer: 'Hello World',
                            subject: 'Hello World',
                            expiredCert: true,
                            selfSignedCert: false,
                            certRevoked: true,
                            certRevokedStatus: 'Hello World',
                            commonNames: ['Hello World', 'Hello World'],
                            serialNumber: 'Hello World',
                            signatureHashAlgorithm: 'Hello World',
                            sanList: ['Hello World', 'Hello World'],
                          },
                        ],
                      },
                    },
                    connectionResults: {
                      httpLive: true,
                      httpsLive: false,
                      httpsStatus: 'Hello World',
                      httpImmediatelyUpgrades: false,
                      httpEventuallyUpgrades: false,
                      httpsImmediatelyDowngrades: false,
                      httpsEventuallyDowngrades: true,
                      hstsParsed: {
                        maxAge: 53,
                        includeSubdomains: false,
                        preload: false,
                      },
                      positiveTags: [
                        {
                          id: 'cae8e9e5-e7d8-4c8b-84cf-a03be2568ffe',
                          tagId: 'tag9',
                          tagName: 'TAG-short-age',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Et doloribus nam porro aut fugit voluptatem aliquid cum.',
                              refLink: 'http://jerry.org',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Libero ipsam aspernatur totam nemo ut possimus.',
                              refLink: 'https://vernon.name',
                            },
                          ],
                        },
                        {
                          id: '19eb2be7-4792-4397-8a3d-6bdf07f50365',
                          tagId: 'tag11',
                          tagName: 'TAG-bad-chain',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Aperiam voluptatibus aliquam sit dolores officia voluptatem ut non.',
                              refLink: 'http://dario.com',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Quo est natus.',
                              refLink: 'http://jody.net',
                            },
                          ],
                        },
                      ],
                      neutralTags: [
                        {
                          id: 'cea82769-2931-4bdc-b117-1d198af4582e',
                          tagId: 'tag14',
                          tagName: 'TAG-missing',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Sit similique voluptate.',
                              refLink: 'https://tyson.org',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Vitae accusantium quo.',
                              refLink: 'http://savanna.biz',
                            },
                          ],
                        },
                        {
                          id: '39cee699-93ee-4eee-a9c6-481e434dafaf',
                          tagId: 'tag2',
                          tagName: 'TAG-missing',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Facilis et sint dolore maiores tempore eos veniam et.',
                              refLink: 'https://alaina.biz',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Dolorem unde veniam non.',
                              refLink: 'http://icie.info',
                            },
                          ],
                        },
                      ],
                      negativeTags: [
                        {
                          id: '89afc976-6612-439b-9862-d8193a0d0a40',
                          tagId: 'tag8',
                          tagName: 'TAG-missing',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Alias harum debitis.',
                              refLink: 'https://alford.net',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Porro qui ea aut nesciunt dignissimos officiis in.',
                              refLink: 'https://carli.biz',
                            },
                          ],
                        },
                        {
                          id: '26c569c1-61a9-46b9-b926-843d12189022',
                          tagId: 'tag5',
                          tagName: 'TAG-downgraded',
                          guidance: 'Hello World',
                          refLinks: [
                            {
                              description: 'Eos dolor doloribus aliquid ad adipisci.',
                              refLink: 'https://angelina.net',
                            },
                          ],
                          refLinksTech: [
                            {
                              description: 'Ut quia ipsum dolorem voluptatem debitis consequatur accusamus at.',
                              refLink: 'http://dorian.biz',
                            },
                          ],
                        },
                      ],
                      httpChainResult: {
                        scheme: 'Hello World',
                        domain: 'Hello World',
                        uri: 'Hello World',
                        hasRedirectLoop: true,
                        connections: [
                          {
                            uri: 'Hello World',
                            connection: {
                              statusCode: 67,
                              redirectTo: 'Hello World',
                              headers: {
                                'Content-Length': '62',
                                'Content-Type': 'text/html; charset=utf-8',
                              },
                              blockedCategory: 'Hello World',
                              HSTS: false,
                            },
                            error: 'Hello World',
                            scheme: 'Hello World',
                          },
                          {
                            uri: 'Hello World',
                            connection: {
                              statusCode: -45,
                              redirectTo: 'Hello World',
                              headers: {
                                'Content-Length': '62',
                                'Content-Type': 'text/html; charset=utf-8',
                              },
                              blockedCategory: 'Hello World',
                              HSTS: false,
                            },
                            error: 'Hello World',
                            scheme: 'Hello World',
                          },
                        ],
                      },
                      httpsChainResult: {
                        scheme: 'Hello World',
                        domain: 'Hello World',
                        uri: 'Hello World',
                        hasRedirectLoop: false,
                        connections: [
                          {
                            uri: 'Hello World',
                            connection: {
                              statusCode: -88,
                              redirectTo: 'Hello World',
                              headers: {
                                'Content-Length': '62',
                                'Content-Type': 'text/html; charset=utf-8',
                              },
                              blockedCategory: 'Hello World',
                              HSTS: true,
                            },
                            error: 'Hello World',
                            scheme: 'Hello World',
                          },
                          {
                            uri: 'Hello World',
                            connection: {
                              statusCode: -98,
                              redirectTo: 'Hello World',
                              headers: {
                                'Content-Length': '62',
                                'Content-Type': 'text/html; charset=utf-8',
                              },
                              blockedCategory: 'Hello World',
                              HSTS: false,
                            },
                            error: 'Hello World',
                            scheme: 'Hello World',
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      additionalFindings: {
        timestamp: '2021-05-24 09:51:49.819Z',
        headers: [],
        locations: [
          {
            city: 'Hello World',
            region: 'Hello World',
            firstSeen: 'Hello World',
            lastSeen: 'Hello World',
          },
        ],
        ports: [
          {
            port: 443,
            lastPortState: 'OPEN',
            portStateFirstSeen: 'Hello World',
            portStateLastSeen: 'Hello World',
          },
        ],
        webComponents: [
          {
            webComponentCategory: 'DDOS Protection',
            webComponentName: 'Hello World',
            webComponentVersion: 'Hello World',
            webComponentFirstSeen: 'Hello World',
            webComponentLastSeen: 'Hello World',
          },
        ],
        vulnerabilities: {
          critical: [
            {
              cve: '2024-11-10',
              cvss3Score: 9.3,
            },
          ],
          high: [],
          medium: [
            {
              cve: '2021-11-10',
              cvss3Score: 5.3,
            },
          ],
          low: [],
        },
      },
    },
  },
}

export const rawDomainGuidancePageDataNoAffiliations = {
  data: {
    findDomainByDomain: {
      domain: 'noaffiliations.gc.ca',
      lastRan: null,
      rcode: 'NOERROR',
      blocked: false,
      wildcardSibling: false,
      webScanPending: false,
      status: {
        certificates: 'PASS',
        ciphers: 'PASS',
        curves: 'PASS',
        dkim: 'FAIL',
        dmarc: 'PASS',
        hsts: 'PASS',
        https: 'PASS',
        protocols: 'PASS',
        spf: 'PASS',
        ssl: 'PASS',
        __typename: 'DomainStatus',
      },
      organizations: {
        edges: [
          {
            node: {
              name: 'Test',
              acronym: 'T',
              slug: 'test',
              id: 'b3JnYW5pemF0aW9uOjMyOTQ4',
              domainCount: 1,
              verified: true,
              userHasPermission: false,
              summaries: null,
              __typename: 'Organization',
            },
            __typename: 'OrganizationEdge',
          },
          {
            node: {
              name: 'Test 2',
              acronym: 'TT',
              slug: 'test-2',
              id: 'b3JnYW5pemF0aW9uOjk1NjEz',
              domainCount: 1,
              verified: true,
              userHasPermission: false,
              summaries: null,
              __typename: 'Organization',
            },
            __typename: 'OrganizationEdge',
          },
          {
            node: {
              name: 'Test 3',
              acronym: 'TTT',
              slug: 'test-3',
              id: 'b3JnYW5pemF0aW9uOjEwNzMwNA==',
              domainCount: 1,
              verified: true,
              userHasPermission: false,
              summaries: null,
              __typename: 'Organization',
            },
            __typename: 'OrganizationEdge',
          },
        ],
        __typename: 'OrganizationConnection',
      },
      dmarcPhase: 'assess',
      hasDMARCReport: false,
      userHasPermission: false,
      mxRecordDiff: null,
      dnsScan: null,
      web: null,
      __typename: 'Domain',
    },
  },
}
