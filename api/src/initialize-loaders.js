import {
  loadAffiliationByKey,
  loadAffiliationConnectionsByUserId,
  loadAffiliationConnectionsByOrgId,
} from './affiliation/loaders'
import {
  loadDkimFailConnectionsBySumId,
  loadDmarcFailConnectionsBySumId,
  loadDmarcSummaryConnectionsByUserId,
  loadDmarcSummaryEdgeByDomainIdAndPeriod,
  loadDmarcSummaryByKey,
  loadFullPassConnectionsBySumId,
  loadSpfFailureConnectionsBySumId,
  loadStartDateFromPeriod,
  loadDmarcYearlySumEdge,
  loadAllVerifiedRuaDomains,
} from './dmarc-summaries/loaders'
import { loadOrgByKey, loadOrganizationNamesById } from './organization/loaders'
import { loadMyTrackerByUserId, loadUserByUserName, loadUserByKey, loadUserConnectionsByUserId } from './user/loaders'
import {
  loadVerifiedDomainsById,
  loadVerifiedDomainByKey,
  loadVerifiedDomainConnections,
  loadVerifiedDomainConnectionsByOrgId,
} from './verified-domains/loaders'
import {
  loadVerifiedOrgByKey,
  loadVerifiedOrgBySlug,
  loadVerifiedOrgConnectionsByDomainId,
  loadVerifiedOrgConnections,
} from './verified-organizations/loaders'

export function initializeLoaders({ query, userKey, i18n, language, cleanseInput, loginRequiredBool, moment }) {
  return {
    loadDkimFailConnectionsBySumId: loadDkimFailConnectionsBySumId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDmarcFailConnectionsBySumId: loadDmarcFailConnectionsBySumId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDmarcSummaryConnectionsByUserId: loadDmarcSummaryConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
      loadStartDateFromPeriod: loadStartDateFromPeriod({
        moment,
        userKey,
        i18n,
      }),
    }),
    loadDmarcSummaryEdgeByDomainIdAndPeriod: loadDmarcSummaryEdgeByDomainIdAndPeriod({
      query,
      userKey,
      i18n,
    }),
    loadDmarcSummaryByKey: loadDmarcSummaryByKey({ query, userKey, i18n }),
    loadFullPassConnectionsBySumId: loadFullPassConnectionsBySumId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadSpfFailureConnectionsBySumId: loadSpfFailureConnectionsBySumId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadStartDateFromPeriod: loadStartDateFromPeriod({
      moment,
      userKey,
      i18n,
    }),
    loadDmarcYearlySumEdge: loadDmarcYearlySumEdge({ query, userKey, i18n }),
    loadOrgByKey: loadOrgByKey({ query, language, userKey, i18n }),
    loadOrganizationNamesById: loadOrganizationNamesById({ query, userKey, i18n }),
    loadMyTrackerByUserId: loadMyTrackerByUserId({
      query,
      language,
      userKey,
      i18n,
    }),
    loadUserByUserName: loadUserByUserName({ query, userKey, i18n }),
    loadUserConnectionsByUserId: loadUserConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadUserByKey: loadUserByKey({ query, userKey, i18n }),
    loadAffiliationByKey: loadAffiliationByKey({ query, userKey, i18n }),
    loadAffiliationConnectionsByUserId: loadAffiliationConnectionsByUserId({
      query,
      language,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadAffiliationConnectionsByOrgId: loadAffiliationConnectionsByOrgId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadVerifiedDomainsById: loadVerifiedDomainsById({ query, i18n }),
    loadVerifiedDomainByKey: loadVerifiedDomainByKey({ query, i18n }),
    loadVerifiedDomainConnections: loadVerifiedDomainConnections({
      query,
      cleanseInput,
      i18n,
    }),
    loadVerifiedDomainConnectionsByOrgId: loadVerifiedDomainConnectionsByOrgId({
      query,
      cleanseInput,
      i18n,
    }),
    loadVerifiedOrgByKey: loadVerifiedOrgByKey({
      query,
      language,
      i18n,
    }),
    loadVerifiedOrgBySlug: loadVerifiedOrgBySlug({
      query,
      language,
      i18n,
    }),
    loadVerifiedOrgConnectionsByDomainId: loadVerifiedOrgConnectionsByDomainId({
      query,
      language,
      cleanseInput,
      i18n,
    }),
    loadVerifiedOrgConnections: loadVerifiedOrgConnections({
      query,
      language,
      cleanseInput,
      i18n,
    }),
    loadAllVerifiedRuaDomains: loadAllVerifiedRuaDomains({
      query,
      userKey,
      i18n,
    }),
  }
}
