""" This module contains the gql documents used by client.py to query the Tracker API

:var DocumentNode SIGN_IN_MUTATION: sign in and get authentication token
:var DocumentNode ALL_DOMAINS_QUERY: get all organizations and their domains
:var DocumentNode DOMAINS_BY_SLUG: get all domains for one organization
:var DocumentNode DMARC_SUMMARY: get a domain's DMARC summary for one month
:var DocumentNode YEARLY_DMARC_SUMMARIES: get a domain's yearly DMARC summaries
:var DocumentNode ALL_ORG_SUMMARIES: get summary metrics for all organizations
:var DocumentNode SUMMARY_BY_SLUG: get summary metrics for one organization
:var DocumentNode ALL_RESULTS: get all scan results for a domain
:var DocumentNode WEB_RESULTS: get web scan results for a domain
:var DocumentNode EMAIL_RESULTS: get email scan results for a domain
:var DocumentNode DOMAIN_STATUS: get pass/fail compliance statuses for a domain
"""

from gql import gql

# Sign in to Tracker and obtain an authentication token
# :param dict creds: a dict with a username and password
# Mutation variables should look like {"creds":{"userName": ${username}, "password": ${password}}}
SIGNIN_MUTATION = gql(
    """
    mutation signIn($creds: SignInInput!) {
        signIn (input: $creds) {
            result {
                ... on RegularSignInResult {
                    authResult {
                        authToken
                    }
                }
            }
        }
    }
    """
)

# Get all organizations the user belongs to and all domains those organizations own
# Pagination details (edges and nodes) are stripped during formatting of response
ALL_DOMAINS_QUERY = gql(
    """
    query getAllDomains {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    domains(first: 100){
                        edges{
                            node{
                                domain
                            }
                        }
                    }
                }
            }
        }
    }
    """
)

# Get an organization by its slugified name and all domains that organization owns
# slugified-looks-like-this (all lowercase, alphanumeric, spaces replaced with hyphens)
# :param str orgSlug: a slugified organization name
# Query variables should look like {"orgSlug": ${slugified-str} }
# Pagination details (edges and nodes) are stripped during formatting of response
DOMAINS_BY_SLUG = gql(
    """
    query orgBySlug($orgSlug: Slug!){
        findOrganizationBySlug(orgSlug: $orgSlug){
            acronym
            domains(first: 100){
                edges{
                    node{
                        domain
                    }
                }
            }
        }
    }
    """
)

