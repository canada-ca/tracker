import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'

import { guidanceTagType } from '../../guidance-tag'

export const tlsResultType = new GraphQLObjectType({
  name: 'TLSResult',
  fields: () => ({
    ipAddress: {
      type: GraphQLString,
      description: `The IP address of the domain scanned.`,
      resolve: async ({ ipAddress }) => ipAddress,
    },
    serverLocation: {
      type: serverLocationType,
      description: `Information regarding the server which was scanned.`,
      resolve: async ({ serverLocation }) => serverLocation,
    },
    certificateChainInfo: {
      type: certificateChainInfoType,
      description: `Information for the TLS certificate retrieved from the scanned server.`,
      resolve: async ({ certificateChainInfo }) => certificateChainInfo,
    },
    supportsEcdhKeyExchange: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server supports ECDH key exchange.`,
      resolve: async ({ supportsEcdhKeyExchange }) => supportsEcdhKeyExchange,
    },
    heartbleedVulnerable: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server is vulnerable to heartbleed.`,
      resolve: async ({ heartbleedVulnerable }) => heartbleedVulnerable,
    },
    robotVulnerable: {
      type: GraphQLString,
      description: `Whether or not the scanned server is vulnerable to heartbleed.`,
      resolve: async ({ robotVulnerable }) => robotVulnerable,
    },
    ccsInjectionVulnerable: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server is vulnerable to CCS injection.`,
      resolve: async ({ ccsInjectionVulnerable }) => ccsInjectionVulnerable,
    },
    acceptedCipherSuites: {
      type: acceptedCipherSuitesType,
      description: `An object containing the various TLS protocols and which suites are enabled for each protocol.`,
      resolve: async ({ acceptedCipherSuites }) => acceptedCipherSuites,
    },
    acceptedEllipticCurves: {
      type: new GraphQLList(ellipticCurveType),
      description: `List of the scanned servers accepted elliptic curves and their strength.`,
      resolve: async ({ acceptedEllipticCurves }) => acceptedEllipticCurves,
    },
    positiveTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned server from this scan.`,
      resolve: async ({ positiveTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: positiveTags })
      },
    },
    neutralTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned server from this scan.`,
      resolve: async ({ neutralTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: neutralTags })
      },
    },
    negativeTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned server from this scan.`,
      resolve: async ({ negativeTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: negativeTags })
      },
    },
    certificateStatus: {
      type: GraphQLString,
      description: `The compliance status of the certificate bundle for the scanned server from this scan.`,
      resolve: async ({ certificateStatus }) => certificateStatus,
    },
    sslStatus: {
      type: GraphQLString,
      description: `The compliance status for TLS for the scanned server from this scan.`,
      resolve: async ({ sslStatus }) => sslStatus,
    },
    protocolStatus: {
      type: GraphQLString,
      description: `The compliance status for TLS protocol for the scanned server from this scan.`,
      resolve: async ({ protocolStatus }) => protocolStatus,
    },
    cipherStatus: {
      type: GraphQLString,
      description: `The compliance status for cipher suites for the scanned server from this scan.`,
      resolve: async ({ cipherStatus }) => cipherStatus,
    },
    curveStatus: {
      type: GraphQLString,
      description: `The compliance status for ECDH curves for the scanned server from this scan.`,
      resolve: async ({ curveStatus }) => curveStatus,
    },
  }),
  description: `Results of TLS scans on the given domain.`,
})

export const serverLocationType = new GraphQLObjectType({
  name: 'ServerLocation',
  fields: () => ({
    hostname: {
      type: GraphQLString,
      description: `Hostname which was scanned.`,
    },
    ipAddress: {
      type: GraphQLString,
      description: `IP address used for scan.`,
    },
  }),
})

export const trustStoreType = new GraphQLObjectType({
  name: `TrustStore`,
  description: `Trust store used to validate TLS certificate.`,
  fields: () => ({
    name: {
      type: GraphQLString,
      description: `Name of trust store used to validate certificate.`,
    },
    version: {
      type: GraphQLString,
      description: `Version of trust store used to validate certificate.`,
    },
  }),
})

