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

  # Select activity logs a user has access to.
  findAuditLogs(
    # The organization you wish to query the logs from.
    orgId: ID

    # Ordering options for log connections.
    orderBy: LogOrder

    # String used to search for logs by initiant user or target resource.
    search: String

    # Keywords used to filter log results.
    filters: LogFilters

    # Returns the items in the list that come after the specified cursor.
    after: String

    # Returns the first n items from the list.
    first: Int

    # Returns the items in the list that come before the specified cursor.
    before: String

    # Returns the last n items from the list.
    last: Int
  ): AuditLogConnection

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

  # CSV formatted output of all domains in all organizations including their email and web scan statuses.
  getAllOrganizationDomainStatuses: String

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

  # Select all information on a selected organization that a user has access to.
  findMyTracker: MyTrackerResult

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
type AuditLogConnection {
  # Information to aid in pagination.
  pageInfo: PageInfo!

  # A list of edges.
  edges: [AuditLogEdge]

  # The total amount of logs the user has access to.
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
type AuditLogEdge {
  # The item at the end of the edge
  node: AuditLog

  # A cursor for use in pagination
  cursor: String!
}

# A record of activity that modified the state of a user, domain, or organization
type AuditLog implements Node {
  # The ID of an object
  id: ID!

  # Datetime string the activity occured.
  timestamp: String

  # Username of admin that initiated the activity.
  initiatedBy: InitiatedBy

  # Type of activity that was initiated.
  action: UserActionEnums

  # Information on targeted resource.
  target: TargetResource

  # Optional reason for action, used for domain removal.
  reason: DomainRemovalReasonEnum
}

# Information on the user that initiated the logged action
type InitiatedBy {
  # The ID of an object
  id: ID!

  # User email address.
  userName: EmailAddress

  # User permission level.
  role: RoleEnums

  # User affiliated organization.
  organization: String
}

# A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.
scalar EmailAddress

# An enum used to assign, and test users roles.
enum RoleEnums {
  # A user who has been given access to view an organization.
  USER

  # A user who has the same access as a user write account, but can define new user read/write accounts.
  ADMIN

  # A user who has the same access as an admin, but can define new admins.
  SUPER_ADMIN
}

# Describes actions performed by users to modify resources.
enum UserActionEnums {
  # A new resource was created.
  CREATE

  # A resource was deleted.
  DELETE

  # An affiliation between resources was created.
  ADD

  # Properties of a resource or affiliation were modified.
  UPDATE

  # An affiliation between resources was deleted.
  REMOVE
}

# Resource that was the target of a specified action by a user.
type TargetResource {
  # Name of the targeted resource.
  resource: String

  # Organization that the resource is affiliated with.
  organization: TargetOrganization

  # Type of resource that was modified: user, domain, or organization.
  resourceType: ResourceTypeEnums

  # List of resource properties that were modified.
  updatedProperties: [UpdatedProperties]
}

# Organization that the resource is affiliated with.
type TargetOrganization {
  # The ID of an object
  id: ID!

  # Name of the affiliated organization.
  name: String
}

# Keywords used to decribe resources that can be modified.
enum ResourceTypeEnums {
  # A user account affiliated with an organization.
  USER

  # An organization.
  ORGANIZATION

  # A domain affiliated with an organization.
  DOMAIN
}

# Object describing how a resource property was updated.
type UpdatedProperties {
  # Name of updated resource.
  name: String

  # Old value of updated property.
  oldValue: String

  # New value of updated property.
  newValue: String
}

# Reason why a domain was removed from an organization.
enum DomainRemovalReasonEnum {
  # Domain does not exist.
  NONEXISTENT

  # Domain was in the incorrect organization.
  WRONG_ORG
}

# Ordering options for audit logs.
input LogOrder {
  # The field to order logs by.
  field: LogOrderField!

  # The ordering direction.
  direction: OrderDirection!
}

# Properties by which domain connections can be ordered.
enum LogOrderField {
  # Order logs by timestamp.
  TIMESTAMP

  # Order logs by initiant's username.
  INITIATED_BY

  # Order logs by name of targeted resource.
  RESOURCE_NAME
}

# Possible directions in which to order a list of items when provided an "orderBy" argument.
enum OrderDirection {
  # Specifies an ascending order for a given "orderBy" argument.
  ASC

  # Specifies a descending order for a given "orderBy" argument.
  DESC
}

# Filtering options for audit logs.
input LogFilters {
  # List of resource types to include when returning logs.
  resource: [ResourceTypeEnums]

  # List of user actions to include when returning logs.
  action: [UserActionEnums]
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

  # The status code when performing a DNS lookup for this domain.
  rcode: String

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

  # DNS scan results.
  dnsScan(
    # Start date for date filter.
    startDate: Date

    # End date for date filter.
    endDate: Date

    # Ordering options for DNS connections.
    orderBy: DNSOrder

    # Number of DNS scans to retrieve.
    limit: Int

    # Returns the items in the list that come after the specified cursor.
    after: String

    # Returns the first n items from the list.
    first: Int

    # Returns the items in the list that come before the specified cursor.
    before: String

    # Returns the last n items from the list.
    last: Int
  ): DNSScanConnection

  # HTTPS, and TLS scan results.
  web(
    # Start date for date filter.
    startDate: Date

    # End date for date filter.
    endDate: Date

    # Ordering options for web connections.
    orderBy: WebOrder

    # Number of web scans to retrieve.
    limit: Int

    # Returns the items in the list that come after the specified cursor.
    after: String

    # Returns the first n items from the list.
    first: Int

    # Returns the items in the list that come before the specified cursor.
    before: String

    # Returns the last n items from the list.
    last: Int
  ): WebConnection

  # Summarized DMARC aggregate reports.
  dmarcSummaryByPeriod(
    # The month in which the returned data is relevant to.
    month: PeriodEnums!

    # The year in which the returned data is relevant to.
    year: Year!
  ): DmarcSummary

  # Yearly summarized DMARC aggregate reports.
  yearlyDmarcSummaries: [DmarcSummary]

  # List of labelled tags users of an organization have applied to the claimed domain.
  claimTags: [String]
}

# String that conforms to a domain structure.
scalar DomainScalar

# A field that conforms to a DKIM selector. Must be either a single asterisk or a string where only alphanumeric characters and periods are allowed, string must also start and end with alphanumeric characters
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

  # CSV formatted output of all domains in the organization including their email and web scan statuses.
  toCsv: String

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

  # Does the user want to see new features in progress.
  insideUser: Boolean

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

  # Order affiliation edges by displayName.
  USER_DISPLAYNAME

  # Order affiliation edges by user verification status.
  USER_EMAIL_VALIDATED

  # Order affiliation edges by user insider status.
  USER_INSIDER

  # Order affiliation edges by amount of total affiliations.
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

# A connection to a list of items.
type DNSScanConnection {
  # Information to aid in pagination.
  pageInfo: PageInfo!

  # A list of edges.
  edges: [DNSScanEdge]

  # The total amount of DNS scans related to a given domain.
  totalCount: Int
}

# An edge in a connection.
type DNSScanEdge {
  # The item at the end of the edge
  node: DNSScan

  # A cursor for use in pagination
  cursor: String!
}

# Results of DKIM, DMARC, and SPF scans on the given domain.
type DNSScan implements Node {
  # The ID of an object
  id: ID!

  # The domain the scan was ran on.
  domain: String

  # The time when the scan was initiated.
  timestamp: Date

  # String of the base domain the scan was run on.
  baseDomain: String

  # Whether or not there are DNS records for the domain scanned.
  recordExists: Boolean

  # The chain CNAME/IP addresses for the domain.
  resolveChain: [[String]]

  # The CNAME for the domain (if it exists).
  cnameRecord: String

  # The MX records for the domain (if they exist).
  mxRecords: MXRecord

  # The NS records for the domain.
  nsRecords: NSRecord

  # The DMARC scan results for the domain.
  dmarc: DMARC

  # The SPF scan results for the domain.
  spf: SPF

  # The SKIM scan results for the domain.
  dkim: DKIM
}

# A date string, such as 2007-12-03, compliant with the "full-date" format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
scalar Date

type MXRecord {
  # Hosts listed in the domain's MX record.
  hosts: [MXHost]

  # Additional warning info about the MX record.
  warnings: [String]
}

# Hosts listed in the domain's MX record.
type MXHost {
  # The preference (or priority) of the host.
  preference: Int

  # The hostname of the given host.
  hostname: String

  # The IP addresses for the given host.
  addresses: [String]
}

type NSRecord {
  # Hostnames for the nameservers for the domain.
  hostnames: [String]

  # Additional warning info about the NS record.
  warnings: [String]
}

# Domain-based Message Authentication, Reporting, and Conformance
# (DMARC) is a scalable mechanism by which a mail-originating
# organization can express domain-level policies and preferences for
# message validation, disposition, and reporting, that a mail-receiving
# organization can use to improve mail handling.
type DMARC {
  # The compliance status for DMARC for the scanned domain.
  status: String

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

  # The current phase of the DMARC implementation.
  phase: String

  # List of positive tags for the scanned domain from this scan.
  positiveTags: [GuidanceTag]

  # List of neutral tags for the scanned domain from this scan.
  neutralTags: [GuidanceTag]

  # List of negative tags for the scanned domain from this scan.
  negativeTags: [GuidanceTag]
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

# Email on the Internet can be forged in a number of ways.  In
# particular, existing protocols place no restriction on what a sending
# host can use as the "MAIL FROM" of a message or the domain given on
# the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
# protocol is where Administrative Management Domains (ADMDs) can explicitly
# authorize the hosts that are allowed to use their domain names, and a
# receiving host can check such authorization.
type SPF {
  # The compliance status for SPF for the scanned domain.
  status: String

  # SPF record retrieved during the scan of the given domain.
  record: String

  # The amount of DNS lookups.
  lookups: Int

  # Instruction of what a recipient should do if there is not a match to your SPF record.
  spfDefault: String

  # List of positive tags for the scanned domain from this scan.
  positiveTags: [GuidanceTag]

  # List of neutral tags for the scanned domain from this scan.
  neutralTags: [GuidanceTag]

  # List of negative tags for the scanned domain from this scan.
  negativeTags: [GuidanceTag]
}

# DomainKeys Identified Mail (DKIM) permits a person, role, or
# organization that owns the signing domain to claim some
# responsibility for a message by associating the domain with the
# message.  This can be an author's organization, an operational relay,
# or one of their agents.
type DKIM {
  # The compliance status for DKIM for the scanned domain.
  status: String

  # Individual scans results for each DKIM selector.
  selectors: [DKIMSelectorResult]
}

# DomainKeys Identified Mail (DKIM) permits a person, role, or
# organization that owns the signing domain to claim some
# responsibility for a message by associating the domain with the
# message.  This can be an author's organization, an operational relay,
# or one of their agents.
type DKIMSelectorResult {
  # The selector which was scanned.
  selector: String

  # The compliance status for DKIM for the scanned domain.
  status: String

  # DKIM record retrieved during scan.
  record: String

  # Size of the Public Key in bits.
  keyLength: String

  # Type of DKIM key used.
  keyType: String

  # The public exponent used for DKIM.
  publicExponent: Int

  # The key modulus used.
  keyModulus: String

  # List of positive tags for the scanned domain from this scan.
  positiveTags: [GuidanceTag]

  # List of neutral tags for the scanned domain from this scan.
  neutralTags: [GuidanceTag]

  # List of negative tags for the scanned domain from this scan.
  negativeTags: [GuidanceTag]
}

# Ordering options for DNS connections.
input DNSOrder {
  # The field to order DNS scans by.
  field: DNSOrderField!

  # The ordering direction.
  direction: OrderDirection!
}

# Properties by which DNS connections can be ordered.
enum DNSOrderField {
  # Order DNS edges by timestamp.
  TIMESTAMP
}

# A connection to a list of items.
type WebConnection {
  # Information to aid in pagination.
  pageInfo: PageInfo!

  # A list of edges.
  edges: [WebEdge]

  # The total amount of web scans related to a given domain.
  totalCount: Int
}

# An edge in a connection.
type WebEdge {
  # The item at the end of the edge
  node: Web

  # A cursor for use in pagination
  cursor: String!
}

# Results of TLS and HTTP connection scans on the given domain.
type Web implements Node {
  # The ID of an object
  id: ID!

  # The domain string the scan was ran on.
  domain: String

  # The time when the scan was initiated.
  timestamp: Date

  # Results of the web scan at each IP address.
  results: [WebScan]
}

# Information for the TLS and HTTP connection scans on the given domain.
type WebScan {
  # The time when the scan was initiated.
  timestamp: Date

  # IP address for scan target.
  ipAddress: String

  # The status of the scan for the given domain and IP address.
  status: String

  # Results of TLS and HTTP connection scans on the given domain.
  results: WebScanResult
}

# Results of TLS and HTTP connection scans on the given domain.
type WebScanResult {
  # The time when the scan was initiated.
  timestamp: Date

  # The result for the TLS scan for the scanned server.
  tlsResult: TLSResult

  # The result for the HTTP connection scan for the scanned server.
  connectionResults: WebConnectionResult
}

# Results of TLS scans on the given domain.
type TLSResult {
  # The IP address of the domain scanned.
  ipAddress: String

  # Information regarding the server which was scanned.
  serverLocation: ServerLocation

  # Information for the TLS certificate retrieved from the scanned server.
  certificateChainInfo: CertificateChainInfo

  # Whether or not the scanned server supports ECDH key exchange.
  supportsEcdhKeyExchange: Boolean

  # Whether or not the scanned server is vulnerable to heartbleed.
  heartbleedVulnerable: Boolean

  # Whether or not the scanned server is vulnerable to CCS injection.
  ccsInjectionVulnerable: Boolean

  # An object containing the various TLS protocols and which suites are enabled for each protocol.
  acceptedCipherSuites: AcceptedCipherSuites

  # List of the scanned servers accepted elliptic curves and their strength.
  acceptedEllipticCurves: [EllipticCurve]

  # List of positive tags for the scanned server from this scan.
  positiveTags: [GuidanceTag]

  # List of neutral tags for the scanned server from this scan.
  neutralTags: [GuidanceTag]

  # List of negative tags for the scanned server from this scan.
  negativeTags: [GuidanceTag]

  # The compliance status for TLS for the scanned server from this scan.
  sslStatus: String

  # The compliance status for TLS protocol for the scanned server from this scan.
  protocolStatus: String

  # The compliance status for cipher suites for the scanned server from this scan.
  cipherStatus: String

  # The compliance status for ECDH curves for the scanned server from this scan.
  curveStatus: String
}

type ServerLocation {
  # Hostname which was scanned.
  hostname: String

  # IP address used for scan.
  ipAddress: String
}

#
type CertificateChainInfo {
  # Validation results from each trust store.
  pathValidationResults: [PathValidationResults]

  # True if domain is not listed on the given TLS certificate.
  badHostname: Boolean

  # Whether or not the TLS certificate includes the OCSP Must-Staple extension.
  mustHaveStaple: Boolean

  # Whether or not the leaf (server) certificate is an Extended Validation (EV) certificate.
  leafCertificateIsEv: Boolean

  # Whether or not the certificate bundle includes the anchor (root) certificate.
  receivedChainContainsAnchorCertificate: Boolean

  # Whether or not the certificates in the certificate bundles are in the correct order.
  receivedChainHasValidOrder: Boolean

  # Whether or not any certificates in the certificate bundle were signed using the SHA1 algorithm.
  verifiedChainHasSha1Signature: Boolean

  # Whether or not the certificate chain includes a distrusted Symantec certificate.
  verifiedChainHasLegacySymantecAnchor: Boolean

  # The certificate chain which was used to create the TLS connection.
  certificateChain: [Certificate]
}

# Validation results from each trust store.
type PathValidationResults {
  # Error string which occurred when attempting to validate certificate if error exists, else null.
  opensslErrorString: String

  # Whether or not the certificate was successfully validated.
  wasValidationSuccessful: Boolean

  # Trust store used to validate TLS certificate.
  trustStore: TrustStore
}

# Trust store used to validate TLS certificate.
type TrustStore {
  # Name of trust store used to validate certificate.
  name: String

  # Version of trust store used to validate certificate.
  version: String
}

# Certificate from the scanned server.
type Certificate {
  # The date which the certificate becomes initially becomes valid.
  notValidBefore: String

  # The date which the certificate becomes invalid.
  notValidAfter: String

  # The entity which signed the certificate.
  issuer: String

  # The entity for which the certificate was created for.
  subject: String

  # Whether or not the certificate is expired.
  expiredCert: Boolean

  # Whether or not the certificate is self-signed.
  selfSignedCert: Boolean

  # Whether or not the certificate has been revoked.
  certRevoked: Boolean

  # The status of the certificate revocation check.
  certRevokedStatus: String

  # The list of common names for the given certificate.
  commonNames: [String]

  # The serial number for the given certificate.
  serialNumber: String

  # The hashing algorithm used to validate this certificate.
  signatureHashAlgorithm: String

  # The list of all alternative (domain)names which can use this certificate.
  sanList: [String]
}

# List of accepted cipher suites separated by TLS version.
type AcceptedCipherSuites {
  # Accepted cipher suites for SSL2.
  ssl2_0CipherSuites: [CipherSuite]

  # Accepted cipher suites for SSL3.
  ssl3_0CipherSuites: [CipherSuite]

  # Accepted cipher suites for TLS1.0.
  tls1_0CipherSuites: [CipherSuite]

  # Accepted cipher suites for TLS1.1.
  tls1_1CipherSuites: [CipherSuite]

  # Accepted cipher suites for TLS1.2.
  tls1_2CipherSuites: [CipherSuite]

  # Accepted cipher suites for TLS1.3.
  tls1_3CipherSuites: [CipherSuite]
}

# Cipher suite information.
type CipherSuite {
  # The name of the cipher suite
  name: String

  # The strength of the cipher suite.
  strength: String
}

# Elliptic curve information.
type EllipticCurve {
  # The name of the elliptic curve.
  name: String

  # The strength of the elliptic curve.
  strength: String
}

# Results of HTTP connection scan on the given domain.
type WebConnectionResult {
  # The compliance status for HSTS for the scanned server from this scan.
  hstsStatus: String

  # The compliance status for HTTPS for the scanned server from this scan.
  httpsStatus: String

  # Whether or not the server is serving data over HTTP.
  httpLive: Boolean

  # Whether or not the server is serving data over HTTPS
  httpsLive: Boolean

  # Whether or not HTTP connection was immediately upgraded (redirected) to HTTPS.
  httpImmediatelyUpgrades: Boolean

  # Whether or not HTTP connection was eventually upgraded to HTTPS.
  httpEventuallyUpgrades: Boolean

  # Whether or not HTTPS connection is immediately downgraded to HTTP.
  httpsImmediatelyDowngrades: Boolean

  # Whether or not HTTPS connection is eventually downgraded to HTTP.
  httpsEventuallyDowngrades: Boolean

  # The parsed values for the HSTS header.
  hstsParsed: HSTSParsed

  # The IP address for the scanned server.
  ipAddress: String

  # The chain of connections created when visiting the domain using HTTP.
  httpChainResult: ConnectionChainResult

  # The chain of connections created when visiting the domain using HTTPS.
  httpsChainResult: ConnectionChainResult

  # List of positive tags for the scanned server from this scan.
  positiveTags: [GuidanceTag]

  # List of neutral tags for the scanned server from this scan.
  neutralTags: [GuidanceTag]

  # List of negative tags for the scanned server from this scan.
  negativeTags: [GuidanceTag]
}

# The parsed values of the HSTS header.
type HSTSParsed {
  # How long to trust the HSTS header.
  maxAge: Int

  # Whether or not this HSTS policy should apply to subdomains.
  includeSubdomains: Boolean

  # Whether or not the HSTS header includes the 'preload' option.
  preload: Boolean
}

# Information collected while checking HTTP connections while following redirects.
type ConnectionChainResult {
  # The connection protocol used for the initial connection to the server (HTTP or HTTPS).
  scheme: String

  # The domain the scan was run on.
  domain: String

  # The initial full connection URI.
  uri: String

  # Whether or not a redirection loop is created (causing endless redirects).
  hasRedirectLoop: Boolean

  # The connection chain created when following redirects.
  connections: [Connection]
}

# An HTTP (or HTTPS) connection.
type Connection {
  # The URI for the given connection.
  uri: String

  # Detailed information for a given connection.
  connection: ConnectionInfo

  # Any errors which occurred when attempting to create this connection.
  error: String

  # The connection protocol used for this connection (HTTP or HTTPS).
  scheme: String
}

# Detailed info for a given connection.
type ConnectionInfo {
  # The HTTP response status code.
  statusCode: Int

  # The redirect location from the HTTP response.
  redirectTo: String

  # The response headers from the HTTP response. The keys of the response are the header keys.
  headers: JSONObject

  # The detected category for the domain if blocked by firewall.
  blockedCategory: String

  # Whether or not the response included an HSTS header.
  HSTS: Boolean
}

# The "JSONObject" scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
scalar JSONObject

# Ordering options for web connections.
input WebOrder {
  # The field to order web scans by.
  field: WebOrderField!

  # The ordering direction.
  direction: OrderDirection!
}

# Properties by which web connections can be ordered.
enum WebOrderField {
  # Order web edges by timestamp.
  TIMESTAMP
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
      reason: "This has been turned into the "guidanceTag" field providing detailed information to act upon if a given tag is present."
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
      reason: "This has been turned into the "guidanceTag" field providing detailed information to act upon if a given tag is present."
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

  # List of tags assigned to domains within the organization.
  tags: TagConnection
  domains: WebCheckDomainConnection
}

type TagConnection {
  # List of tags assigned to the domain.
  edges: [VulnerabilityTag]

  # Total number of tags assigned to domain.
  totalCount: Int
}

# This object contains information about a vulnerability affecting the domain.
type VulnerabilityTag {
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

  # Does the user want to see new features in progress.
  insideUser: Boolean

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

# Organization object containing information for a given Organization.
type MyTrackerResult {
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

    # Limits domains to those that user has added to their personal myTracker view.
    myTracker: Boolean

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

  # Mutation to add domain to user's personal myTracker view.
  favouriteDomain(input: FavouriteDomainInput!): FavouriteDomainPayload

  # This mutation allows the removal of unused domains.
  removeDomain(input: RemoveDomainInput!): RemoveDomainPayload

  # This mutation is used to step a manual scan on a requested domain.
  requestScan(input: RequestScanInput!): RequestScanPayload

  # Mutation to remove domain from user's personal myTracker view.
  unfavouriteDomain(input: UnfavouriteDomainInput!): UnfavouriteDomainPayload

  # Mutation allows the modification of domains if domain is updated through out its life-cycle
  updateDomain(input: UpdateDomainInput!): UpdateDomainPayload

  # This mutation allows the creation of an organization inside the database.
  createOrganization(input: CreateOrganizationInput!): CreateOrganizationPayload

  # This mutation allows the removal of unused organizations.
  removeOrganization(input: RemoveOrganizationInput!): RemoveOrganizationPayload

  # Mutation allows the modification of organizations if any changes to the organization may occur.
  updateOrganization(input: UpdateOrganizationInput!): UpdateOrganizationPayload

  # Mutation allows the verification of an organization.
  verifyOrganization(input: VerifyOrganizationInput!): VerifyOrganizationPayload

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
  updateUserPassword(input: UpdateUserPasswordInput!): UpdateUserPasswordPayload

  # This mutation allows the user to update their user profile to change various details of their current profile.
  updateUserProfile(input: UpdateUserProfileInput!): UpdateUserProfilePayload

  # This mutation allows the user to verify their account through a token sent in an email.
  verifyAccount(input: VerifyAccountInput!): VerifyAccountPayload

  # This mutation allows the user to two factor authenticate.
  verifyPhoneNumber(input: verifyPhoneNumberInput!): verifyPhoneNumberPayload
}

type InviteUserToOrgPayload {
  # "InviteUserToOrgUnion" returning either a "InviteUserToOrgResult", or "InviteUserToOrgError" object.
  result: InviteUserToOrgUnion
  clientMutationId: String
}

# This union is used with the "InviteUserToOrg" mutation, allowing for users to invite user to their org, and support any errors that may occur
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
  # "LeaveOrganizationUnion" resolving to either a "LeaveOrganizationResult" or "AffiliationError".
  result: LeaveOrganizationUnion
  clientMutationId: String
}

# This union is used with the "leaveOrganization" mutation, allowing for users to leave a given organization, and support any errors that may occur.
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
  # "RemoveUserFromOrgUnion" returning either a "RemoveUserFromOrgResult", or "RemoveUserFromOrgError" object.
  result: RemoveUserFromOrgUnion
  clientMutationId: String
}

# This union is used with the "RemoveUserFromOrg" mutation, allowing for users to remove a user from their org, and support any errors that may occur
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
  # "TransferOrgOwnershipUnion" resolving to either a "TransferOrgOwnershipResult" or "AffiliationError".
  result: TransferOrgOwnershipUnion
  clientMutationId: String
}

