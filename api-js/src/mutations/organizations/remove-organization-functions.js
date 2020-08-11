const removeDKIM = String(function (params) {
  const { query } = require('@arango')
  return query`
    LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
    FOR domainEdge in domainEdges
      LET dkimEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDKIM RETURN { edgeKey: e._key, dkimId: e._to })
      LET removeDkimEdges = (FOR dkimEdge IN dkimEdges REMOVE dkimEdge.edgeKey IN domainsDKIM)
      LET removeDkim = (FOR dkimEdge IN dkimEdges LET key = PARSE_IDENTIFIER(dkimEdge.dkimId).key REMOVE key IN dkim)
    RETURN true
  `
})

const removeDMARC = String(function (params) {
  const { query } = require('@arango')
  return query`
  LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
  FOR domainEdge in domainEdges
    LET dmarcEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsDMARC RETURN { edgeKey: e._key, dmarcId: e._to })
    LET removeDmarcEdges = (FOR dmarcEdge IN dmarcEdges REMOVE dmarcEdge.edgeKey IN domainsDMARC)
    LET removeDmarc = (FOR dmarcEdge IN dmarcEdges LET key = PARSE_IDENTIFIER(dmarcEdge.dmarcId).key REMOVE key IN dmarc)
  RETURN true
  `
})

const removeSPF = String(function (params) {
  const { query } = require('@arango')
  return query`
  LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
  FOR domainEdge in domainEdges
    LET spfEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSPF RETURN { edgeKey: e._key, spfId: e._to })
    LET removeSpfEdges = (FOR spfEdge IN spfEdges REMOVE spfEdge.edgeKey IN domainsSPF)
    LET removeSpf = (FOR spfEdge IN spfEdges LET key = PARSE_IDENTIFIER(spfEdge.spfId).key REMOVE key IN spf)
  RETURN true
  `
})

const removeHTTPS = String(function (params) {
  const { query } = require('@arango')
  return query`
  LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
  FOR domainEdge in domainEdges
    LET httpsEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsHTTPS RETURN { edgeKey: e._key, httpsId: e._to })
    LET removeHttpsEdges = (FOR httpsEdge IN httpsEdges REMOVE httpsEdge.edgeKey IN domainsHTTPS)
    LET removeHttps = (FOR httpsEdge IN httpsEdges LET key = PARSE_IDENTIFIER(httpsEdge.dmarcId).key REMOVE key IN https)
  RETURN true
  `
})

const removeSSL = String(function (params) {
  const { query } = require('@arango')
  return query`
  LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
  FOR domainEdge in domainEdges
    LET sslEdges = (FOR v, e IN 1..1 ANY domainEdge.domainId domainsSSL RETURN { edgeKey: e._key, sslId: e._to})
    LET removeSslEdges = (FOR sslEdge IN sslEdges REMOVE sslEdge.edgeKey IN domainsSSL)
    LET removeSsl = (FOR sslEdge IN sslEdges LET key = PARSE_IDENTIFIER(sslEdge.dmarcId).key REMOVE key IN ssl)
  RETURN true
  `
})

const removeDomains = String(function (params) {
  const { query } = require('@arango')
  return query`
    LET domainEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} claims RETURN { edgeKey: e._key, domainId: e._to })
    LET removeDomainEdges = (FOR domainEdge in domainEdges REMOVE domainEdge.domainId IN claims)
    LET removeDomain = (FOR domainEdge in domainEdges LET key = PARSE_IDENTIFIER(domainEdge.domainId).key REMOVE key IN domains)
    RETURN true
  `
})

const removeUserAffiliations = String(function (params) {
  const { query } = require('@arango')
  return query`
    LET userEdges = (FOR v, e IN 1..1 ANY ${params.organizationId} affiliations RETURN { edgeKey: e._key, userId: e._to })
    LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge._key IN affiliations)
    RETURN true
  `
})

const removeOrganization = String(function (params) {
  const { query } = require('@arango')
  return query`
    LET organizationKey = SPLIT(${params.organizationId}, '/')[1]
    REMOVE organizationKey IN organizations
  `
})

module.exports = {
  removeDKIM,
  removeDMARC,
  removeSPF,
  removeHTTPS,
  removeSSL,
  removeDomains,
  removeUserAffiliations,
  removeOrganization,
}
