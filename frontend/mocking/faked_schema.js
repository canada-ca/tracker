import { gql } from '@apollo/client/core'

export const getTypeNames = () => gql`
  type Query {
    # Fetches an object given its ID
    node(
      # The ID of an object
      id: ID!
    ): Node

    # Fetches objects given their IDs
    nodes(
      # The IDs of objects
      ids: [ID!]!
    ): [Node]!

    # Query for dmarc summaries the user has access to.
    findMyDmarcSummaries(
      # Ordering options for dmarc summaries connections
      orderBy: DmarcSummaryOrder

      # The month in which the returned data is relevant to.
      month: PeriodEnums!

      # The year in which the returned data is relevant to.
      year: Year!

      # An optional string used to filter the results based on domains.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DmarcSummaryConnection

    # Retrieve a specific domain by providing a domain.
    findDomainByDomain(
      # The domain you wish to retrieve information for.
      domain: DomainScalar!
    ): Domain

    # Select domains a user has access to.
    findMyDomains(
      # Ordering options for domain connections.
      orderBy: DomainOrder

      # Limit domains to those that belong to an organization that has ownership.
      ownership: Boolean

      # String used to search for domains.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DomainConnection

    # Select organizations a user has access to.
    findMyOrganizations(
      # Ordering options for organization connections
      orderBy: OrganizationOrder

      # String argument used to search for organizations.
      search: String

      # Filter orgs based off of the user being an admin of them.
      isAdmin: Boolean

      # Filter org list to either include or exclude the super admin org.
      includeSuperAdminOrg: Boolean

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): OrganizationConnection

    # Select organizations a user has access to.
    findMyWebCheckOrganizations(
      # Ordering options for organization connections
      orderBy: OrganizationOrder

      # String argument used to search for organizations.
      search: String

      # Filter orgs based off of the user being an admin of them.
      isAdmin: Boolean

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): WebCheckOrgConnection

    # Select all information on a selected organization that a user has access to.
    findOrganizationBySlug(
      # The slugified organization name you want to retrieve data for.
      orgSlug: Slug!
    ): Organization

    # Email summary computed values, used to build summary cards.
    mailSummary: CategorizedSummary

    # Web summary computed values, used to build summary cards.
    webSummary: CategorizedSummary

    # DMARC phase summary computed values, used to build summary cards.
    dmarcPhaseSummary: CategorizedSummary

    # HTTPS summary computed values, used to build summary cards.
    httpsSummary: CategorizedSummary

    # Query the currently logged in user.
    findMe: PersonalUser

    # Select users an admin has access to.
    findMyUsers(
      # Ordering options for user affiliation
      orderBy: AffiliationUserOrder

      # String used to search for users.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): UserConnection

    # Query a specific user by user name.
    findUserByUsername(
      # Email address of user you wish to gather data for.
      userName: EmailAddress!
    ): SharedUser

    # Checks if user must be logged in to access data.
    loginRequired: Boolean

    # Query used to check if the user has an admin role.
    isUserAdmin(
      # Optional org id to see if user is an admin for the requested org.
      orgId: ID
    ): Boolean

    # Query used to check if the user has a super admin role.
    isUserSuperAdmin: Boolean

    # Retrieve a specific verified domain by providing a domain.
    findVerifiedDomainByDomain(
      # The domain you wish to retrieve information for.
      domain: DomainScalar!
    ): VerifiedDomain

    # Select verified check domains
    findVerifiedDomains(
      # Ordering options for verified domain connections.
      orderBy: VerifiedDomainOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): VerifiedDomainConnection

    # Select all information on a selected verified organization.
    findVerifiedOrganizationBySlug(
      # The slugified organization name you want to retrieve data for.
      orgSlug: Slug!
    ): VerifiedOrganization

    # Select organizations a user has access to.
    findVerifiedOrganizations(
      # Ordering options for verified organization connections.
      orderBy: VerifiedOrganizationOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): VerifiedOrganizationConnection
  }

  # An object with an ID
  interface Node {
    # The id of the object.
    id: ID!
  }

  # A connection to a list of items.
  type DmarcSummaryConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DmarcSummaryEdge]

    # The total amount of dmarc summaries the user has access to.
    totalCount: Int
  }

  # Information about pagination in a connection.
  type PageInfo {
    # When paginating forwards, are there more items?
    hasNextPage: Boolean!

    # When paginating backwards, are there more items?
    hasPreviousPage: Boolean!

    # When paginating backwards, the cursor to continue.
    startCursor: String

    # When paginating forwards, the cursor to continue.
    endCursor: String
  }

  # An edge in a connection.
  type DmarcSummaryEdge {
    # The item at the end of the edge
    node: DmarcSummary

    # A cursor for use in pagination
    cursor: String!
  }

  # Object that contains information for a dmarc summary.
  type DmarcSummary implements Node {
    # The ID of an object
    id: ID!

    # The domain that the data in this dmarc summary belongs to.
    domain: Domain

    # Start date of data collection.
    month: PeriodEnums

    # End date of data collection.
    year: Year

    # Category percentages based on the category totals.
    categoryPercentages: CategoryPercentages

    # Category totals for quick viewing.
    categoryTotals: CategoryTotals

    # Various senders for each category.
    detailTables: DetailTables
  }

  # Domain object containing information for a given domain.
  type Domain implements Node {
    # The ID of an object
    id: ID!

    # Domain that scans will be ran on.
    domain: DomainScalar

    # The current dmarc phase the domain is compliant to.
    dmarcPhase: String

    # Whether or not the domain has a aggregate dmarc report.
    hasDMARCReport: Boolean

    # The last time that a scan was ran on this domain.
    lastRan: String

    # Domain Keys Identified Mail (DKIM) selector strings associated with domain.
    selectors: [Selector]

    # The domains scan status, based on the latest scan data.
    status: DomainStatus

    # The organization that this domain belongs to.
    organizations(
      # Ordering options for organization connections
      orderBy: OrganizationOrder

      # String argument used to search for organizations.
      search: String

      # Filter orgs based off of the user being an admin of them.
      isAdmin: Boolean

      # Filter org list to either include or exclude the super admin org.
      includeSuperAdminOrg: Boolean

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): OrganizationConnection

    # DKIM, DMARC, and SPF scan results.
    email: EmailScan

    # HTTPS, and SSL scan results.
    web: WebScan

    # Summarized DMARC aggregate reports.
    dmarcSummaryByPeriod(
      # The month in which the returned data is relevant to.
      month: PeriodEnums!

      # The year in which the returned data is relevant to.
      year: Year!
    ): DmarcSummary

    # Yearly summarized DMARC aggregate reports.
    yearlyDmarcSummaries: [DmarcSummary]
  }

  # String that conforms to a domain structure.
  scalar DomainScalar

  # A field that conforms to a DKIM selector. Only alphanumeric characters and periods are allowed, string must also start and end with alphanumeric characters
  scalar Selector

  # This object contains how the domain is doing on the various scans we preform, based on the latest scan data.
  type DomainStatus {
    # Ciphers Status
    ciphers: StatusEnum

    # Curves Status
    curves: StatusEnum

    # DKIM Status
    dkim: StatusEnum

    # DMARC Status
    dmarc: StatusEnum

    # HTTPS Status
    https: StatusEnum

    # HSTS Status
    hsts: StatusEnum

    # Policy Status
    policy: StatusEnum

    # Protocols Status
    protocols: StatusEnum

    # SPF Status
    spf: StatusEnum

    # SSL Status
    ssl: StatusEnum
  }

  # Enum used to inform front end if there are any issues, info, or the domain passes a given check.
  enum StatusEnum {
    # If the given check meets the passing requirements.
    PASS

    # If the given check has flagged something that can provide information on the domain that aren't scan related.
    INFO

    # If the given check does not meet the passing requirements
    FAIL
  }

  # A connection to a list of items.
  type OrganizationConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [OrganizationEdge]

    # The total amount of organizations the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type OrganizationEdge {
    # The item at the end of the edge
    node: Organization

    # A cursor for use in pagination
    cursor: String!
  }

  # Organization object containing information for a given Organization.
  type Organization implements Node {
    # The ID of an object
    id: ID!

    # The organizations acronym.
    acronym: Acronym

    # The full name of the organization.
    name: String

    # Slugified name of the organization.
    slug: Slug

    # The zone which the organization belongs to.
    zone: String

    # The sector which the organization belongs to.
    sector: String

    # The country in which the organization resides.
    country: String

    # The province in which the organization resides.
    province: String

    # The city in which the organization resides.
    city: String

    # Whether the organization is a verified organization.
    verified: Boolean

    # Summaries based on scan types that are preformed on the given organizations domains.
    summaries: OrganizationSummary

    # The number of domains associated with this organization.
    domainCount: Int

    # The domains which are associated with this organization.
    domains(
      # Ordering options for domain connections.
      orderBy: DomainOrder

      # Limit domains to those that belong to an organization that has ownership.
      ownership: Boolean

      # String used to search for domains.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DomainConnection

    # Organization affiliations to various users.
    affiliations(
      # Ordering options for affiliation connections.
      orderBy: AffiliationUserOrder

      # String used to search for affiliated users.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): AffiliationConnection
  }

  # A field whose value consists of upper case or lower case letters or underscores with a length between 1 and 50.
  scalar Acronym

  # A field whose values contain numbers, letters, dashes, and underscores.
  scalar Slug

  # Summaries based on domains that the organization has claimed.
  type OrganizationSummary {
    # Summary based on DMARC scan results for a given organization.
    dmarc: CategorizedSummary

    # Summary based on HTTPS scan results for a given organization.
    https: CategorizedSummary

    # Summary based on mail scan results for a given organization.
    mail: CategorizedSummary

    # Summary based on web scan results for a given organization.
    web: CategorizedSummary

    # Summary based on DMARC phases for a given organization.
    dmarcPhase: CategorizedSummary
  }

  # This object contains the list of different categories for pre-computed
  #     summary data with the computed total for how many domains in total are
  #     being compared.
  type CategorizedSummary {
    # List of SummaryCategory objects with data for different computed categories.
    categories: [SummaryCategory]

    # Total domains that were check under this summary.
    total: Int
  }

  # This object contains the information for each type of summary that has been pre-computed
  type SummaryCategory {
    # Category of computed summary which the other fields relate to.
    name: String

    # Total count of domains that fall into this category.
    count: Int

    # Percentage compared to other categories.
    percentage: Float
  }

  # A connection to a list of items.
  type DomainConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DomainEdge]

    # The total amount of domains the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type DomainEdge {
    # The item at the end of the edge
    node: Domain

    # A cursor for use in pagination
    cursor: String!
  }

  # Ordering options for domain connections.
  input DomainOrder {
    # The field to order domains by.
    field: DomainOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which domain connections can be ordered.
  enum DomainOrderField {
    # Order domains by ciphers status.
    CIPHERS_STATUS

    # Order domains by curves status.
    CURVES_STATUS

    # Order domains by domain.
    DOMAIN

    # Order domains by dkim status.
    DKIM_STATUS

    # Order domains by dmarc status.
    DMARC_STATUS

    # Order domains by https status.
    HTTPS_STATUS

    # Order domains by hsts status.
    HSTS_STATUS

    # Order domains by ITPIN policy status.
    POLICY_STATUS

    # Order domains by protocols status.
    PROTOCOLS_STATUS

    # Order domains by spf status.
    SPF_STATUS
  }

  # Possible directions in which to order a list of items when provided an \`orderBy\` argument.
  enum OrderDirection {
    # Specifies an ascending order for a given \`orderBy\` argument.
    ASC

    # Specifies a descending order for a given \`orderBy\` argument.
    DESC
  }

  # A connection to a list of items.
  type AffiliationConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [AffiliationEdge]

    # The total amount of affiliations the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type AffiliationEdge {
    # The item at the end of the edge
    node: Affiliation

    # A cursor for use in pagination
    cursor: String!
  }

  # User Affiliations containing the permission level for the given organization, the users information, and the organizations information.
  type Affiliation implements Node {
    # The ID of an object
    id: ID!

    # User's level of access to a given organization.
    permission: RoleEnums

    # The affiliated users information.
    user: SharedUser

    # The affiliated organizations information.
    organization: Organization
  }

  # An enum used to assign, and test users roles.
  enum RoleEnums {
    # A user who has been given access to view an organization.
    USER

    # A user who has the same access as a user write account, but can define new user read/write accounts.
    ADMIN

    # A user who has the same access as an admin, but can define new admins.
    SUPER_ADMIN
  }

  # This object is used for showing none personal user details,
  # and is used for limiting admins to the personal details of users.
  type SharedUser implements Node {
    # The ID of an object
    id: ID!

    # Users display name.
    displayName: String

    # Users email address.
    userName: EmailAddress

    # Has the user email verified their account.
    emailValidated: Boolean

    # Users affiliations to various organizations.
    affiliations(
      # Ordering options for affiliation connections.
      orderBy: AffiliationOrgOrder

      # String used to search for affiliated organizations.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): AffiliationConnection
  }

  # A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.
  scalar EmailAddress

  # Ordering options for affiliation connections.
  input AffiliationOrgOrder {
    # The field to order affiliations by.
    field: AffiliationOrgOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which affiliation connections can be ordered.
  enum AffiliationOrgOrderField {
    # Order affiliations by org acronym.
    ORG_ACRONYM

    # Order affiliations by org name.
    ORG_NAME

    # Order affiliations by org slug.
    ORG_SLUG

    # Order affiliations by org zone.
    ORG_ZONE

    # Order affiliations by org sector.
    ORG_SECTOR

    # Order affiliations by org country.
    ORG_COUNTRY

    # Order affiliations by org province.
    ORG_PROVINCE

    # Order affiliations by org city.
    ORG_CITY

    # Order affiliations by org verification.
    ORG_VERIFIED

    # Order affiliations by org summary mail pass count.
    ORG_SUMMARY_MAIL_PASS

    # Order affiliations by org summary mail fail count.
    ORG_SUMMARY_MAIL_FAIL

    # Order affiliations by org summary mail total count.
    ORG_SUMMARY_MAIL_TOTAL

    # Order affiliations by org summary web pass count.
    ORG_SUMMARY_WEB_PASS

    # Order affiliations by org summary web fail count.
    ORG_SUMMARY_WEB_FAIL

    # Order affiliations by org summary web total count.
    ORG_SUMMARY_WEB_TOTAL

    # Order affiliations by org domain count.
    ORG_DOMAIN_COUNT
  }

  # Ordering options for affiliation connections.
  input AffiliationUserOrder {
    # The field to order affiliations by.
    field: AffiliationUserOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which affiliation connections can be ordered.
  enum AffiliationUserOrderField {
    # Order affiliation edges by username.
    USER_USERNAME

    # Order affiliation edges by displayName
    USER_DISPLAYNAME

    # Order affiliation edges by user verification status
    USER_EMAIL_VALIDATED

    # Order affiliation edges by amount of total affiliations
    USER_AFFILIATIONS_COUNT
  }

  # Ordering options for organization connections
  input OrganizationOrder {
    # The field to order organizations by.
    field: OrganizationOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which organization connections can be ordered.
  enum OrganizationOrderField {
    # Order organizations by acronym.
    ACRONYM

    # Order organizations by name.
    NAME

    # Order organizations by slug.
    SLUG

    # Order organizations by zone.
    ZONE

    # Order organizations by sector.
    SECTOR

    # Order organizations by country.
    COUNTRY

    # Order organizations by province.
    PROVINCE

    # Order organizations by city.
    CITY

    # Order organizations by verified.
    VERIFIED

    # Order organizations by summary mail pass count.
    SUMMARY_MAIL_PASS

    # Order organizations by summary mail fail count.
    SUMMARY_MAIL_FAIL

    # Order organizations by summary mail total count.
    SUMMARY_MAIL_TOTAL

    # Order organizations by summary web pass count.
    SUMMARY_WEB_PASS

    # Order organizations by summary web fail count.
    SUMMARY_WEB_FAIL

    # Order organizations by summary web total count.
    SUMMARY_WEB_TOTAL

    # Order organizations by domain count.
    DOMAIN_COUNT
  }

  # Results of DKIM, DMARC, and SPF scans on the given domain.
  type EmailScan {
    # The domain the scan was ran on.
    domain: Domain

    # DomainKeys Identified Mail (DKIM) Signatures scan results.
    dkim(
      # Start date for date filter.
      startDate: Date

      # End date for date filter.
      endDate: Date

      # Ordering options for dkim connections.
      orderBy: DKIMOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DKIMConnection

    # Domain-based Message Authentication, Reporting, and Conformance (DMARC) scan results.
    dmarc(
      # Start date for date filter.
      startDate: Date

      # End date for date filter.
      endDate: Date

      # Ordering options for dmarc connections.
      orderBy: DMARCOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DMARCConnection

    # Sender Policy Framework (SPF) scan results.
    spf(
      # Start date for date filter.
      startDate: Date

      # End date for date filter.
      endDate: Date

      # Ordering options for spf connections.
      orderBy: SPFOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): SPFConnection
  }

  # A connection to a list of items.
  type DKIMConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DKIMEdge]

    # The total amount of dkim scans related to a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type DKIMEdge {
    # The item at the end of the edge
    node: DKIM

    # A cursor for use in pagination
    cursor: String!
  }

  # DomainKeys Identified Mail (DKIM) permits a person, role, or
  # organization that owns the signing domain to claim some
  # responsibility for a message by associating the domain with the
  # message.  This can be an author's organization, an operational relay,
  # or one of their agents.
  type DKIM implements Node {
    # The ID of an object
    id: ID!

    # The domain the scan was ran on.
    domain: Domain

    # The time when the scan was initiated.
    timestamp: Date

    # Individual scans results for each DKIM selector.
    results(
      # Ordering options for DKIM result connections.
      orderBy: DKIMResultOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DKIMResultConnection
  }

  # A date string, such as 2007-12-03, compliant with the \`full-date\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
  scalar Date

  # A connection to a list of items.
  type DKIMResultConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DKIMResultEdge]

    # The total amount of dkim results related to a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type DKIMResultEdge {
    # The item at the end of the edge
    node: DKIMResult

    # A cursor for use in pagination
    cursor: String!
  }

  # Individual scans results for the given DKIM selector.
  type DKIMResult implements Node {
    # The ID of an object
    id: ID!

    # The DKIM scan information that this result belongs to.
    dkim: DKIM

    # The selector the scan was ran on.
    selector: String

    # DKIM record retrieved during the scan of the domain.
    record: String

    # Size of the Public Key in bits
    keyLength: String

    # Raw scan result.
    rawJson: JSON

    # Guidance tags found during scan.
    guidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
      @deprecated(
        reason: "This has been sub-divided into neutral, negative, and positive tags."
      )

    # Negative guidance tags found during scan.
    negativeGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Neutral guidance tags found during scan.
    neutralGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Positive guidance tags found during scan.
    positiveGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
  }

  # The \`JSON\` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
  scalar JSON

  # A connection to a list of items.
  type GuidanceTagConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [GuidanceTagEdge]

    # The total amount of guidance tags for a given scan type.
    totalCount: Int
  }

  # An edge in a connection.
  type GuidanceTagEdge {
    # The item at the end of the edge
    node: GuidanceTag

    # A cursor for use in pagination
    cursor: String!
  }

  # Details for a given guidance tag based on https://github.com/canada-ca/tracker/wiki/Guidance-Tags
  type GuidanceTag implements Node {
    # The ID of an object
    id: ID!

    # The guidance tag ID.
    tagId: String

    # The guidance tag name.
    tagName: String

    # Guidance for changes to record, or to maintain current stance.
    guidance: String

    # Links to implementation guidance for a given tag.
    refLinks: [RefLinks]

    # Links to technical information for a given tag.
    refLinksTech: [RefLinks]
  }

  # Object containing the information of various links for guidance or technical documentation.
  type RefLinks {
    # Title of the guidance link.
    description: String

    # URL for the guidance documentation.
    refLink: String
  }

  # Ordering options for guidance tag connections.
  input GuidanceTagOrder {
    # The field to order guidance tags by.
    field: GuidanceTagOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which Guidance Tag connections can be ordered.
  enum GuidanceTagOrderField {
    # Order guidance tag edges by tag id.
    TAG_ID

    # Order guidance tag edges by tag name.
    TAG_NAME

    # Order guidance tag edges by tag guidance.
    GUIDANCE
  }

  # Ordering options for DKIM Result connections.
  input DKIMResultOrder {
    # The field to order DKIM Results by.
    field: DKIMResultOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which DKIM Result connections can be ordered.
  enum DKIMResultOrderField {
    # Order DKIM Result edges by timestamp.
    SELECTOR

    # Order DKIM Result edges by record.
    RECORD

    # Order DKIM Result edges by key length.
    KEY_LENGTH
  }

  # Ordering options for DKIM connections.
  input DKIMOrder {
    # The field to order DKIM scans by.
    field: DKIMOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which DKIM connections can be ordered.
  enum DKIMOrderField {
    # Order DKIM edges by timestamp.
    TIMESTAMP
  }

  # A connection to a list of items.
  type DMARCConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DMARCEdge]

    # The total amount of dmarc scans related to a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type DMARCEdge {
    # The item at the end of the edge
    node: DMARC

    # A cursor for use in pagination
    cursor: String!
  }

  # Domain-based Message Authentication, Reporting, and Conformance
  # (DMARC) is a scalable mechanism by which a mail-originating
  # organization can express domain-level policies and preferences for
  # message validation, disposition, and reporting, that a mail-receiving
  # organization can use to improve mail handling.
  type DMARC implements Node {
    # The ID of an object
    id: ID!

    # The domain the scan was ran on.
    domain: Domain

    # The time when the scan was initiated.
    timestamp: Date

    # DMARC record retrieved during scan.
    record: String

    # The requested policy you wish mailbox providers to apply
    # when your email fails DMARC authentication and alignment checks.
    pPolicy: String

    # This tag is used to indicate a requested policy for all
    # subdomains where mail is failing the DMARC authentication and alignment checks.
    spPolicy: String

    # The percentage of messages to which the DMARC policy is to be applied.
    pct: Int

    # Raw scan result.
    rawJson: JSON

    # Guidance tags found during DMARC Scan.
    guidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
      @deprecated(
        reason: "This has been sub-divided into neutral, negative, and positive tags."
      )

    # Negative guidance tags found during DMARC Scan.
    negativeGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Neutral guidance tags found during DMARC Scan.
    neutralGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Positive guidance tags found during DMARC Scan.
    positiveGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
  }

  # Ordering options for DMARC connections.
  input DMARCOrder {
    # The field to order DMARC scans by.
    field: DmarcOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which dmarc connections can be ordered.
  enum DmarcOrderField {
    # Order dmarc summaries by timestamp.
    TIMESTAMP

    # Order dmarc summaries by record.
    RECORD

    # Order dmarc summaries by p policy.
    P_POLICY

    # Order dmarc summaries by sp policy.
    SP_POLICY

    # Order dmarc summaries by percentage.
    PCT
  }

  # A connection to a list of items.
  type SPFConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [SPFEdge]

    # The total amount of spf scans related to a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type SPFEdge {
    # The item at the end of the edge
    node: SPF

    # A cursor for use in pagination
    cursor: String!
  }

  # Email on the Internet can be forged in a number of ways.  In
  # particular, existing protocols place no restriction on what a sending
  # host can use as the "MAIL FROM" of a message or the domain given on
  # the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
  # protocol is where Administrative Management Domains (ADMDs) can explicitly
  # authorize the hosts that are allowed to use their domain names, and a
  # receiving host can check such authorization.
  type SPF implements Node {
    # The ID of an object
    id: ID!

    # The domain the scan was ran on.
    domain: Domain

    # The time the scan was initiated.
    timestamp: Date

    # The amount of DNS lookups.
    lookups: Int

    # SPF record retrieved during the scan of the given domain.
    record: String

    # Instruction of what a recipient should do if there is not a match to your SPF record.
    spfDefault: String

    # Raw scan result.
    rawJson: JSON

    # Guidance tags found during scan.
    guidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
      @deprecated(
        reason: "This has been sub-divided into neutral, negative, and positive tags."
      )

    # Negative guidance tags found during scan.
    negativeGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Neutral guidance tags found during scan.
    neutralGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Positive guidance tags found during scan.
    positiveGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
  }

  # Ordering options for SPF connections.
  input SPFOrder {
    # The field to order SPF scans by.
    field: SPFOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which SPF connections can be ordered.
  enum SPFOrderField {
    # Order SPF edges by timestamp.
    TIMESTAMP

    # Order SPF edges by lookups.
    LOOKUPS

    # Order SPF edges by record.
    RECORD

    # Order SPF edges by spf-default.
    SPF_DEFAULT
  }

  # Results of HTTPS, and SSL scan on the given domain.
  type WebScan {
    # The domain the scan was ran on.
    domain: Domain

    # Hyper Text Transfer Protocol Secure scan results.
    https(
      # Start date for date filter.
      startDate: Date

      # End date for date filter.
      endDate: Date

      # Ordering options for https connections.
      orderBy: HTTPSOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): HTTPSConnection

    # Secure Socket Layer scan results.
    ssl(
      # Start date for date filter.
      startDate: Date

      # End date for date filter.
      endDate: Date

      # Ordering options for ssl connections.
      orderBy: SSLOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): SSLConnection
  }

  # A connection to a list of items.
  type HTTPSConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [HTTPSEdge]

    # The total amount of https scans for a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type HTTPSEdge {
    # The item at the end of the edge
    node: HTTPS

    # A cursor for use in pagination
    cursor: String!
  }

  # Hyper Text Transfer Protocol Secure scan results.
  type HTTPS implements Node {
    # The ID of an object
    id: ID!

    # The domain the scan was ran on.
    domain: Domain

    # The time the scan was initiated.
    timestamp: Date

    # State of the HTTPS implementation on the server and any issues therein.
    implementation: String

    # Degree to which HTTPS is enforced on the server based on behaviour.
    enforced: String

    # Presence and completeness of HSTS implementation.
    hsts: String

    # Denotes how long the domain should only be accessed using HTTPS
    hstsAge: String

    # Denotes whether the domain has been submitted and included within HSTS preload list.
    preloaded: String

    # Raw scan result.
    rawJson: JSON

    # Guidance tags found during scan.
    guidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
      @deprecated(
        reason: "This has been sub-divided into neutral, negative, and positive tags."
      )

    # Negative guidance tags found during scan.
    negativeGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Neutral guidance tags found during scan.
    neutralGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Positive guidance tags found during scan.
    positiveGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
  }

  # Ordering options for HTTPS connections.
  input HTTPSOrder {
    # The field to order HTTPS edges by.
    field: HTTPSOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which HTTPS connections can be ordered.
  enum HTTPSOrderField {
    # Order HTTPS edges by timestamp.
    TIMESTAMP

    # Order HTTPS edges by implementation.
    IMPLEMENTATION

    # Order HTTPS edges by enforced.
    ENFORCED

    # Order HTTPS edges by hsts.
    HSTS

    # Order HTTPS edges by hsts age.
    HSTS_AGE

    # Order HTTPS edges by preloaded.
    PRELOADED
  }

  # A connection to a list of items.
  type SSLConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [SSLEdge]

    # The total amount of https scans for a given domain.
    totalCount: Int
  }

  # An edge in a connection.
  type SSLEdge {
    # The item at the end of the edge
    node: SSL

    # A cursor for use in pagination
    cursor: String!
  }

  # Secure Socket Layer scan results.
  type SSL implements Node {
    # The ID of an object
    id: ID!

    # List of ciphers in use by the server deemed to be "acceptable".
    acceptableCiphers: [String]

    # List of curves in use by the server deemed to be "acceptable".
    acceptableCurves: [String]

    # Denotes vulnerability to OpenSSL CCS Injection.
    ccsInjectionVulnerable: Boolean

    # The domain the scan was ran on.
    domain: Domain

    # Denotes vulnerability to "Heartbleed" exploit.
    heartbleedVulnerable: Boolean

    # Raw scan result.
    rawJson: JSON

    # List of ciphers in use by the server deemed to be "strong".
    strongCiphers: [String]

    # List of curves in use by the server deemed to be "strong".
    strongCurves: [String]

    # Denotes support for elliptic curve key pairs.
    supportsEcdhKeyExchange: Boolean

    # The time when the scan was initiated.
    timestamp: Date

    # List of ciphers in use by the server deemed to be "weak" or in other words, are not compliant with security standards.
    weakCiphers: [String]

    # List of curves in use by the server deemed to be "weak" or in other words, are not compliant with security standards.
    weakCurves: [String]

    # Guidance tags found during scan.
    guidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
      @deprecated(
        reason: "This has been sub-divided into neutral, negative, and positive tags."
      )

    # Negative guidance tags found during scan.
    negativeGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Neutral guidance tags found during scan.
    neutralGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection

    # Positive guidance tags found during scan.
    positiveGuidanceTags(
      # Ordering options for guidance tag connections
      orderBy: GuidanceTagOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): GuidanceTagConnection
  }

  # Ordering options for SSL connections.
  input SSLOrder {
    # The field to order SSL edges by.
    field: SSLOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which SSL connections can be ordered.
  enum SSLOrderField {
    # Order SSL edges by their acceptable ciphers.
    ACCEPTABLE_CIPHERS

    # Order SSL edges by their acceptable curves.
    ACCEPTABLE_CURVES

    # Order SSL edges by ccs-injection-vulnerable.
    CCS_INJECTION_VULNERABLE

    # Order SSL edges by heart-bleed-vulnerable.
    HEARTBLEED_VULNERABLE

    # Order SSL edges by their strong ciphers.
    STRONG_CIPHERS

    # Order SSL edges by their strong curves.
    STRONG_CURVES

    # Order SSL edges by supports-ecdh-key-exchange.
    SUPPORTS_ECDH_KEY_EXCHANGE

    # Order SSL edges by timestamp.
    TIMESTAMP

    # Order SSL edges by their weak ciphers.
    WEAK_CIPHERS

    # Order SSL edges by their weak curves.
    WEAK_CURVES
  }

  # An enum used to select information from the dmarc-report-api.
  enum PeriodEnums {
    # The month of January.
    JANUARY

    # The month of February.
    FEBRUARY

    # The month of March.
    MARCH

    # The month of April.
    APRIL

    # The month of May.
    MAY

    # The month of June.
    JUNE

    # The month of July.
    JULY

    # The month of August.
    AUGUST

    # The month of September.
    SEPTEMBER

    # The month of October.
    OCTOBER

    # The month of November.
    NOVEMBER

    # The month of December.
    DECEMBER

    # The last 30 days.
    LAST30DAYS
  }

  # A field that conforms to a 4 digit integer.
  scalar Year

  # This object displays the percentages of the category totals.
  type CategoryPercentages {
    # Percentage of messages that are failing all checks.
    failPercentage: Float

    # Percentage of messages that are passing all checks.
    fullPassPercentage: Float

    # Percentage of messages that are passing only dkim.
    passDkimOnlyPercentage: Float

    # Percentage of messages that are passing only spf.
    passSpfOnlyPercentage: Float

    # The total amount of messages sent by this domain.
    totalMessages: Int
  }

  # This object displays the total amount of messages that fit into each category.
  type CategoryTotals {
    # Amount of messages that are passing SPF, but failing DKIM.
    passSpfOnly: Int

    # Amount of messages that are passing DKIM, but failing SPF.
    passDkimOnly: Int

    # Amount of messages that are passing SPF and DKIM.
    fullPass: Int

    # Amount of messages that fail both SPF and DKIM.
    fail: Int
  }

  # Object that contains the various senders and details for each category.
  type DetailTables {
    # List of senders that are failing DKIM checks.
    dkimFailure(
      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DkimFailureTableConnection

    # List of senders that are failing DMARC checks.
    dmarcFailure(
      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): DmarcFailureTableConnection

    # List of senders that are passing all checks.
    fullPass(
      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): FullPassTableConnection

    # List of senders that are failing SPF checks.
    spfFailure(
      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): SpfFailureTableConnection
  }

  # A connection to a list of items.
  type DkimFailureTableConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DkimFailureTableEdge]

    # The total amount of dkim failure the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type DkimFailureTableEdge {
    # The item at the end of the edge
    node: DkimFailureTable

    # A cursor for use in pagination
    cursor: String!
  }

  # This table contains the data fields for senders who are in the DKIM fail category.
  type DkimFailureTable {
    # The ID of an object
    id: ID!

    # Is DKIM aligned.
    dkimAligned: Boolean

    # Domains used for DKIM validation
    dkimDomains: String

    # The results of DKIM verification of the message. Can be pass, fail, neutral, temp-error, or perm-error.
    dkimResults: String

    # Pointer to a DKIM public key record in DNS.
    dkimSelectors: String

    # Host from reverse DNS of source IP address.
    dnsHost: String

    # Domain from SMTP banner message.
    envelopeFrom: String

    # Guidance for any issues that were found from the report.
    guidance: String
      @deprecated(
        reason: "This has been turned into the \`guidanceTag\` field providing detailed information to act upon if a given tag is present."
      )

    # Guidance for any issues that were found from the report.
    guidanceTag: GuidanceTag

    # The address/domain used in the "From" field.
    headerFrom: String

    # IP address of sending server.
    sourceIpAddress: String

    # Total messages from this sender.
    totalMessages: Int
  }

  # A connection to a list of items.
  type DmarcFailureTableConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [DmarcFailureTableEdge]

    # The total amount of dmarc failures the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type DmarcFailureTableEdge {
    # The item at the end of the edge
    node: DmarcFailureTable

    # A cursor for use in pagination
    cursor: String!
  }

  # This table contains the data fields for senders who are in the DMARC failure category.
  type DmarcFailureTable {
    # The ID of an object
    id: ID!

    # Domains used for DKIM validation
    dkimDomains: String

    # Pointer to a DKIM public key record in DNS.
    dkimSelectors: String

    # The DMARC enforcement action that the receiver took, either none, quarantine, or reject.
    disposition: String

    # Host from reverse DNS of source IP address.
    dnsHost: String

    # Domain from SMTP banner message.
    envelopeFrom: String

    # The address/domain used in the "From" field.
    headerFrom: String

    # IP address of sending server.
    sourceIpAddress: String

    # Domains used for SPF validation.
    spfDomains: String

    # Total messages from this sender.
    totalMessages: Int
  }

  # A connection to a list of items.
  type FullPassTableConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [FullPassTableEdge]

    # The total amount of full passes the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type FullPassTableEdge {
    # The item at the end of the edge
    node: FullPassTable

    # A cursor for use in pagination
    cursor: String!
  }

  # This table contains the data fields for senders who are in the Full Pass category.
  type FullPassTable {
    # The ID of an object
    id: ID!

    # Domains used for DKIM validation
    dkimDomains: String

    # Pointer to a DKIM public key record in DNS.
    dkimSelectors: String

    # Host from reverse DNS of source IP address.
    dnsHost: String

    # Domain from SMTP banner message.
    envelopeFrom: String

    # The address/domain used in the "From" field.
    headerFrom: String

    # IP address of sending server.
    sourceIpAddress: String

    # Domains used for SPF validation.
    spfDomains: String

    # Total messages from this sender.
    totalMessages: Int
  }

  # A connection to a list of items.
  type SpfFailureTableConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [SpfFailureTableEdge]

    # The total amount of spf failures the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type SpfFailureTableEdge {
    # The item at the end of the edge
    node: SpfFailureTable

    # A cursor for use in pagination
    cursor: String!
  }

  # This table contains the data fields for senders who are in the SPF fail category.
  type SpfFailureTable {
    # The ID of an object
    id: ID!

    # Host from reverse DNS of source IP address.
    dnsHost: String

    # Domain from SMTP banner message.
    envelopeFrom: String

    # Guidance for any issues that were found from the report.
    guidance: String
      @deprecated(
        reason: "This has been turned into the \`guidanceTag\` field providing detailed information to act upon if a given tag is present."
      )

    # Guidance for any issues that were found from the report.
    guidanceTag: GuidanceTag

    # The address/domain used in the "From" field.
    headerFrom: String

    # IP address of sending server.
    sourceIpAddress: String

    # Is SPF aligned.
    spfAligned: Boolean

    # Domains used for SPF validation.
    spfDomains: String

    # The results of DKIM verification of the message. Can be pass, fail, neutral, soft-fail, temp-error, or perm-error.
    spfResults: String

    # Total messages from this sender.
    totalMessages: Int
  }

  # Ordering options for dmarc summary connections.
  input DmarcSummaryOrder {
    # The field to order dmarc summaries by.
    field: DmarcSummaryOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which dmarc summary connections can be ordered.
  enum DmarcSummaryOrderField {
    # Order dmarc summaries by fail count.
    FAIL

    # Order dmarc summaries by pass count.
    FULL_PASS

    # Order dmarc summaries by pass dkim only count.
    PASS_DKIM_ONLY

    # Order dmarc summaries by pass spf only count.
    PASS_SPF_ONLY

    # Order dmarc summaries by fail percentage.
    FAIL_PERCENTAGE

    # Order dmarc summaries by pass percentage.
    FULL_PASS_PERCENTAGE

    # Order dmarc summaries by pass dkim only percentage.
    PASS_DKIM_ONLY_PERCENTAGE

    # Order dmarc summaries by spf only percentage.
    PASS_SPF_ONLY_PERCENTAGE

    # Order dmarc summaries by total messages
    TOTAL_MESSAGES

    # Order dmarc summaries by their respective domains.
    DOMAIN
  }

  # A connection to a list of items.
  type WebCheckOrgConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [WebCheckOrgEdge]

    # The total amount of organizations the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type WebCheckOrgEdge {
    # The item at the end of the edge
    node: WebCheckOrg

    # A cursor for use in pagination
    cursor: String!
  }

  type WebCheckOrg {
    # The ID of an object
    id: ID!

    # The organizations acronym.
    acronym: Acronym

    # The full name of the organization.
    name: String

    # Slugified name of the organization.
    slug: Slug

    # Whether the organization is a verified organization.
    verified: Boolean

    # Whether or not the domain has a aggregate dmarc report.
    tags: TagConnection
    domains: WebCheckDomainConnection
  }

  type TagConnection {
    edges: [DomainTag]
    totalCount: Int
  }

  # This object contains information about a vulnerability affecting the domain.
  type DomainTag {
    # CVE ID of the detected vulnerability.
    id: String

    # Time that the vulnerability was first scanned
    firstDetected: String

    # Protocols Status
    severity: SeverityEnum
  }

  # Enum used to inform front end of the level of severity of a given vulnerability for a domain
  enum SeverityEnum {
    # If the given CVE is of a low level severity
    LOW

    # If the given CVE is of a medium level severity
    MEDIUM

    # If the given CVE is of a high level severity
    HIGH

    # If the given cve is of a critical level severity
    CRITICAL
  }

  type WebCheckDomainConnection {
    edges: [WebCheckDomain]

    # The total amount of domains with vulnerability tags
    totalCount: Int
  }

  type WebCheckDomain {
    # The ID of an object
    id: ID!

    # Domain that scans will be ran on.
    domain: DomainScalar

    # The last time that a scan was ran on this domain.
    lastRan: String

    # Vulnerabilities that the domain has tested positive for.
    tags: TagConnection
  }

  # This object is used for showing personal user details,
  # and is used for only showing the details of the querying user.
  type PersonalUser implements Node {
    # The ID of an object
    id: ID!

    # Users email address.
    userName: EmailAddress

    # Name displayed to other users.
    displayName: String

    # The phone number the user has setup with tfa.
    phoneNumber: PhoneNumber

    # Users preferred language.
    preferredLang: LanguageEnums

    # Has the user completed phone validation.
    phoneValidated: Boolean

    # Has the user email verified their account.
    emailValidated: Boolean

    # The method in which TFA codes are sent.
    tfaSendMethod: TFASendMethodEnum

    # Users affiliations to various organizations.
    affiliations(
      # Ordering options for affiliation connections.
      orderBy: AffiliationOrgOrder

      # String used to search for affiliated organizations.
      search: String

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): AffiliationConnection
  }

  # A field whose value conforms to the standard E.164 format as specified in: https://en.wikipedia.org/wiki/E.164. Basically this is +17895551234.
  scalar PhoneNumber

  # An enum used to define user's language.
  enum LanguageEnums {
    # Used for defining if English is the preferred language.
    ENGLISH

    # Used for defining if French is the preferred language.
    FRENCH
  }

  enum TFASendMethodEnum {
    # Used for defining that the TFA code will be sent via email.
    EMAIL

    # Used for defining that the TFA code will be sent via text.
    PHONE

    # User has not setup any TFA methods.
    NONE
  }

  # A connection to a list of items.
  type UserConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [UserEdge]

    # The total amount of users the user has access to.
    totalCount: Int
  }

  # An edge in a connection.
  type UserEdge {
    # The item at the end of the edge
    node: SharedUser

    # A cursor for use in pagination
    cursor: String!
  }

  # Domain object containing information for a given domain.
  type VerifiedDomain implements Node {
    # The ID of an object
    id: ID!

    # Domain that scans will be ran on.
    domain: DomainScalar

    # The last time that a scan was ran on this domain.
    lastRan: Date

    # The domains scan status, based on the latest scan data.
    status: DomainStatus

    # The organization that this domain belongs to.
    organizations(
      # Ordering options for verified organization connections.
      orderBy: VerifiedOrganizationOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): VerifiedOrganizationConnection
  }

  # A connection to a list of items.
  type VerifiedOrganizationConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [VerifiedOrganizationEdge]

    # The total amount of verified organizations.
    totalCount: Int
  }

  # An edge in a connection.
  type VerifiedOrganizationEdge {
    # The item at the end of the edge
    node: VerifiedOrganization

    # A cursor for use in pagination
    cursor: String!
  }

  # Verified Organization object containing information for a given Organization.
  type VerifiedOrganization implements Node {
    # The ID of an object
    id: ID!

    # The organizations acronym.
    acronym: Acronym

    # The full name of the organization.
    name: String

    # Slugified name of the organization.
    slug: Slug

    # The zone which the organization belongs to.
    zone: String

    # The sector which the organization belongs to.
    sector: String

    # The country in which the organization resides.
    country: String

    # The province in which the organization resides.
    province: String

    # The city in which the organization resides.
    city: String

    # Whether the organization is a verified organization.
    verified: Boolean

    # Summaries based on scan types that are preformed on the given organizations domains.
    summaries: OrganizationSummary

    # The number of domains associated with this organization.
    domainCount: Int

    # The domains which are associated with this organization.
    domains(
      # Ordering options for verified domain connections.
      orderBy: VerifiedDomainOrder

      # Returns the items in the list that come after the specified cursor.
      after: String

      # Returns the first n items from the list.
      first: Int

      # Returns the items in the list that come before the specified cursor.
      before: String

      # Returns the last n items from the list.
      last: Int
    ): VerifiedDomainConnection
  }

  # A connection to a list of items.
  type VerifiedDomainConnection {
    # Information to aid in pagination.
    pageInfo: PageInfo!

    # A list of edges.
    edges: [VerifiedDomainEdge]

    # The total amount of verified domains.
    totalCount: Int
  }

  # An edge in a connection.
  type VerifiedDomainEdge {
    # The item at the end of the edge
    node: VerifiedDomain

    # A cursor for use in pagination
    cursor: String!
  }

  # Ordering options for verified domain connections.
  input VerifiedDomainOrder {
    # The field to order verified domains by.
    field: VerifiedDomainOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which verified domain connections can be ordered.
  enum VerifiedDomainOrderField {
    # Order verified domain edges by domain.
    DOMAIN

    # Order verified domain edges by last ran.
    LAST_RAN

    # Order verified domain edges by dkim status.
    DKIM_STATUS

    # Order verified domain edges by dmarc status.
    DMARC_STATUS

    # Order verified domain edges by https status.
    HTTPS_STATUS

    # Order verified domain edges by spf status.
    SPF_STATUS

    # Order verified domain edges by ssl status.
    SSL_STATUS
  }

  # Ordering options for verified organization connections.
  input VerifiedOrganizationOrder {
    # The field to order verified organizations by.
    field: VerifiedOrganizationOrderField!

    # The ordering direction.
    direction: OrderDirection!
  }

  # Properties by which verified organization connections can be ordered.
  enum VerifiedOrganizationOrderField {
    # Order verified organization edges by acronym.
    ACRONYM

    # Order verified organization edges by name.
    NAME

    # Order verified organization edges by zone.
    ZONE

    # Order verified organization edges by sector.
    SECTOR

    # Order verified organization edges by country.
    COUNTRY

    # Order verified organizations by summary mail pass count.
    SUMMARY_MAIL_PASS

    # Order verified organizations by summary mail fail count.
    SUMMARY_MAIL_FAIL

    # Order verified organizations by summary mail total count.
    SUMMARY_MAIL_TOTAL

    # Order verified organizations by summary web pass count.
    SUMMARY_WEB_PASS

    # Order verified organizations by summary web fail count.
    SUMMARY_WEB_FAIL

    # Order verified organizations by summary web total count.
    SUMMARY_WEB_TOTAL

    # Order verified organizations by domain count.
    DOMAIN_COUNT
  }

  type Mutation {
    # This mutation allows admins and higher to invite users to any of their
    # organizations, if the invited user does not have an account, they will be
    # able to sign-up and be assigned to that organization in one mutation.
    inviteUserToOrg(input: InviteUserToOrgInput!): InviteUserToOrgPayload

    # This mutation allows users to leave a given organization.
    leaveOrganization(input: LeaveOrganizationInput!): LeaveOrganizationPayload

    # This mutation allows admins or higher to remove users from any organizations they belong to.
    removeUserFromOrg(input: RemoveUserFromOrgInput!): RemoveUserFromOrgPayload

    # This mutation allows a user to transfer org ownership to another user in the given org.
    transferOrgOwnership(
      input: TransferOrgOwnershipInput!
    ): TransferOrgOwnershipPayload

    # This mutation allows super admins, and admins of the given organization to
    # update the permission level of a given user that already belongs to the
    # given organization.
    updateUserRole(input: UpdateUserRoleInput!): UpdateUserRolePayload

    # Mutation used to create a new domain for an organization.
    createDomain(input: CreateDomainInput!): CreateDomainPayload

    # This mutation allows the removal of unused domains.
    removeDomain(input: RemoveDomainInput!): RemoveDomainPayload

    # This mutation is used to step a manual scan on a requested domain.
    requestScan(input: RequestScanInput!): RequestScanPayload

    # Mutation allows the modification of domains if domain is updated through out its life-cycle
    updateDomain(input: UpdateDomainInput!): UpdateDomainPayload

    # This mutation allows the creation of an organization inside the database.
    createOrganization(
      input: CreateOrganizationInput!
    ): CreateOrganizationPayload

    # This mutation allows the removal of unused organizations.
    removeOrganization(
      input: RemoveOrganizationInput!
    ): RemoveOrganizationPayload

    # Mutation allows the modification of organizations if any changes to the organization may occur.
    updateOrganization(
      input: UpdateOrganizationInput!
    ): UpdateOrganizationPayload

    # Mutation allows the verification of an organization.
    verifyOrganization(
      input: VerifyOrganizationInput!
    ): VerifyOrganizationPayload

    # This mutation allows users to give their credentials and retrieve a token that gives them access to restricted content.
    authenticate(input: AuthenticateInput!): AuthenticatePayload

    # This mutation allows a user to close their account, or a super admin to close another user's account.
    closeAccount(input: CloseAccountInput!): CloseAccountPayload

    # This mutation allows users to give their current auth token, and refresh token, and receive a freshly updated auth token.
    refreshTokens(input: RefreshTokensInput!): RefreshTokensPayload

    # This mutation allows for users to remove a phone number from their account.
    removePhoneNumber(input: RemovePhoneNumberInput!): RemovePhoneNumberPayload

    # This mutation allows the user to take the token they received in their email to reset their password.
    resetPassword(input: ResetPasswordInput!): ResetPasswordPayload

    # This mutation is used for re-sending a verification email if it failed during user creation.
    sendEmailVerification(
      input: SendEmailVerificationInput!
    ): SendEmailVerificationPayload

    # This mutation allows a user to provide their username and request that a password reset email be sent to their account with a reset token in a url.
    sendPasswordResetLink(
      input: SendPasswordResetLinkInput!
    ): SendPasswordResetLinkPayload

    # This mutation is used for setting a new phone number for a user, and sending a code for verifying the new number.
    setPhoneNumber(input: SetPhoneNumberInput!): SetPhoneNumberPayload

    # This mutation allows users to give their credentials and either signed in, re-directed to the tfa auth page, or given an error.
    signIn(input: SignInInput!): SignInPayload

    # This mutation allows a user to sign out, and clear their cookies.
    signOut(input: SignOutInput!): SignOutPayload

    # This mutation allows for new users to sign up for our sites services.
    signUp(input: SignUpInput!): SignUpPayload

    # This mutation allows the user to update their account password.
    updateUserPassword(
      input: UpdateUserPasswordInput!
    ): UpdateUserPasswordPayload

    # This mutation allows the user to update their user profile to change various details of their current profile.
    updateUserProfile(input: UpdateUserProfileInput!): UpdateUserProfilePayload

    # This mutation allows the user to verify their account through a token sent in an email.
    verifyAccount(input: VerifyAccountInput!): VerifyAccountPayload

    # This mutation allows the user to two factor authenticate.
    verifyPhoneNumber(input: verifyPhoneNumberInput!): verifyPhoneNumberPayload
  }

  type InviteUserToOrgPayload {
    # \`InviteUserToOrgUnion\` returning either a \`InviteUserToOrgResult\`, or \`InviteUserToOrgError\` object.
    result: InviteUserToOrgUnion
    clientMutationId: String
  }

  # This union is used with the \`InviteUserToOrg\` mutation, allowing for users to invite user to their org, and support any errors that may occur
  union InviteUserToOrgUnion = AffiliationError | InviteUserToOrgResult

  # This object is used to inform the user if any errors occurred while executing affiliation mutations.
  type AffiliationError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user of the invitation status.
  type InviteUserToOrgResult {
    # Informs the user if the invite or invite email was successfully sent.
    status: String
  }

  input InviteUserToOrgInput {
    # Users email that you would like to invite to your org.
    userName: EmailAddress!

    # The role which you would like this user to have.
    requestedRole: RoleEnums!

    # The organization you wish to invite the user to.
    orgId: ID!

    # The language in which the email will be sent in.
    preferredLang: LanguageEnums!
    clientMutationId: String
  }

  type LeaveOrganizationPayload {
    # \`LeaveOrganizationUnion\` resolving to either a \`LeaveOrganizationResult\` or \`AffiliationError\`.
    result: LeaveOrganizationUnion
    clientMutationId: String
  }

  # This union is used with the \`leaveOrganization\` mutation, allowing for users to leave a given organization, and support any errors that may occur.
  union LeaveOrganizationUnion = AffiliationError | LeaveOrganizationResult

  # This object is used to inform the user that they successful left a given organization.
  type LeaveOrganizationResult {
    # Status message confirming the user left the org.
    status: String
  }

  input LeaveOrganizationInput {
    # Id of the organization the user is looking to leave.
    orgId: ID!
    clientMutationId: String
  }

  type RemoveUserFromOrgPayload {
    # \`RemoveUserFromOrgUnion\` returning either a \`RemoveUserFromOrgResult\`, or \`RemoveUserFromOrgError\` object.
    result: RemoveUserFromOrgUnion
    clientMutationId: String
  }

  # This union is used with the \`RemoveUserFromOrg\` mutation, allowing for users to remove a user from their org, and support any errors that may occur
  union RemoveUserFromOrgUnion = AffiliationError | RemoveUserFromOrgResult

  # This object is used to inform the user of the removal status.
  type RemoveUserFromOrgResult {
    # Informs the user if the user was successfully removed.
    status: String

    # The user that was just removed.
    user: SharedUser
  }

  input RemoveUserFromOrgInput {
    # The user id of the user to be removed.
    userId: ID!

    # The organization that the user is to be removed from.
    orgId: ID!
    clientMutationId: String
  }

  type TransferOrgOwnershipPayload {
    # \`TransferOrgOwnershipUnion\` resolving to either a \`TransferOrgOwnershipResult\` or \`AffiliationError\`.
    result: TransferOrgOwnershipUnion
    clientMutationId: String
  }

  # This union is used with the \`transferOrgOwnership\` mutation, allowing for
  # users to transfer ownership of a given organization, and support any errors that may occur.
  union TransferOrgOwnershipUnion =
      AffiliationError
    | TransferOrgOwnershipResult

  # This object is used to inform the user that they successful transferred ownership of a given organization.
  type TransferOrgOwnershipResult {
    # Status message confirming the user transferred ownership of the org.
    status: String
  }

  input TransferOrgOwnershipInput {
    # Id of the organization the user is looking to transfer ownership of.
    orgId: ID!

    # Id of the user that the org ownership is being transferred to.
    userId: ID!
    clientMutationId: String
  }

  type UpdateUserRolePayload {
    # \`UpdateUserRoleUnion\` returning either a \`UpdateUserRoleResult\`, or \`UpdateUserRoleError\` object.
    result: UpdateUserRoleUnion
    clientMutationId: String
  }

  # This union is used with the \`UpdateUserRole\` mutation, allowing for users to update a users role in an org, and support any errors that may occur
  union UpdateUserRoleUnion = AffiliationError | UpdateUserRoleResult

  # This object is used to inform the user of the status of the role update.
  type UpdateUserRoleResult {
    # Informs the user if the user who's role was successfully updated.
    status: String

    # The user who's role was successfully updated.
    user: SharedUser
  }

  input UpdateUserRoleInput {
    # The username of the user you wish to update their role to.
    userName: EmailAddress!

    # The organization that the admin, and the user both belong to.
    orgId: ID!

    # The role that the admin wants to give to the selected user.
    role: RoleEnums!
    clientMutationId: String
  }

  type CreateDomainPayload {
    # \`CreateDomainUnion\` returning either a \`Domain\`, or \`CreateDomainError\` object.
    result: CreateDomainUnion
    clientMutationId: String
  }

  # This union is used with the \`CreateDomain\` mutation,
  # allowing for users to create a domain and add it to their org,
  # and support any errors that may occur
  union CreateDomainUnion = DomainError | Domain

  # This object is used to inform the user if any errors occurred while using a domain mutation.
  type DomainError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  input CreateDomainInput {
    # The global id of the organization you wish to assign this domain to.
    orgId: ID!

    # Url that you would like to be added to the database.
    domain: DomainScalar!

    # DKIM selector strings corresponding to this domain.
    selectors: [Selector]
    clientMutationId: String
  }

  type RemoveDomainPayload {
    # \`RemoveDomainUnion\` returning either a \`DomainResultType\`, or \`DomainErrorType\` object.
    result: RemoveDomainUnion!
    clientMutationId: String
  }

  # This union is used with the \`RemoveDomain\` mutation,
  # allowing for users to remove a domain belonging to their org,
  # and support any errors that may occur
  union RemoveDomainUnion = DomainError | DomainResult

  # This object is used to inform the user that no errors were encountered while removing a domain.
  type DomainResult {
    # Informs the user if the domain removal was successful.
    status: String

    # The domain that is being mutated.
    domain: Domain
  }

  input RemoveDomainInput {
    # The global id of the domain you wish to remove.
    domainId: ID!

    # The organization you wish to remove the domain from.
    orgId: ID!
    clientMutationId: String
  }

  type RequestScanPayload {
    # Informs the user if the scan was dispatched successfully.
    status: String
    clientMutationId: String
  }

  input RequestScanInput {
    # The domain that the scan will be ran on.
    domain: DomainScalar
    clientMutationId: String
  }

  type UpdateDomainPayload {
    # \`UpdateDomainUnion\` returning either a \`Domain\`, or \`DomainError\` object.
    result: UpdateDomainUnion
    clientMutationId: String
  }

  # This union is used with the \`UpdateDomain\` mutation,
  # allowing for users to update a domain belonging to their org,
  # and support any errors that may occur
  union UpdateDomainUnion = DomainError | Domain

  input UpdateDomainInput {
    # The global id of the domain that is being updated.
    domainId: ID!

    # The global ID of the organization used for permission checks.
    orgId: ID!

    # The new url of the of the old domain.
    domain: DomainScalar

    # The updated DKIM selector strings corresponding to this domain.
    selectors: [Selector]
    clientMutationId: String
  }

  type CreateOrganizationPayload {
    # \`CreateOrganizationUnion\` returning either an \`Organization\`, or \`OrganizationError\` object.
    result: CreateOrganizationUnion
    clientMutationId: String
  }

  # This union is used with the \`CreateOrganization\` mutation,
  # allowing for users to create an organization, and support any errors that may occur
  union CreateOrganizationUnion = OrganizationError | Organization

  # This object is used to inform the user if any errors occurred while using an organization mutation.
  type OrganizationError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  input CreateOrganizationInput {
    # The English acronym of the organization.
    acronymEN: Acronym!

    # The French acronym of the organization.
    acronymFR: Acronym!

    # The English name of the organization.
    nameEN: String!

    # The French name of the organization.
    nameFR: String!

    # The English translation of the zone the organization belongs to.
    zoneEN: String!

    # The English translation of the zone the organization belongs to.
    zoneFR: String!

    # The English translation of the sector the organization belongs to.
    sectorEN: String!

    # The French translation of the sector the organization belongs to.
    sectorFR: String!

    # The English translation of the country the organization resides in.
    countryEN: String!

    # The French translation of the country the organization resides in.
    countryFR: String!

    # The English translation of the province the organization resides in.
    provinceEN: String!

    # The French translation of the province the organization resides in.
    provinceFR: String!

    # The English translation of the city the organization resides in.
    cityEN: String!

    # The French translation of the city the organization resides in.
    cityFR: String!
    clientMutationId: String
  }

  type RemoveOrganizationPayload {
    # \`RemoveOrganizationUnion\` returning either an \`OrganizationResult\`, or \`OrganizationError\` object.
    result: RemoveOrganizationUnion!
    clientMutationId: String
  }

  # This union is used with the \`RemoveOrganization\` mutation,
  # allowing for users to remove an organization they belong to,
  # and support any errors that may occur
  union RemoveOrganizationUnion = OrganizationError | OrganizationResult

  # This object is used to inform the user that no errors were encountered while running organization mutations.
  type OrganizationResult {
    # Informs the user if the organization mutation was successful.
    status: String

    # The organization that was being affected by the mutation.
    organization: Organization
  }

  input RemoveOrganizationInput {
    # The global id of the organization you wish you remove.
    orgId: ID!
    clientMutationId: String
  }

  type UpdateOrganizationPayload {
    # \`UpdateOrganizationUnion\` returning either an \`Organization\`, or \`OrganizationError\` object.
    result: UpdateOrganizationUnion!
    clientMutationId: String
  }

  # This union is used with the \`UpdateOrganization\` mutation,
  # allowing for users to update an organization, and support any errors that may occur
  union UpdateOrganizationUnion = OrganizationError | Organization

  input UpdateOrganizationInput {
    # The global id of the organization to be updated.
    id: ID!

    # The English acronym of the organization.
    acronymEN: Acronym

    # The French acronym of the organization.
    acronymFR: Acronym

    # The English name of the organization.
    nameEN: String

    # The French name of the organization.
    nameFR: String

    # The English translation of the zone the organization belongs to.
    zoneEN: String

    # The English translation of the zone the organization belongs to.
    zoneFR: String

    # The English translation of the sector the organization belongs to.
    sectorEN: String

    # The French translation of the sector the organization belongs to.
    sectorFR: String

    # The English translation of the country the organization resides in.
    countryEN: String

    # The French translation of the country the organization resides in.
    countryFR: String

    # The English translation of the province the organization resides in.
    provinceEN: String

    # The French translation of the province the organization resides in.
    provinceFR: String

    # The English translation of the city the organization resides in.
    cityEN: String

    # The French translation of the city the organization resides in.
    cityFR: String
    clientMutationId: String
  }

  type VerifyOrganizationPayload {
    # \`VerifyOrganizationUnion\` returning either an \`OrganizationResult\`, or \`OrganizationError\` object.
    result: VerifyOrganizationUnion
    clientMutationId: String
  }

  # This union is used with the \`VerifyOrganization\` mutation,
  # allowing for super admins to verify an organization,
  # and support any errors that may occur
  union VerifyOrganizationUnion = OrganizationError | OrganizationResult

  input VerifyOrganizationInput {
    # The global id of the organization to be verified.
    orgId: ID!
    clientMutationId: String
  }

  type AuthenticatePayload {
    # Authenticate union returning either a \`authResult\` or \`authenticateError\` object.
    result: AuthenticateUnion
    clientMutationId: String
  }

  # This union is used with the \`authenticate\` mutation, allowing for the user to authenticate, and support any errors that may occur
  union AuthenticateUnion = AuthResult | AuthenticateError

  # An object used to return information when users sign up or authenticate.
  type AuthResult {
    # JWT used for accessing controlled content.
    authToken: String

    # User that has just been created or signed in.
    user: PersonalUser
  }

  # This object is used to inform the user if any errors occurred during authentication.
  type AuthenticateError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  input AuthenticateInput {
    # Security code found in text msg, or email inbox.
    authenticationCode: Int!

    # The JWT that is retrieved from the sign in mutation.
    authenticateToken: String!
    clientMutationId: String
  }

  type CloseAccountPayload {
    # \`CloseAccountUnion\` returning either a \`CloseAccountResult\`, or \`CloseAccountError\` object.
    result: CloseAccountUnion
    clientMutationId: String
  }

  # This union is used for the \`closeAccount\` mutation, to support successful or errors that may occur.
  union CloseAccountUnion = CloseAccountResult | CloseAccountError

  # This object is used to inform the user of the status of closing their account.
  type CloseAccountResult {
    # Status of closing the users account.
    status: String
  }

  # This object is used to inform the user if any errors occurred while closing their account.
  type CloseAccountError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue encountered.
    description: String
  }

  input CloseAccountInput {
    # The user id of a user you want to close the account of.
    userId: ID
    clientMutationId: String
  }

  type RefreshTokensPayload {
    # Refresh tokens union returning either a \`authResult\` or \`authenticateError\` object.
    result: RefreshTokensUnion
    clientMutationId: String
  }

  # This union is used with the \`refreshTokens\` mutation, allowing for the user to refresh their tokens, and support any errors that may occur
  union RefreshTokensUnion = AuthResult | AuthenticateError

  input RefreshTokensInput {
    clientMutationId: String
  }

  type RemovePhoneNumberPayload {
    # \`RemovePhoneNumberUnion\` returning either a \`RemovePhoneNumberResult\`, or \`RemovePhoneNumberError\` object.
    result: RemovePhoneNumberUnion
    clientMutationId: String
  }

  # This union is used with the \`RemovePhoneNumber\` mutation, allowing for users to remove their phone number, and support any errors that may occur
  union RemovePhoneNumberUnion =
      RemovePhoneNumberError
    | RemovePhoneNumberResult

  # This object is used to inform the user if any errors occurred while removing their phone number.
  type RemovePhoneNumberError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while removing their phone number.
  type RemovePhoneNumberResult {
    # Informs the user if the phone number removal was successful.
    status: String
  }

  input RemovePhoneNumberInput {
    clientMutationId: String
  }

  type ResetPasswordPayload {
    # \`ResetPasswordUnion\` returning either a \`ResetPasswordResult\`, or \`ResetPasswordError\` object.
    result: ResetPasswordUnion
    clientMutationId: String
  }

  # This union is used with the \`ResetPassword\` mutation, allowing for users to reset their password, and support any errors that may occur
  union ResetPasswordUnion = ResetPasswordError | ResetPasswordResult

  # This object is used to inform the user if any errors occurred while resetting their password.
  type ResetPasswordError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while resetting their password.
  type ResetPasswordResult {
    # Informs the user if the password reset was successful, and to redirect to sign in page.
    status: String
  }

  input ResetPasswordInput {
    # The users new password.
    password: String!

    # A confirmation password to confirm the new password.
    confirmPassword: String!

    # The JWT found in the url, redirected from the email they received.
    resetToken: String!
    clientMutationId: String
  }

  type SendEmailVerificationPayload {
    # Informs the user if the email was sent successfully.
    status: String
    clientMutationId: String
  }

  input SendEmailVerificationInput {
    # The users email address used for sending the verification email.
    userName: EmailAddress!
    clientMutationId: String
  }

  type SendPasswordResetLinkPayload {
    # Informs the user if the password reset email was sent successfully.
    status: String
    clientMutationId: String
  }

  input SendPasswordResetLinkInput {
    # User name for the account you would like to receive a password reset link for.
    userName: EmailAddress!
    clientMutationId: String
  }

  type SetPhoneNumberPayload {
    # \`SetPhoneNumberUnion\` returning either a \`SetPhoneNumberResult\`, or \`SetPhoneNumberError\` object.
    result: SetPhoneNumberUnion
    clientMutationId: String
  }

  # This union is used with the \`setPhoneNumber\` mutation, allowing for users to send a verification code to their phone, and support any errors that may occur
  union SetPhoneNumberUnion = SetPhoneNumberError | SetPhoneNumberResult

  # This object is used to inform the user if any errors occurred while setting a new phone number.
  type SetPhoneNumberError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while setting a new phone number.
  type SetPhoneNumberResult {
    # Informs the user if their phone code was successfully sent.
    status: String

    # The user who set their phone number.
    user: PersonalUser
  }

  input SetPhoneNumberInput {
    # The phone number that the text message will be sent to.
    phoneNumber: PhoneNumber!
    clientMutationId: String
  }

  type SignInPayload {
    # \`SignInUnion\` returning either a \`regularSignInResult\`, \`tfaSignInResult\`, or \`signInError\` object.
    result: SignInUnion
    clientMutationId: String
  }

  # This union is used with the \`SignIn\` mutation, allowing for multiple styles of logging in, and support any errors that may occur
  union SignInUnion = AuthResult | SignInError | TFASignInResult

  # This object is used to inform the user if any errors occurred during sign in.
  type SignInError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used when the user signs in and has validated either their email or phone.
  type TFASignInResult {
    # Token used to verify during authentication.
    authenticateToken: String

    # Whether the authentication code was sent through text, or email.
    sendMethod: String
  }

  input SignInInput {
    # The email the user signed up with.
    userName: EmailAddress!

    # The password the user signed up with
    password: String!

    # Whether or not the user wants to stay signed in after leaving the site.
    rememberMe: Boolean = false
    clientMutationId: String
  }

  type SignOutPayload {
    # Status of the users signing-out.
    status: String
    clientMutationId: String
  }

  input SignOutInput {
    clientMutationId: String
  }

  type SignUpPayload {
    # \`SignUpUnion\` returning either a \`AuthResult\`, or \`SignUpError\` object.
    result: SignUpUnion
    clientMutationId: String
  }

  # This union is used with the \`signUp\` mutation, allowing for the user to sign up, and support any errors that may occur.
  union SignUpUnion = AuthResult | SignUpError

  # This object is used to inform the user if any errors occurred during sign up.
  type SignUpError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  input SignUpInput {
    # The name that will be displayed to other users.
    displayName: String!

    # Email address that the user will use to authenticate with.
    userName: EmailAddress!

    # The password the user will authenticate with.
    password: String!

    # A secondary password field used to confirm the user entered the correct password.
    confirmPassword: String!

    # The users preferred language.
    preferredLang: LanguageEnums!

    # A token sent by email, that will assign a user to an organization with a pre-determined role.
    signUpToken: String

    # Whether or not the user wants to stay signed in after leaving the site.
    rememberMe: Boolean = false
    clientMutationId: String
  }

  type UpdateUserPasswordPayload {
    # \`UpdateUserPasswordUnion\` returning either a \`UpdateUserPasswordResultType\`, or \`UpdateUserPasswordError\` object.
    result: UpdateUserPasswordUnion
    clientMutationId: String
  }

  # This union is used with the \`updateUserPassword\` mutation, allowing for users to update their password, and support any errors that may occur
  union UpdateUserPasswordUnion =
      UpdateUserPasswordError
    | UpdateUserPasswordResultType

  # This object is used to inform the user if any errors occurred while updating their password.
  type UpdateUserPasswordError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while updating their password.
  type UpdateUserPasswordResultType {
    # Informs the user if their password was successfully updated.
    status: String
  }

  input UpdateUserPasswordInput {
    # The users current password to verify it is the current user.
    currentPassword: String!

    # The new password the user wishes to change to.
    updatedPassword: String!

    # A password confirmation of their new password.
    updatedPasswordConfirm: String!
    clientMutationId: String
  }

  type UpdateUserProfilePayload {
    # \`UpdateUserProfileUnion\` returning either a \`UpdateUserProfileResult\`, or \`UpdateUserProfileError\` object.
    result: UpdateUserProfileUnion
    clientMutationId: String
  }

  # This union is used with the \`updateUserProfile\` mutation, allowing for users to update their profile, and support any errors that may occur
  union UpdateUserProfileUnion =
      UpdateUserProfileError
    | UpdateUserProfileResult

  # This object is used to inform the user if any errors occurred while updating their profile.
  type UpdateUserProfileError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while resetting their password.
  type UpdateUserProfileResult {
    # Informs the user if the password reset was successful, and to redirect to sign in page.
    status: String

    # Return the newly updated user information.
    user: PersonalUser
  }

  input UpdateUserProfileInput {
    # The updated display name the user wishes to change to.
    displayName: String

    # The updated user name the user wishes to change to.
    userName: EmailAddress

    # The updated preferred language the user wishes to change to.
    preferredLang: LanguageEnums

    # The method in which the user wishes to have their TFA code sent via.
    tfaSendMethod: TFASendMethodEnum
    clientMutationId: String
  }

  type VerifyAccountPayload {
    # \`VerifyAccountUnion\` returning either a \`VerifyAccountResult\`, or \`VerifyAccountError\` object.
    result: VerifyAccountUnion
    clientMutationId: String
  }

  # This union is used with the \`verifyAccount\` mutation, allowing for users to verify their account, and support any errors that may occur
  union VerifyAccountUnion = VerifyAccountError | VerifyAccountResult

  # This object is used to inform the user if any errors occurred while verifying their account.
  type VerifyAccountError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while verifying their account.
  type VerifyAccountResult {
    # Informs the user if their account was successfully verified.
    status: String
  }

  input VerifyAccountInput {
    # Token sent via email, and located in url.
    verifyTokenString: String!
    clientMutationId: String
  }

  type verifyPhoneNumberPayload {
    # \`VerifyPhoneNumberUnion\` returning either a \`VerifyPhoneNumberResult\`, or \`VerifyPhoneNumberError\` object.
    result: VerifyPhoneNumberUnion
    clientMutationId: String
  }

  # This union is used with the \`verifyPhoneNumber\` mutation, allowing for users to verify their phone number, and support any errors that may occur
  union VerifyPhoneNumberUnion =
      VerifyPhoneNumberError
    | VerifyPhoneNumberResult

  # This object is used to inform the user if any errors occurred while verifying their phone number.
  type VerifyPhoneNumberError {
    # Error code to inform user what the issue is related to.
    code: Int

    # Description of the issue that was encountered.
    description: String
  }

  # This object is used to inform the user that no errors were encountered while verifying their phone number.
  type VerifyPhoneNumberResult {
    # Informs the user if their phone number was successfully verified.
    status: String

    # The user who verified their phone number.
    user: PersonalUser
  }

  input verifyPhoneNumberInput {
    # The two factor code that was received via text message.
    twoFactorCode: Int!
    clientMutationId: String
  }

  type Subscription {
    # This subscription allows the user to receive dkim data directly from the scanners in real time.
    dkimScanData: DkimSub

    # This subscription allows the user to receive dmarc data directly from the scanners in real time.
    dmarcScanData: DmarcSub

    # This subscription allows the user to receive spf data directly from the scanners in real time.
    spfScanData: SpfSub

    # This subscription allows the user to receive https data directly from the scanners in real time.
    httpsScanData: HttpsSub

    # This subscription allows the user to receive ssl data directly from the scanners in real time.
    sslScanData: SslSub
  }

  # DKIM gql object containing the fields for the \`dkimScanData\` subscription.
  type DkimSub {
    # The shared id to match scans together.
    sharedId: ID

    # The domain the scan was ran on.
    domain: Domain

    # The success status of the scan.
    status: StatusEnum

    # Individual scans results for each dkim selector.
    results: [DkimResultSub]
  }

  # Individual one-off scans results for the given dkim selector.
  type DkimResultSub {
    # The selector the scan was ran on.
    selector: String

    # DKIM record retrieved during the scan of the domain.
    record: String

    # Size of the Public Key in bits
    keyLength: String

    # Raw scan result.
    rawJson: JSON

    # Negative guidance tags found during scan.
    negativeGuidanceTags: [GuidanceTag]

    # Neutral guidance tags found during scan.
    neutralGuidanceTags: [GuidanceTag]

    # Positive guidance tags found during scan.
    positiveGuidanceTags: [GuidanceTag]
  }

  # DMARC gql object containing the fields for the \`dkimScanData\` subscription.
  type DmarcSub {
    # The shared id to match scans together.
    sharedId: ID

    # The domain the scan was ran on.
    domain: Domain

    # The current dmarc phase the domain is compliant to.
    dmarcPhase: String

    # The success status of the scan.
    status: StatusEnum

    # DMARC record retrieved during scan.
    record: String

    # The requested policy you wish mailbox providers to apply
    # when your email fails DMARC authentication and alignment checks.
    pPolicy: String

    # This tag is used to indicate a requested policy for all
    # subdomains where mail is failing the DMARC authentication and alignment checks.
    spPolicy: String

    # The percentage of messages to which the DMARC policy is to be applied.
    pct: Int

    # Raw scan result.
    rawJson: JSON

    # Negative guidance tags found during DMARC Scan.
    negativeGuidanceTags: [GuidanceTag]

    # Neutral guidance tags found during DMARC Scan.
    neutralGuidanceTags: [GuidanceTag]

    # Positive guidance tags found during DMARC Scan.
    positiveGuidanceTags: [GuidanceTag]
  }

  # SPF gql object containing the fields for the \`dkimScanData\` subscription.
  type SpfSub {
    # The shared id to match scans together.
    sharedId: ID

    # The domain the scan was ran on.
    domain: Domain

    # The success status of the scan.
    status: StatusEnum

    # The amount of DNS lookups.
    lookups: Int

    # SPF record retrieved during the scan of the given domain.
    record: String

    # Instruction of what a recipient should do if there is not a match to your SPF record.
    spfDefault: String

    # Raw scan result.
    rawJson: JSON

    # Negative guidance tags found during scan.
    negativeGuidanceTags: [GuidanceTag]

    # Neutral guidance tags found during scan.
    neutralGuidanceTags: [GuidanceTag]

    # Positive guidance tags found during scan.
    positiveGuidanceTags: [GuidanceTag]
  }

  # HTTPS gql object containing the fields for the \`dkimScanData\` subscription.
  type HttpsSub {
    # The shared id to match scans together.
    sharedId: ID

    # The domain the scan was ran on.
    domain: Domain

    # The success status of the scan.
    status: StatusEnum

    # State of the HTTPS implementation on the server and any issues therein.
    implementation: String

    # Degree to which HTTPS is enforced on the server based on behaviour.
    enforced: String

    # Presence and completeness of HSTS implementation.
    hsts: String

    # Denotes how long the domain should only be accessed using HTTPS
    hstsAge: String

    # Denotes whether the domain has been submitted and included within HSTS preload list.
    preloaded: String

    # Raw scan result.
    rawJson: JSON

    # Negative guidance tags found during scan.
    negativeGuidanceTags: [GuidanceTag]

    # Neutral guidance tags found during scan.
    neutralGuidanceTags: [GuidanceTag]

    # Positive guidance tags found during scan.
    positiveGuidanceTags: [GuidanceTag]
  }

  # SSL gql object containing the fields for the \`dkimScanData\` subscription.
  type SslSub {
    # The shared id to match scans together.
    sharedId: ID

    # The domain the scan was ran on.
    domain: Domain

    # The success status of the scan.
    status: StatusEnum

    # List of ciphers in use by the server deemed to be "acceptable".
    acceptableCiphers: [String]

    # List of curves in use by the server deemed to be "acceptable".
    acceptableCurves: [String]

    # Denotes vulnerability to OpenSSL CCS Injection.
    ccsInjectionVulnerable: Boolean

    # Denotes vulnerability to "Heartbleed" exploit.
    heartbleedVulnerable: Boolean

    # List of ciphers in use by the server deemed to be "strong".
    strongCiphers: [String]

    # List of curves in use by the server deemed to be "strong".
    strongCurves: [String]

    # Denotes support for elliptic curve key pairs.
    supportsEcdhKeyExchange: Boolean

    # List of ciphers in use by the server deemed to be "weak" or in other words, are not compliant with security standards.
    weakCiphers: [String]

    # List of curves in use by the server deemed to be "weak" or in other words, are not compliant with security standards.
    weakCurves: [String]

    # Raw scan result.
    rawJson: JSON

    # Negative guidance tags found during scan.
    negativeGuidanceTags: [GuidanceTag]

    # Neutral guidance tags found during scan.
    neutralGuidanceTags: [GuidanceTag]

    # Positive guidance tags found during scan.
    positiveGuidanceTags: [GuidanceTag]
  }
`