# This union is used with the "transferOrgOwnership" mutation, allowing for
# users to transfer ownership of a given organization, and support any errors that may occur.
union TransferOrgOwnershipUnion = AffiliationError | TransferOrgOwnershipResult

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
  # "UpdateUserRoleUnion" returning either a "UpdateUserRoleResult", or "UpdateUserRoleError" object.
  result: UpdateUserRoleUnion
  clientMutationId: String
}

# This union is used with the "UpdateUserRole" mutation, allowing for users to update a users role in an org, and support any errors that may occur
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
  # "CreateDomainUnion" returning either a "Domain", or "CreateDomainError" object.
  result: CreateDomainUnion
  clientMutationId: String
}

# This union is used with the "CreateDomain" mutation,
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

  # List of labelled tags users have applied to the domain.
  tags: [InputTag]
  clientMutationId: String
}

# User-generated tag assigned to domains for labeling and management.
input InputTag {
  # The English translation of the label.
  en: DomainTagLabel!

  # The French translation of the label.
  fr: DomainTagLabel!
}

# An enum used to assign and test user-generated domain tags
enum DomainTagLabel {
  # English label for tagging domains as new to the system.
  NEW

  # French label for tagging domains as new to the system.
  NOUVEAU

  # Bilingual Label for tagging domains as a production environment.
  PROD