export const pathValidationResultsType = new GraphQLObjectType({
  name: `PathValidationResults`,
  description: `Validation results from each trust store.`,
  fields: () => ({
    opensslErrorString: {
      type: GraphQLString,
      description: `Error string which occurred when attempting to validate certificate if error exists, else null.`,
    },
    wasValidationSuccessful: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate was successfully validated.`,
    },
    trustStore: {
      type: trustStoreType,
      description: `Trust store used to validate TLS certificate.`,
    },
  }),
})

export const certificateType = new GraphQLObjectType({
  name: `Certificate`,
  description: `Certificate from the scanned server.`,
  fields: () => ({
    notValidBefore: {
      type: GraphQLString,
      description: `The date which the certificate becomes initially becomes valid.`,
    },
    notValidAfter: {
      type: GraphQLString,
      description: `The date which the certificate becomes invalid.`,
    },
    issuer: {
      type: GraphQLString,
      description: `The entity which signed the certificate.`,
    },
    subject: {
      type: GraphQLString,
      description: `The entity for which the certificate was created for.`,
    },
    expiredCert: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate is expired.`,
    },
    selfSignedCert: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate is self-signed.`,
    },
    certRevoked: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate has been revoked.`,
    },
    certRevokedStatus: {
      type: GraphQLString,
      description: `The status of the certificate revocation check.`,
    },
    commonNames: {
      type: new GraphQLList(GraphQLString),
      description: `The list of common names for the given certificate.`,
    },
    serialNumber: {
      type: GraphQLString,
      description: `The serial number for the given certificate.`,
    },
    signatureHashAlgorithm: {
      type: GraphQLString,
      description: `The hashing algorithm used to validate this certificate.`,
    },
    sanList: {
      type: new GraphQLList(GraphQLString),
      description: `The list of all alternative (domain)names which can use this certificate.`,
    },
  }),
})

export const certificateChainInfoType = new GraphQLObjectType({
  name: `CertificateChainInfo`,
  description: ``,
  fields: () => ({
    pathValidationResults: {
      type: new GraphQLList(pathValidationResultsType),
      description: `Validation results from each trust store.`,
    },
    badHostname: {
      type: GraphQLBoolean,
      description: `True if domain is not listed on the given TLS certificate.`,
    },
    mustHaveStaple: {
      type: GraphQLBoolean,
      description: `Whether or not the TLS certificate includes the OCSP Must-Staple extension.`,
    },
    leafCertificateIsEv: {
      type: GraphQLBoolean,
      description: `Whether or not the leaf (server) certificate is an Extended Validation (EV) certificate.`,
    },
    receivedChainContainsAnchorCertificate: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate bundle includes the anchor (root) certificate.`,
    },
    receivedChainHasValidOrder: {
      type: GraphQLBoolean,
      description: `Whether or not the certificates in the certificate bundles are in the correct order.`,
    },
    verifiedChainHasSha1Signature: {
      type: GraphQLBoolean,
      description: `Whether or not any certificates in the certificate bundle were signed using the SHA1 algorithm.`,
    },
    verifiedChainHasLegacySymantecAnchor: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate chain includes a distrusted Symantec certificate.`,
    },
    certificateChain: {
      type: new GraphQLList(certificateType),
      description: `The certificate chain which was used to create the TLS connection.`,
    },
    passedValidation: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate chain passed validation.`,
    },
    hasEntrustCertificate: {
      type: GraphQLBoolean,
      description: `Whether or not the certificate chain contains an Entrust certificate.`,
    },
  }),
})

export const acceptedCipherSuitesType = new GraphQLObjectType({
  name: `AcceptedCipherSuites`,
  description: `List of accepted cipher suites separated by TLS version.`,
  fields: () => ({
    ssl2_0CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for SSL2.`,
    },
    ssl3_0CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for SSL3.`,
    },
    tls1_0CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for TLS1.0.`,
    },
    tls1_1CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for TLS1.1.`,
    },
    tls1_2CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for TLS1.2.`,
    },
    tls1_3CipherSuites: {
      type: new GraphQLList(cipherSuiteType),
      description: `Accepted cipher suites for TLS1.3.`,
    },
  }),
})

export const cipherSuiteType = new GraphQLObjectType({
  name: `CipherSuite`,
  description: `Cipher suite information.`,
  fields: () => ({
    name: {
      type: GraphQLString,
      description: `The name of the cipher suite`,
    },
    strength: {
      type: GraphQLString,
      description: `The strength of the cipher suite.`,
    },
  }),
})

export const ellipticCurveType = new GraphQLObjectType({
  name: `EllipticCurve`,
  description: `Elliptic curve information.`,
  fields: () => ({
    name: {
      type: GraphQLString,
      description: `The name of the elliptic curve.`,
    },
    strength: {
      type: GraphQLString,
      description: `The strength of the elliptic curve.`,
    },
  }),
})
