// Scan document builders. Shapes mirror what the scanners store (camelCased):
//   dns     → scanners/dns-processor/dns_processor/dns_processor.py (process_results)
//   webScan → scanners/web-processor/web_processor/web_processor.py (process_results)
// Tag ids come from dns-guidance.json and the tag logic in web_processor.py.

const tags = (positiveTags = [], neutralTags = [], negativeTags = []) => ({ positiveTags, neutralTags, negativeTags })

const PROFILES = {
  pass: {
    dmarc: {
      status: 'pass',
      record: 'v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@cyber.gc.ca',
      policy: 'reject',
      pct: 100,
      phase: 'maintain',
      tags: tags(['dmarc10', 'dmarc23']),
    },
    spf: { status: 'pass', record: 'v=spf1 include:_spf.example.com -all', spfDefault: '-all', tags: tags(['spf12']) },
    dkim: { status: 'pass', selectorStatus: 'pass', tags: tags() },
    connection: {
      httpsStatus: 'pass',
      hstsStatus: 'pass',
      httpImmediatelyUpgrades: true,
      hstsHeader: 'max-age=31536000; includeSubDomains; preload',
      tags: tags(['https15', 'https16']),
    },
    tls: {
      sslStatus: 'pass',
      certificateStatus: 'pass',
      protocolStatus: 'pass',
      cipherStatus: 'pass',
      curveStatus: 'pass',
      acceptsLegacyProtocols: false,
      tags: tags(['ssl18', 'ssl19', 'ssl20', 'ssl21']),
    },
  },
  mixed: {
    dmarc: {
      status: 'pass',
      record: 'v=DMARC1; p=none; rua=mailto:dmarc@cyber.gc.ca',
      policy: 'none',
      pct: null,
      phase: 'deploy',
      tags: tags(['dmarc10', 'dmarc23']),
    },
    spf: { status: 'fail', record: 'v=spf1 include:_spf.example.com ?all', spfDefault: '?all', tags: tags([], [], ['spf2']) },
    dkim: { status: 'info', selectorStatus: null, tags: tags() },
    connection: {
      httpsStatus: 'pass',
      hstsStatus: 'fail',
      httpImmediatelyUpgrades: true,
      hstsHeader: null,
      tags: tags(['https15'], [], ['https9']),
    },
    tls: {
      sslStatus: 'pass',
      certificateStatus: 'pass',
      protocolStatus: 'pass',
      cipherStatus: 'pass',
      curveStatus: 'pass',
      acceptsLegacyProtocols: false,
      tags: tags(['ssl18', 'ssl19', 'ssl20', 'ssl21']),
    },
  },
  fail: {
    dmarc: {
      status: 'fail',
      record: null,
      policy: null,
      pct: null,
      phase: 'assess',
      tags: tags([], [], ['dmarc2']),
    },
    spf: { status: 'fail', record: null, spfDefault: null, tags: tags([], [], ['spf2']) },
    dkim: { status: 'fail', selectorStatus: 'fail', tags: tags([], [], ['dkim13']) },
    connection: {
      httpsStatus: 'fail',
      hstsStatus: 'fail',
      httpImmediatelyUpgrades: false,
      hstsHeader: null,
      tags: tags([], [], ['https7', 'https9']),
    },
    tls: {
      sslStatus: 'fail',
      certificateStatus: 'pass',
      protocolStatus: 'fail',
      cipherStatus: 'fail',
      curveStatus: 'pass',
      acceptsLegacyProtocols: true,
      tags: tags(['ssl20', 'ssl21'], [], ['ssl6', 'ssl24']),
    },
  },
}

const SELECTOR = 'selector1'

const ipForDomain = (domainIndex) => `192.0.2.${domainIndex + 10}`

const buildDkim = (dkim) => {
  const selectors = dkim.selectorStatus
    ? {
        [SELECTOR]: {
          status: dkim.selectorStatus,
          record: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA',
          parsed: { v: 'DKIM1', k: 'rsa' },
          keyLength: dkim.selectorStatus === 'pass' ? 2048 : 1024,
          keyType: 'rsa',
          publicExponent: 65537,
          keyModulus: '2463038212019282919181',
          ...dkim.tags,
        },
      }
    : {}
  return { status: dkim.status, ...dkim.tags, selectors }
}