  # English label for tagging domains as a staging environment.
  STAGING

  # French label for tagging domains as a staging environment.
  DEV

  # Bilingual label for tagging domains as a test environment.
  TEST

  # Bilingual label for tagging domains as web-hosting.
  WEB

  # English label for tagging domains that are not active.
  INACTIVE

  # French label for tagging domains that are not active.
  INACTIF
}

type FavouriteDomainPayload {
  # "CreateDomainUnion" returning either a "Domain", or "CreateDomainError" object.
  result: CreateDomainUnion
  clientMutationId: String
}

input FavouriteDomainInput {
  # The global id of the domain you wish to favourite.
  domainId: ID!
  clientMutationId: String
}

type RemoveDomainPayload {
  # "RemoveDomainUnion" returning either a "DomainResultType", or "DomainErrorType" object.
  result: RemoveDomainUnion!
  clientMutationId: String
}

# This union is used with the "RemoveDomain" mutation,
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

  # The reason given for why this domain is being removed from the organization.
  reason: DomainRemovalReasonEnum!
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

type UnfavouriteDomainPayload {
  # "RemoveDomainUnion" returning either a "DomainResultType", or "DomainErrorType" object.
  result: RemoveDomainUnion!
  clientMutationId: String
}

input UnfavouriteDomainInput {
  # The global id of the domain you wish to favourite.
  domainId: ID!
  clientMutationId: String
}

