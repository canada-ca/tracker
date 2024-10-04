import {initializeLoaders} from '../initialize-loaders'

describe('initializeLoaders', () => {
  it('returns a object with a key for each loader', () => {
    const loaders = initializeLoaders({
      query: jest.fn(),
      userKey: '1234',
      i18n: jest.fn(),
      language: 'en',
      cleanseInput: jest.fn(),
      loginRequiredBool: true,
      moment: jest.fn(), // momentjs
    })

    expect(loaders).toHaveProperty(
      'loadChartSummaryByKey',
      'loadAggregateGuidanceTagByTagId',
      'loadAggregateGuidanceTagConnectionsByTagId',
      'loadDkimFailConnectionsBySumId',
      'loadDmarcFailConnectionsBySumId',
      'loadDmarcSummaryConnectionsByUserId',
      'loadDmarcSummaryEdgeByDomainIdAndPeriod',
      'loadDmarcSummaryByKey',
      'loadFullPassConnectionsBySumId',
      'loadSpfFailureConnectionsBySumId',
      'loadStartDateFromPeriod',
      'loadDmarcYearlySumEdge',
      'loadDomainByDomain',
      'loadDomainByKey',
      'loadDomainConnectionsByOrgId',
      'loadDomainConnectionsByUserId',
      'loadDnsConnectionsByDomainId',
      'loadWebConnectionsByDomainId',
      'loadWebScansByWebId',
      'loadDkimGuidanceTagByTagId',
      'loadDkimGuidanceTagConnectionsByTagId',
      'loadDmarcGuidanceTagByTagId',
      'loadDmarcGuidanceTagConnectionsByTagId',
      'loadHttpsGuidanceTagByTagId',
      'loadHttpsGuidanceTagConnectionsByTagId',
      'loadSpfGuidanceTagByTagId',
      'loadSpfGuidanceTagConnectionsByTagId',
      'loadSslGuidanceTagByTagId',
      'loadSslGuidanceTagConnectionsByTagId',
      'loadOrgByKey',
      'loadOrgBySlug',
      'loadOrgConnectionsByDomainId',
      'loadOrgConnectionsByUserId',
      'loadUserByUserName',
      'loadUserByKey',
      'loadAffiliationByKey',
      'loadAffiliationConnectionsByUserId',
      'loadAffiliationConnectionsByOrgId',
      'loadVerifiedDomainsById',
      'loadVerifiedDomainByKey',
      'loadVerifiedDomainConnections',
      'loadVerifiedDomainConnectionsByOrgId',
      'loadVerifiedOrgByKey',
      'loadVerifiedOrgBySlug',
      'loadVerifiedOrgConnectionsByDomainId',
      'loadVerifiedOrgConnections',
    )
  })
})
