// Static fixture definitions. Everything here is plain data; index.js turns it into documents.

const FIXTURE_PASSWORD = 'dev-password-1'

const orgDetails = ({ en, fr, acronymEn, acronymFr }) => {
  const location = { zone: 'FED', country: 'Canada', province: 'Ontario', city: 'Ottawa' }
  return {
    en: { slug: en.slug, acronym: acronymEn, name: en.name, sector: en.sector, ...location },
    fr: { slug: fr.slug, acronym: acronymFr, name: fr.name, sector: fr.sector, ...location },
  }
}

// Keyed by a short handle used throughout the fixtures. `sa` is the super admin org.
const ORGANIZATIONS = {
  sa: {
    verified: false,
    externallyManaged: false,
    orgDetails: orgDetails({
      acronymEn: 'SA',
      acronymFr: 'SA',
      en: { slug: 'super-admin', name: 'Super Admin', sector: 'Super Admin' },
      fr: { slug: 'super-admin', name: 'Super Administrateur', sector: 'Super Administrateur' },
    }),
  },
  a: {
    verified: true,
    externallyManaged: false,
    orgDetails: orgDetails({
      acronymEn: 'VOA',
      acronymFr: 'OVA',
      en: { slug: 'verified-org-a', name: 'Verified Org A', sector: 'Development' },
      fr: { slug: 'organisation-verifiee-a', name: 'Organisation vérifiée A', sector: 'Développement' },
    }),
  },
  b: {
    verified: true,
    externallyManaged: false,
    orgDetails: orgDetails({
      acronymEn: 'VOB',
      acronymFr: 'OVB',
      en: { slug: 'verified-org-b', name: 'Verified Org B', sector: 'Development' },
      fr: { slug: 'organisation-verifiee-b', name: 'Organisation vérifiée B', sector: 'Développement' },
    }),
  },
  c: {
    verified: false,
    externallyManaged: false,
    orgDetails: orgDetails({
      acronymEn: 'UOC',
      acronymFr: 'ONVC',
      en: { slug: 'unverified-org-c', name: 'Unverified Org C', sector: 'Development' },
      fr: { slug: 'organisation-non-verifiee-c', name: 'Organisation non vérifiée C', sector: 'Développement' },
    }),
  },
}

const USERS = [
  {
    email: 'owner@example.com',
    displayName: 'Owner User',
    affiliations: [{ org: 'a', permission: 'owner' }],
    demonstrates: 'Owner of Verified Org A; can delete org, sees DMARC summary for owned domain',
  },
  {
    email: 'admin@example.com',
    displayName: 'Admin User',
    affiliations: [{ org: 'a', permission: 'admin' }],
    demonstrates: 'Admin of Verified Org A; manage domains and affiliations',
  },
  {
    email: 'user@example.com',
    displayName: 'Regular User',
    affiliations: [{ org: 'a', permission: 'user' }],
    demonstrates: 'Read-only member of A; implicit user access to verified Org B',
  },
  {
    email: 'pending@example.com',
    displayName: 'Pending User',
    affiliations: [{ org: 'a', permission: 'pending' }],
    demonstrates: 'Pending request to A; no implicit access to verified orgs',
  },
  {
    email: 'unverified-user@example.com',
    displayName: 'Unverified Org User',
    affiliations: [{ org: 'c', permission: 'user' }],
    demonstrates: 'Member of unverified Org C only; no implicit verified-org access',
  },
  {
    email: 'unverified-email@example.com',
    displayName: 'Unverified Email User',
    emailValidated: false,
    affiliations: [{ org: 'a', permission: 'user' }],
    demonstrates: 'Member of A with emailValidated false; blocked by verifiedRequired',
  },
  {
    email: 'orphan@example.com',
    displayName: 'Orphan User',
    affiliations: [],
    demonstrates: 'No affiliations; empty-state screens and join-request flow',
  },
  {
    email: 'multi@example.com',
    displayName: 'Multi Org User',
    affiliations: [
      { org: 'a', permission: 'admin' },
      { org: 'b', permission: 'user' },
    ],
    demonstrates: 'Admin of A and user of B; per-org permission differences',
  },
]

// `scans` lists scan profiles oldest → latest (see scans.js). Omit for unscanned domains.
const DOMAINS = [
  {
    domain: 'all-pass.test',
    claims: [{ org: 'a', assetState: 'approved' }],
    scans: ['mixed', 'pass'],
    ownedBy: 'a',
    hasDmarcSummary: true,
    hasSelector: true,
  },
  { domain: 'all-fail.test', claims: [{ org: 'a', assetState: 'approved' }], scans: ['fail', 'fail'] },
  { domain: 'mixed.test', claims: [{ org: 'b', assetState: 'approved' }], scans: ['fail', 'mixed'] },
  {
    domain: 'shared.test',
    claims: [
      { org: 'a', assetState: 'approved' },
      { org: 'c', assetState: 'approved' },
    ],
    scans: ['pass', 'pass'],
  },
  { domain: 'unscanned.test', claims: [{ org: 'a', assetState: 'approved' }] },
  { domain: 'archived.test', claims: [{ org: 'a', assetState: 'approved' }], archived: true },
  { domain: 'nxdomain.test', claims: [{ org: 'b', assetState: 'approved' }], rcode: 'NXDOMAIN' },
  { domain: 'monitor-only.test', claims: [{ org: 'b', assetState: 'monitor-only' }] },
  { domain: 'candidate.test', claims: [{ org: 'a', assetState: 'candidate' }] },
  { domain: 'dependency.test', claims: [{ org: 'c', assetState: 'dependency' }] },
]

module.exports = { FIXTURE_PASSWORD, ORGANIZATIONS, USERS, DOMAINS }