# Get the DMARC summary for one month for one domain
# :param str domain: url to get DMARC summary for
# :param str month: full name of a month in ALL CAPS to get summary for
# :param str year: year to get summary for
# Query variables should look like: {"domain": ${domain_url}, "month": ${MONTH_IN_ALL_CAPS}, "year": ${numeric_year_as_str}}
DMARC_SUMMARY = gql(
    """
    query domainDMARCSummary(
        $domain: DomainScalar!
        $month: PeriodEnums!
        $year: Year!
    ) {
        findDomainByDomain(domain: $domain) {
            domain
            dmarcSummaryByPeriod(month: $month, year: $year) {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
)

# Get yearly DMARC summaries for a domain
# :param str domain: url to get DMARC summary for
# Query variables should look like {"domain": ${domain_url} }
DMARC_YEARLY_SUMMARIES = gql(
    """
    query domainAllDMARCSummaries($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            yearlyDmarcSummaries {
                month
                year
                categoryPercentages {
                    fullPassPercentage
                    passSpfOnlyPercentage
                    passDkimOnlyPercentage
                    failPercentage
                    totalMessages
                }
            }
        }
    }
    """
)

# Get summary metrics for all organizations user is a member of
# Pagination details (edges and nodes) are stripped during formatting of response
ALL_ORG_SUMMARIES = gql(
    """
    query getAllSummaries {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    domainCount
                    summaries{
                        web{
                            total
                            categories{
                                name
                                count
                                percentage
                            }
                        }
                         mail{
                            total
                            categories{
                                name
                                count
                                percentage
                            }
                        }
                    }
                }
            }
        }
    }
    """
)

# Get an organization by its slugified name and get summary metrics
# slugified-looks-like-this (all lowercase, alphanumeric, spaces replaced with hyphens)
# :param str orgSlug: a slugified organization name
#  Query variables should look like {"orgSlug": ${slugified-str} }
SUMMARY_BY_SLUG = gql(
    """
    query getSummaryBySlug($orgSlug: Slug!) {
        findOrganizationBySlug(orgSlug: $orgSlug) {
            acronym
            domainCount
            summaries {
                web {
                    total
                    categories {
                        name
                        count
                        percentage
                    }
                }
                mail {
                    total
                    categories {
                        name
                        count
                        percentage
                    }
                }
            }
        }
    }
    """
)

# Get all scan results for a domain
# :param str domain: url to get scan results
# Query variables should look like {"domain": ${domain_url} }
# Returns many fields, guidance tags are likely to be of most interest
# Pagination details (edges and nodes) are stripped during formatting of response
ALL_RESULTS = gql(
    """
    query getAllResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            web {
                https(first: 100) {
                    edges {
                        node {
                            implementation
                            enforced
                            hsts
                            hstsAge
                            preloaded
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ssl(first: 100) {
                    edges {
                        node {
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            email {
                dkim(first: 100) {
                    edges {
                        node {
                            results(first: 100) {
                                edges {
                                    node {
                                        selector
                                        positiveGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                        neutralGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                        negativeGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                dmarc(first: 100) {
                    edges {
                        node {
                            record
                            pPolicy
                            spPolicy
                            pct
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                spf(first: 100) {
                    edges {
                        node {
                            lookups
                            record
                            spfDefault
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """
)

# Get web scan results for a domain
# :param str domain: url to get scan results
# Query variables should look like {"domain": ${domain_url} }
# Returns many fields, guidance tags are likely to be of most interest
# Pagination details (edges and nodes) are stripped during formatting of response
WEB_RESULTS = gql(
    """
    query getWebResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            web {
                https(first: 100) {
                    edges {
                        node {
                            implementation
                            enforced
                            hsts
                            hstsAge
                            preloaded
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ssl(first: 100) {
                    edges {
                        node {
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """
)

# Get email scan results for a domain
# :param str domain: url to get scan results
# Query variables should look like {"domain": ${domain_url} }
# Returns many fields, guidance tags are likely to be of most interest
# Pagination details (edges and nodes) are stripped during formatting of response
EMAIL_RESULTS = gql(
    """
    query GetScanResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            email {
                dkim(first: 100) {
                    edges {
                        node {
                            results(first: 100) {
                                edges {
                                    node {
                                        selector
                                        positiveGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                        neutralGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                        negativeGuidanceTags(first: 100) {
                                            edges {
                                                node {
                                                    tagId
                                                    tagName
                                                    guidance
                                                    refLinks {
                                                        description
                                                        refLink
                                                    }
                                                    refLinksTech {
                                                        description
                                                        refLink
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                dmarc(first: 100) {
                    edges {
                        node {
                            record
                            pPolicy
                            spPolicy
                            pct
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                spf(first: 100) {
                    edges {
                        node {
                            lookups
                            record
                            spfDefault
                            positiveGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            neutralGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                            negativeGuidanceTags(first: 100) {
                                edges {
                                    node {
                                        tagId
                                        tagName
                                        guidance
                                        refLinks {
                                            description
                                            refLink
                                        }
                                        refLinksTech {
                                            description
                                            refLink
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """
)

# Get pass/fail status indicators for a domain's compliance
# :param str domain: url to get scan results
# Query variables should look like {"domain": ${domain_url} }
DOMAIN_STATUS = gql(
    """
  query GetDomainStatus($domain: DomainScalar!) {
    findDomainByDomain(domain: $domain) {
      domain
      lastRan
      status {
        https
        ssl
        dmarc
        dkim
        spf
      }
    }
  }
  """
)


GET_DOMAIN = gql(
    """
    query FindDomainByDomain($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            dmarcPhase
            lastRan
        }
    }
    """
)

GET_ORG = gql(
    """
    query orgBySlug($orgSlug: Slug!) {
        findOrganizationBySlug(orgSlug: $orgSlug) {
            acronym
            name
            zone
            sector
            country
            province
            city
            verified
            domainCount
        }
    }
    """
)

GET_ALL_DOMAINS = gql(
    """
    query getAllDomains {
        findMyDomains(first: 100) {
            edges {
                node {
                    domain
                    dmarcPhase
                    lastRan
                }
            }
        }
    }
    """
)

GET_ALL_ORGS = gql(
    """
    query GetAllOrgs {
        findMyOrganizations(first: 100) {
            edges {
                node {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                    verified
                    domainCount
                }
            }
        }
    }
    """
)

GET_DOMAIN_OWNERS = gql(
    """
    query FindDomainByDomain($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            organizations(first: 100) {
                edges {
                    node {
                    acronym
                    name
                    zone
                    sector
                    country
                    province
                    city
                    verified
                    domainCount
                    }
                }
            }
        }
    }
    """
)

GET_ORG_DOMAINS = gql(
    """
    query orgBySlug($orgSlug: Slug!) {
        findOrganizationBySlug(orgSlug: $orgSlug) {
            domains (first: 100) {
                edges {
                    node {
                        domain
                        dmarcPhase
                        lastRan
                    }
                }
            }
        }
    }
    """
)