type UpdateDomainPayload {
  # "UpdateDomainUnion" returning either a "Domain", or "DomainError" object.
  result: UpdateDomainUnion
  clientMutationId: String
}

# This union is used with the "UpdateDomain" mutation,
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

  # List of labelled tags users have applied to the domain.
  tags: [InputTag]
  clientMutationId: String
}

type CreateOrganizationPayload {
  # "CreateOrganizationUnion" returning either an "Organization", or "OrganizationError" object.
  result: CreateOrganizationUnion
  clientMutationId: String
}

# This union is used with the "CreateOrganization" mutation,
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
  # "RemoveOrganizationUnion" returning either an "OrganizationResult", or "OrganizationError" object.
  result: RemoveOrganizationUnion!
  clientMutationId: String
}

# This union is used with the "RemoveOrganization" mutation,
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
  # "UpdateOrganizationUnion" returning either an "Organization", or "OrganizationError" object.
  result: UpdateOrganizationUnion!
  clientMutationId: String
}

# This union is used with the "UpdateOrganization" mutation,
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
  # "VerifyOrganizationUnion" returning either an "OrganizationResult", or "OrganizationError" object.
  result: VerifyOrganizationUnion
  clientMutationId: String
}

# This union is used with the "VerifyOrganization" mutation,
# allowing for super admins to verify an organization,
# and support any errors that may occur
union VerifyOrganizationUnion = OrganizationError | OrganizationResult