const buildDnsScan = ({ domain, ip, profile, timestamp }) => {
  const { dmarc, spf, dkim } = PROFILES[profile]
  return {
    timestamp,
    durationSeconds: 1.42,
    domain,
    baseDomain: domain,
    recordExists: true,
    rcode: 'NOERROR',
    resolveChain: [[`${domain}. 300 IN A ${ip}`]],
    resolveIps: [ip],
    cnameRecord: null,
    mxRecords: {
      hosts: [{ preference: 10, hostname: `mail.${domain}`, addresses: [ip] }],
      warnings: [],
      diff: false,
    },
    nsRecords: { hostnames: [`ns1.${domain}`, `ns2.${domain}`], warnings: [] },
    zoneApex: domain,
    zoneDnssecEnabled: false,
    wildcardSibling: false,
    wildcardEntry: false,
    dmarc: {
      status: dmarc.status,
      location: domain,
      record: dmarc.record,
      hasCyberRua: dmarc.tags.positiveTags.includes('dmarc10'),
      pPolicy: dmarc.policy,
      spPolicy: dmarc.policy,
      effectivePolicySource: dmarc.policy ? 'p' : null,
      effectivePolicy: dmarc.policy,
      pct: dmarc.pct,
      phase: dmarc.phase,
      ...dmarc.tags,
    },
    spf: {
      status: spf.status,
      record: spf.record,
      valid: spf.record !== null,
      lookups: spf.record ? 1 : 0,
      spfDefault: spf.spfDefault,
      parsed: { include: spf.record ? ['_spf.example.com'] : [], redirect: null, duplicateInclude: [] },
      warnings: [],
      ...spf.tags,
    },
    dkim: buildDkim(dkim),
  }
}

