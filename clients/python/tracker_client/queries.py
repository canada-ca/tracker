""" This module contains the gql documents used by client.py to query the Tracker API

:var DocumentNode SIGN_IN_MUTATION: sign in and get authentication token
:var DocumentNode GET_DOMAIN: get scalar fields of a domain
:var DocumentNode GET_ORG: get scalar fields of an organization
:var DocumentNode GET_ALL_DOMAINS: get scalar fields of all your domains
:var DocumentNode GET_ALL_ORGS: get scalar fields of all your organizations
:var DocumentNode GET_DOMAIN_OWNERS: get scalar fields of a domain's owning organizations
:var DocumentNode GET_ORG_DOMAINS: get scalar fields of an organization's owned domains
:var DocumentNode DMARC_SUMMARY: get a domain's DMARC summary for one month
:var DocumentNode YEARLY_DMARC_SUMMARIES: get a domain's yearly DMARC summaries
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
    mutation SignIn($creds: SignInInput!) {
        signIn (input: $creds) {
            result {
                ... on AuthResult {
                    authToken
                }
                ... on SignInError{
                    code
                    description
                }
            }
        }
    }
    """
)

# Get scalar fields of a domain
# :param str domain: url to get domain for
# Query variables should look like {"domain": ${domain_url} }
GET_DOMAIN = gql(
    """
    query FindDomainByDomain($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            dmarcPhase
            lastRan
            selectors
        }
    }
    """
)

# Get scalar fields of an organization
# :param str orgSlug: a slugified organization name
# slugified-looks-like-this (all lowercase, alphanumeric, spaces replaced with hyphens)
#  Query variables should look like {"orgSlug": ${slugified-str} }
GET_ORG = gql(
    """
    query OrgBySlug($orgSlug: Slug!) {
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

# Get scalar fields of all your domains
GET_ALL_DOMAINS = gql(
    """
    query GetAllDomains($after: String) {
        findMyDomains(first: 100, after: $after) {
            pageInfo{
                hasNextPage
                endCursor
            }
            edges {
                node {
                    domain
                    dmarcPhase
                    lastRan
                    selectors
                }
            }
        }
    }
    """
)

# Get scalar fields of all your orgs
GET_ALL_ORGS = gql(
    """
    query GetAllOrgs($after: String) {
        findMyOrganizations(first: 100, after: $after) {
            pageInfo{
                hasNextPage
                endCursor
            }
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

# Get scalar fields of a domain's owning organizations
# :param str domain: url to get owners for
# Query variables should look like {"domain": ${domain_url} }
GET_DOMAIN_OWNERS = gql(
    """
    query GetDomainOwners($domain: DomainScalar!) {
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

# Get scalar fields of all domains owned by an organization
# :param str orgSlug: a slugified organization name
# slugified-looks-like-this (all lowercase, alphanumeric, spaces replaced with hyphens)
#  Query variables should look like {"orgSlug": ${slugified-str} }
GET_ORG_DOMAINS = gql(
    """
    query OrgDomainsBySlug($orgSlug: Slug!, $after: String) {
        findOrganizationBySlug(orgSlug: $orgSlug) {
            domains (first: 100, after: $after) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        domain
                        dmarcPhase
                        lastRan
                        selectors
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
    query DomainDMARCSummary(
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
    query DomainAllDMARCSummaries($domain: DomainScalar!) {
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

# Get an organization by its slugified name and get summary metrics
# slugified-looks-like-this (all lowercase, alphanumeric, spaces replaced with hyphens)
# :param str orgSlug: a slugified organization name
#  Query variables should look like {"orgSlug": ${slugified-str} }
SUMMARY_BY_SLUG = gql(
    """
    query GetSummaryBySlug($orgSlug: Slug!) {
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
    query GetAllResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            web {
                https(first: 100) {
                    edges {
                        node {
                            timestamp
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
                            timestamp
                            strongCiphers
                            strongCurves
                            acceptableCiphers
                            acceptableCurves
                            weakCiphers
                            weakCurves
                            ccsInjectionVulnerable
                            heartbleedVulnerable
                            supportsEcdhKeyExchange
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
                            timestamp
                            results(first: 100) {
                                edges {
                                    node {
                                        selector
                                        record
                                        keyLength
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
                            timestamp
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
                            timestamp
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
    query GetWebResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            web {
                https(first: 100) {
                    edges {
                        node {
                            timestamp
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
                            timestamp
                            strongCiphers
                            strongCurves
                            acceptableCiphers
                            acceptableCurves
                            weakCiphers
                            weakCurves
                            ccsInjectionVulnerable
                            heartbleedVulnerable
                            supportsEcdhKeyExchange
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
    query GetEmailResults($domain: DomainScalar!) {
        findDomainByDomain(domain: $domain) {
            domain
            lastRan
            email {
                dkim(first: 100) {
                    edges {
                        node {
                            timestamp
                            results(first: 100) {
                                edges {
                                    node {
                                        selector
                                        record
                                        keyLength
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
                            timestamp
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
                            timestamp
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