input VerifyOrganizationInput {
  # The global id of the organization to be verified.
  orgId: ID!
  clientMutationId: String
}

type AuthenticatePayload {
  # Authenticate union returning either a "authResult" or "authenticateError" object.
  result: AuthenticateUnion
  clientMutationId: String
}

# This union is used with the "authenticate" mutation, allowing for the user to authenticate, and support any errors that may occur
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
  # "CloseAccountUnion" returning either a "CloseAccountResult", or "CloseAccountError" object.
  result: CloseAccountUnion
  clientMutationId: String
}

# This union is used for the "closeAccount" mutation, to support successful or errors that may occur.
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
  # Refresh tokens union returning either a "authResult" or "authenticateError" object.
  result: RefreshTokensUnion
  clientMutationId: String
}

# This union is used with the "refreshTokens" mutation, allowing for the user to refresh their tokens, and support any errors that may occur
union RefreshTokensUnion = AuthResult | AuthenticateError

input RefreshTokensInput {
  clientMutationId: String
}

type RemovePhoneNumberPayload {
  # "RemovePhoneNumberUnion" returning either a "RemovePhoneNumberResult", or "RemovePhoneNumberError" object.
  result: RemovePhoneNumberUnion
  clientMutationId: String
}

# This union is used with the "RemovePhoneNumber" mutation, allowing for users to remove their phone number, and support any errors that may occur
union RemovePhoneNumberUnion = RemovePhoneNumberError | RemovePhoneNumberResult

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
  # "ResetPasswordUnion" returning either a "ResetPasswordResult", or "ResetPasswordError" object.
  result: ResetPasswordUnion
  clientMutationId: String
}