const buildCipherSuites = (acceptsLegacyProtocols) => ({
  ssl2_0CipherSuites: [],
  ssl3_0CipherSuites: [],
  tls1_0CipherSuites: acceptsLegacyProtocols ? [{ name: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA', strength: 'weak' }] : [],
  tls1_1CipherSuites: [],
  tls1_2CipherSuites: [{ name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', strength: 'strong' }],
  tls1_3CipherSuites: [{ name: 'TLS_AES_256_GCM_SHA384', strength: 'strong' }],
})

const buildCertificateChainInfo = ({ domain, timestamp }) => {
  const issuedAt = new Date(timestamp)
  const expiresAt = new Date(issuedAt.getTime() + 90 * 24 * 60 * 60 * 1000)
  return {
    pathValidationResults: [
      { opensslErrorString: null, wasValidationSuccessful: true, trustStore: { name: 'Mozilla', version: '2024-01-01' } },
    ],
    badHostname: false,
    mustHaveStaple: false,
    leafCertificateIsEv: false,
    receivedChainContainsAnchorCertificate: false,
    receivedChainHasValidOrder: true,
    verifiedChainHasSha1Signature: false,
    verifiedChainHasLegacySymantecAnchor: false,
    passedValidation: true,
    hasEntrustCertificate: false,
    certificateChain: [
      {
        notValidBefore: issuedAt.toISOString(),
        notValidAfter: expiresAt.toISOString(),
        issuer: 'CN=Dev Seed CA,O=Dev Seed,C=CA',
        subject: `CN=${domain}`,
        expiredCert: false,
        selfSignedCert: false,
        certRevoked: false,
        certRevokedStatus: 'good',
        commonNames: [domain],
        serialNumber: '1234567890',
        signatureHashAlgorithm: 'sha256',
        sanList: [domain],
      },
    ],
  }
}

const buildConnectionChain = ({ scheme, domain, statusCode, redirectTo, headers }) => ({
  scheme,
  domain,
  uri: `${scheme}://${domain}`,
  hasRedirectLoop: false,
  connections: [
    {
      uri: `${scheme}://${domain}`,
      scheme,
      error: null,
      connection: {
        url: `${scheme}://${domain}`,
        statusCode,
        redirectTo,
        headers,
        blockedCategory: null,
        HSTS: headers.Strict_Transport_Security !== undefined,
      },
    },
  ],
  securityTxt: [],
})

const buildConnectionResults = ({ domain, ip, connection }) => {
  const httpsHeaders = connection.hstsHeader ? { Strict_Transport_Security: connection.hstsHeader } : {}
  return {
    ...connection.tags,
    hstsStatus: connection.hstsStatus,
    httpsStatus: connection.httpsStatus,
    httpLive: true,
    httpsLive: true,
    httpImmediatelyUpgrades: connection.httpImmediatelyUpgrades,
    httpEventuallyUpgrades: connection.httpImmediatelyUpgrades,
    httpsImmediatelyDowngrades: false,
    httpsEventuallyDowngrades: false,
    hstsParsed: connection.hstsHeader ? { maxAge: 31536000, includeSubdomains: true, preload: true } : null,
    domain,
    ipAddress: ip,
    httpChainResult: buildConnectionChain({
      scheme: 'http',
      domain,
      statusCode: connection.httpImmediatelyUpgrades ? 301 : 200,
      redirectTo: connection.httpImmediatelyUpgrades ? `https://${domain}` : null,
      headers: {},
    }),
    httpsChainResult: buildConnectionChain({
      scheme: 'https',
      domain,
      statusCode: 200,
      redirectTo: null,
      headers: httpsHeaders,
    }),
  }
}

const buildTlsResult = ({ domain, ip, tls, timestamp }) => ({
  domain,
  ipAddress: ip,
  serverLocation: { hostname: domain, ipAddress: ip },
  canConnectAfterScan: true,
  certificateChainInfo: buildCertificateChainInfo({ domain, timestamp }),
  supportsEcdhKeyExchange: true,
  heartbleedVulnerable: false,
  ccsInjectionVulnerable: false,
  robotVulnerable: 'NOT_VULNERABLE_NO_ORACLE',
  acceptedCipherSuites: buildCipherSuites(tls.acceptsLegacyProtocols),
  acceptedEllipticCurves: [{ name: 'secp384r1', strength: 'strong' }],
  ...tls.tags,
  sslStatus: tls.sslStatus,
  certificateStatus: tls.certificateStatus,
  protocolStatus: tls.protocolStatus,
  cipherStatus: tls.cipherStatus,
  curveStatus: tls.curveStatus,
})

const buildWebScan = ({ domain, ip, profile, timestamp }) => {
  const { connection, tls } = PROFILES[profile]
  return {
    status: 'complete',
    ipAddress: ip,
    isPrivateIp: false,
    results: {
      timestamp,
      durationSeconds: 3.17,
      tlsResult: buildTlsResult({ domain, ip, tls, timestamp }),
      connectionResults: buildConnectionResults({ domain, ip, connection }),
    },
  }
}

// Domain fields the dns- and web-processors write after a scan.
const domainFieldsFromScan = ({ dnsScan, webScan }) => {
  const { tlsResult, connectionResults } = webScan.results
  return {
    status: {
      dmarc: dnsScan.dmarc.status,
      spf: dnsScan.spf.status,
      dkim: dnsScan.dkim.status,
      https: connectionResults.httpsStatus,
      hsts: connectionResults.hstsStatus,
      ssl: tlsResult.sslStatus,
      protocols: tlsResult.protocolStatus,
      ciphers: tlsResult.cipherStatus,
      curves: tlsResult.curveStatus,
      certificates: tlsResult.certificateStatus,
    },
    rcode: dnsScan.rcode,
    phase: dnsScan.dmarc.phase,
    dmarcLocation: dnsScan.dmarc.location,
    hasCyberRua: dnsScan.dmarc.hasCyberRua,
    wildcardSibling: dnsScan.wildcardSibling,
    wildcardEntry: dnsScan.wildcardEntry,
    negativeTags: {
      dns: [...dnsScan.spf.negativeTags, ...dnsScan.dmarc.negativeTags, ...dnsScan.dkim.negativeTags],
      web: [...new Set([...tlsResult.negativeTags, ...connectionResults.negativeTags])],
    },
    blocked: false,
    webScanPending: false,
    hasEntrustCertificate: tlsResult.certificateChainInfo.hasEntrustCertificate,
  }
}

module.exports = { SELECTOR, ipForDomain, buildDnsScan, buildWebScan, domainFieldsFromScan }
