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
} from './dmarc-summaries/loaders'
import {
  loadDomainByKey,
  loadDomainByDomain,
  loadDomainConnectionsByOrgId,
  loadDomainConnectionsByUserId,
} from './domain/loaders'
import {
  loadDkimByKey,
  loadDkimResultByKey,
  loadDmarcByKey,
  loadSpfByKey,
  loadDkimConnectionsByDomainId,
  loadDkimResultConnectionsByDkimId,
  loadDmarcConnectionsByDomainId,
  loadSpfConnectionsByDomainId,
} from './email-scan/loaders'
import {
  loadAggregateGuidanceTagByTagId,
  loadAggregateGuidanceTagConnectionsByTagId,
  loadDkimGuidanceTagByTagId,
  loadDkimGuidanceTagConnectionsByTagId,
  loadDmarcGuidanceTagByTagId,
  loadDmarcGuidanceTagConnectionsByTagId,
  loadHttpsGuidanceTagByTagId,
  loadHttpsGuidanceTagConnectionsByTagId,
  loadSpfGuidanceTagByTagId,
  loadSpfGuidanceTagConnectionsByTagId,
  loadSslGuidanceTagByTagId,
  loadSslGuidanceTagConnectionsByTagId,
} from './guidance-tag/loaders'
import {
  loadOrgByKey,
  loadOrgBySlug,
  loadOrgConnectionsByDomainId,
  loadOrgConnectionsByUserId,
} from './organization/loaders'
import {
  loadUserByUserName,
  loadUserByKey,
  loadUserConnectionsByUserId,
} from './user/loaders'
import {
  loadHttpsByKey,
  loadHttpsConnectionsByDomainId,
  loadSslByKey,
  loadSslConnectionByDomainId, loadWebConnectionsByDomainId, loadWebScansByWebId,
} from './web-scan/loaders'
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
import { loadChartSummaryByKey } from './summaries/loaders'
import {loadDnsConnectionsByDomainId} from "./dns-scan";

export function initializeLoaders({
  query,
  db,
  userKey,
  i18n,
  language,
  cleanseInput,
  loginRequiredBool,
  moment,
}) {
  return {
    loadChartSummaryByKey: loadChartSummaryByKey({ query, userKey, i18n }),
    loadAggregateGuidanceTagByTagId: loadAggregateGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadAggregateGuidanceTagConnectionsByTagId:
      loadAggregateGuidanceTagConnectionsByTagId({
        query,
        userKey,
        i18n,
        cleanseInput,
        language,
      }),
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
    loadDmarcSummaryEdgeByDomainIdAndPeriod:
      loadDmarcSummaryEdgeByDomainIdAndPeriod({
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
    loadDomainByDomain: loadDomainByDomain({ query, userKey, i18n }),
    loadDomainByKey: loadDomainByKey({ query, userKey, i18n }),
    loadDomainConnectionsByOrgId: loadDomainConnectionsByOrgId({
      query,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
    }),
    loadDomainConnectionsByUserId: loadDomainConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
    }),
    loadDkimByKey: loadDkimByKey({ query, userKey, i18n }),
    loadDkimResultByKey: loadDkimResultByKey({ query, userKey, i18n }),
    loadDmarcByKey: loadDmarcByKey({ query, userKey, i18n }),
    loadSpfByKey: loadSpfByKey({ query, userKey, i18n }),
    loadDkimConnectionsByDomainId: loadDkimConnectionsByDomainId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDkimResultConnectionsByDkimId: loadDkimResultConnectionsByDkimId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDmarcConnectionsByDomainId: loadDmarcConnectionsByDomainId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDnsConnectionsByDomainId: loadDnsConnectionsByDomainId({
      query,
      db,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadSpfConnectionsByDomainId: loadSpfConnectionsByDomainId({
      query,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadHttpsByKey: loadHttpsByKey({ query, userKey, i18n }),
    loadHttpsConnectionsByDomainId: loadHttpsConnectionsByDomainId({
      query,
      userKey,
      cleanseInput,
    }),
    loadSslByKey: loadSslByKey({ query, userKey, i18n }),
    loadSslConnectionByDomainId: loadSslConnectionByDomainId({
      query,
      userKey,
      cleanseInput,
    }),
    loadWebConnectionsByDomainId: loadWebConnectionsByDomainId({
      query,
      db,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadWebScansByWebId: loadWebScansByWebId({
      query,
      db,
      userKey,
      cleanseInput,
      i18n,
    }),
    loadDkimGuidanceTagByTagId: loadDkimGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadDkimGuidanceTagConnectionsByTagId:
      loadDkimGuidanceTagConnectionsByTagId({
        query,
        userKey,
        cleanseInput,
        i18n,
        language,
      }),
    loadDmarcGuidanceTagByTagId: loadDmarcGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadDmarcGuidanceTagConnectionsByTagId:
      loadDmarcGuidanceTagConnectionsByTagId({
        query,
        userKey,
        cleanseInput,
        i18n,
        language,
      }),
    loadHttpsGuidanceTagByTagId: loadHttpsGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadHttpsGuidanceTagConnectionsByTagId:
      loadHttpsGuidanceTagConnectionsByTagId({
        query,
        userKey,
        cleanseInput,
        i18n,
        language,
      }),
    loadSpfGuidanceTagByTagId: loadSpfGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadSpfGuidanceTagConnectionsByTagId: loadSpfGuidanceTagConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    }),
    loadSslGuidanceTagByTagId: loadSslGuidanceTagByTagId({
      query,
      userKey,
      i18n,
      language,
    }),
    loadSslGuidanceTagConnectionsByTagId: loadSslGuidanceTagConnectionsByTagId({
      query,
      userKey,
      cleanseInput,
      i18n,
      language,
    }),
    loadOrgByKey: loadOrgByKey({
      query,
      language,
      userKey,
      i18n,
    }),
    loadOrgBySlug: loadOrgBySlug({
      query,
      language,
      userKey,
      i18n,
    }),
    loadOrgConnectionsByDomainId: loadOrgConnectionsByDomainId({
      query,
      language,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
    }),
    loadOrgConnectionsByUserId: loadOrgConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      language,
      i18n,
      auth: { loginRequiredBool },
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
  }
}