# This union is used with the "ResetPassword" mutation, allowing for users to reset their password, and support any errors that may occur
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
  # "SetPhoneNumberUnion" returning either a "SetPhoneNumberResult", or "SetPhoneNumberError" object.
  result: SetPhoneNumberUnion
  clientMutationId: String
}

# This union is used with the "setPhoneNumber" mutation, allowing for users to send a verification code to their phone, and support any errors that may occur
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
  # "SignInUnion" returning either a "regularSignInResult", "tfaSignInResult", or "signInError" object.
  result: SignInUnion
  clientMutationId: String
}

# This union is used with the "SignIn" mutation, allowing for multiple styles of logging in, and support any errors that may occur
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
  # "SignUpUnion" returning either a "AuthResult", or "SignUpError" object.
  result: SignUpUnion
  clientMutationId: String
}

# This union is used with the "signUp" mutation, allowing for the user to sign up, and support any errors that may occur.
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
  # "UpdateUserPasswordUnion" returning either a "UpdateUserPasswordResultType", or "UpdateUserPasswordError" object.
  result: UpdateUserPasswordUnion
  clientMutationId: String
}

# This union is used with the "updateUserPassword" mutation, allowing for users to update their password, and support any errors that may occur
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
  # "UpdateUserProfileUnion" returning either a "UpdateUserProfileResult", or "UpdateUserProfileError" object.
  result: UpdateUserProfileUnion
  clientMutationId: String
}

# This union is used with the "updateUserProfile" mutation, allowing for users to update their profile, and support any errors that may occur
union UpdateUserProfileUnion = UpdateUserProfileError | UpdateUserProfileResult

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

  # The updated boolean which represents if the user wants to see features in progress.
  insideUser: Boolean
  clientMutationId: String
}

type VerifyAccountPayload {
  # "VerifyAccountUnion" returning either a "VerifyAccountResult", or "VerifyAccountError" object.
  result: VerifyAccountUnion
  clientMutationId: String
}

# This union is used with the "verifyAccount" mutation, allowing for users to verify their account, and support any errors that may occur
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
  # "VerifyPhoneNumberUnion" returning either a "VerifyPhoneNumberResult", or "VerifyPhoneNumberError" object.
  result: VerifyPhoneNumberUnion
  clientMutationId: String
}

# This union is used with the "verifyPhoneNumber" mutation, allowing for users to verify their phone number, and support any errors that may occur
union VerifyPhoneNumberUnion = VerifyPhoneNumberError | VerifyPhoneNumberResult

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
`
