#!/usr/bin/env node
const crypto = require('node:crypto')
const readline = require('node:readline')
const { parseArgs } = require('node:util')
const bcrypt = require('bcryptjs')
const { Database, aql } = require('arangojs')

const { FIXTURE_PASSWORD, ORGANIZATIONS, USERS, DOMAINS } = require('./fixtures')
const { SELECTOR, ipForDomain, buildDnsScan, buildWebScan, domainFieldsFromScan } = require('./scans')
const { buildChartSummary, buildOrganizationSummary } = require('./summaries')
const { ensureSchema } = require('./schema')
const { loadGuidance } = require('./guidance')

const USAGE = 'Usage: node index.js --email <email> [--password <password>] [--reset] [--force]'
// Matches the API's local dev setup (.devcontainer/api/devcontainer.json, api/docker-compose.yaml).
// The API connects as root with DB_PASS, so DB_USER is root and DB_PASS equals ROOT_PASS.
const DEFAULT_ENV = {
  DB_URL: 'http://localhost:8529',
  DB_NAME: 'track_dmarc',
  DB_USER: 'root',
  DB_PASS: 'test',
  ROOT_PASS: 'test',
}
const PRINTED_ENV = ['DB_URL', 'DB_NAME', 'DB_USER']
const SEEDED_COLLECTIONS = [
  'users',
  'organizations',
  'affiliations',
  'domains',
  'claims',
  'ownership',
  'dns',
  'web',
  'webScan',
  'domainsDNS',
  'domainsWeb',
  'webToWebScans',
  'selectors',
  'domainsToSelectors',
  'dmarcSummaries',
  'domainsToDmarcSummaries',
  'chartSummaries',
  'organizationSummaries',
]
const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS
const DMARC_SUMMARY_KEY = '400001'

const fail = (message) => {
  console.error(`dev-seed: ${message}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

const prompt = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer)
    })
    // Suppress echo of typed characters once the question itself has been written.
    if (hidden) rl._writeToOutput = () => {}
  })

const parseOptions = async () => {
  let values
  try {
    ;({ values } = parseArgs({
      options: {
        email: { type: 'string' },
        password: { type: 'string' },
        reset: { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
      },
    }))
  } catch (err) {
    fail(`${err.message}\n${USAGE}`)
  }

  if (!values.email) fail(`--email is required.\n${USAGE}`)
  const flags = { reset: values.reset, force: values.force }
  if (values.password) return { email: values.email.toLowerCase(), password: values.password, ...flags }
  if (!process.stdin.isTTY) fail('--password is required when not running in a terminal.')

  const password = await prompt(`Password for super admin ${values.email}: `, { hidden: true })
  if (!password) fail('Super admin password must not be empty.')
  return { email: values.email.toLowerCase(), password, ...flags }
}

// Explicit env vars win; anything unset falls back to DEFAULT_ENV. Passwords are never printed.
const readEnv = () => {
  const env = Object.fromEntries(Object.entries(DEFAULT_ENV).map(([name, fallback]) => [name, process.env[name] ?? fallback]))
  const defaulted = Object.keys(DEFAULT_ENV).filter((name) => process.env[name] === undefined)

  for (const name of PRINTED_ENV) {
    console.log(`${name}=${env[name]}${defaulted.includes(name) ? ' (default)' : ''}`)
  }
  const defaultedSecrets = defaulted.filter((name) => !PRINTED_ENV.includes(name))
  if (defaultedSecrets.length > 0) console.log(`Using default ${defaultedSecrets.join(', ')}.`)
  return env
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

// Updates the first document matching `filter` (an AQL fragment over `d`), or inserts `doc`.
// Every write is tagged `devSeed: true` so later runs can tell seeded data from real data.
const upsertWhere = async (db, collectionName, filter, fields) => {
  const collection = db.collection(collectionName)
  const doc = { ...fields, devSeed: true }
  const cursor = await db.query(aql`
    LET existing = FIRST(FOR d IN ${collection} FILTER ${filter} LIMIT 1 RETURN d)
    UPSERT { _key: existing._key }
      INSERT ${doc}
      UPDATE ${doc}
      IN ${collection}
    RETURN NEW
  `)
  return cursor.next()
}

const upsertByKey = (db, collectionName, doc) => upsertWhere(db, collectionName, aql`d._key == ${doc._key}`, doc)

const upsertEdge = (db, collectionName, { _from, _to, ...fields }) =>
  upsertWhere(db, collectionName, aql`d._from == ${_from} AND d._to == ${_to}`, { _from, _to, ...fields })

// Sanity check after ensureSchema: every collection we write must now exist.
const assertCollectionsExist = async (db) => {
  const missing = []
  for (const name of SEEDED_COLLECTIONS) {
    if (!(await db.collection(name).exists())) missing.push(name)
  }
  if (missing.length === 0) return
  fail(`Collections still missing after schema ensure: ${missing.join(', ')}. Check database-migration/database.json.`)
}

// Names of seeded collections holding at least one document this script did not write.
const findUnseededCollections = async (db) => {
  const unseeded = []
  for (const name of SEEDED_COLLECTIONS) {
    const cursor = await db.query(aql`FOR d IN ${db.collection(name)} FILTER d.devSeed != true LIMIT 1 RETURN 1`)
    if (await cursor.next()) unseeded.push(name)
  }
  return unseeded
}

// Refuses to touch a database holding data this script didn't write, unless --force is given.
const guardAgainstUnseededData = async (db, { force }) => {
  const unseeded = await findUnseededCollections(db)
  if (unseeded.length === 0) return

  const summary = `Database "${db.name}" contains data not written by this script in: ${unseeded.join(', ')}.`
  if (force) {
    console.warn(`WARNING: ${summary} Continuing because --force was passed.`)
    return
  }
  fail(
    [
      summary,
      'Seeding it anyway may:',
      '  - overwrite real scans that share the fixed seed scan keys,',
      "  - replace today's chart summaries,",
      "  - reset the password and disable 2FA of an existing account with the super admin email,",
      '  - with --reset, truncate these collections entirely (including real data).',
      'Rerun with --force to proceed anyway.',
    ].join('\n'),
  )
}

const resetCollections = async (db) => {
  if (!process.stdin.isTTY) fail('--reset needs an interactive terminal to confirm.')
  const answer = await prompt(`This will TRUNCATE ${SEEDED_COLLECTIONS.join(', ')} in "${db.name}". Type "yes" to continue: `)
  if (answer.trim() !== 'yes') fail('Reset aborted.')
  for (const name of SEEDED_COLLECTIONS) await db.collection(name).truncate()
  console.log(`Truncated ${SEEDED_COLLECTIONS.length} collections.`)
}

// ---------------------------------------------------------------------------
// Document builders
// ---------------------------------------------------------------------------

const md5 = (value) => crypto.createHash('md5').update(value).digest('hex')

const buildUser = ({ email, displayName, password, emailValidated = true }) => ({
  displayName,
  userName: email.toLowerCase(),
  password: bcrypt.hashSync(password, 10),
  phoneValidated: false,
  emailValidated,
  insideUser: false,
  // Mirrors the fields of emailUpdateOptionsType (api/src/user/objects/email-update-options.js).
  emailUpdateOptions: { orgFootprint: true, progressReport: true, detectDecay: true },
  failedLoginAttempts: 0,
  tfaSendMethod: 'none',
})

const INFO_STATUS = {
  certificates: 'info',
  ciphers: 'info',
  curves: 'info',
  dkim: 'info',
  dmarc: 'info',
  hsts: 'info',
  https: 'info',
  protocols: 'info',
  spf: 'info',
  ssl: 'info',
}

const buildBaseDomain = ({ domain, archived = false, rcode }) => ({
  domain: domain.toLowerCase(),
  lastRan: null,
  hash: md5(domain.toLowerCase()),
  status: { ...INFO_STATUS },
  archived,
  ignoreRua: false,
  cvdEnrollment: { status: 'not-enrolled' },
  highAvailability: false,
  selectors: [],
  negativeTags: { dns: [], web: [] },
  ...(rcode ? { rcode } : {}),
})

// Fixed numeric-string keys keep reruns stable and sort correctly in the API's TO_NUMBER(_key) ordering.
const scanKeys = (domainIndex, scanIndex) => {
  const suffix = domainIndex * 10 + scanIndex
  return { dns: String(100000 + suffix), web: String(200000 + suffix), webScan: String(300000 + suffix) }
}

// Scanner timestamp format, as Python's str(datetime.now().astimezone()) produces in UTC:
// "YYYY-MM-DD HH:MM:SS.ffffff+00:00". JS dates only carry milliseconds, so microseconds end in 000.
const toScannerTimestamp = (date) => `${date.toISOString().replace('T', ' ').slice(0, 23)}000+00:00`

const scanTimestamps = (count, now) =>
  Array.from({ length: count }, (_, index) => {
    const ageMs = (count - 1 - index) * 7 * ONE_DAY_MS + ONE_HOUR_MS
    return toScannerTimestamp(new Date(now.getTime() - ageMs))
  })

const buildDmarcRow = (id, overrides) => ({
  id,
  sourceIpAddress: `192.0.2.${100 + id}`,
  envelopeFrom: 'all-pass.test',
  headerFrom: 'all-pass.test',
  spfDomains: 'all-pass.test',
  spfResults: 'pass',
  spfAligned: true,
  dkimDomains: 'all-pass.test',
  dkimSelectors: SELECTOR,
  dkimResults: 'pass',
  dkimAligned: true,
  disposition: 'none',
  totalMessages: 10,
  dnsHost: `mail${id}.all-pass.test`,
  guidance: '',
  ...overrides,
})

const buildDmarcSummary = () => ({
  _key: DMARC_SUMMARY_KEY,
  categoryTotals: { pass: 80, fail: 5, passDkimOnly: 10, passSpfOnly: 5 },
  categoryPercentages: { pass: 80, fail: 5, passDkimOnly: 10, passSpfOnly: 5 },
  totalMessages: 100,
  detailTables: {
    fullPass: [buildDmarcRow(1, { totalMessages: 80 })],
    dkimFailure: [buildDmarcRow(2, { dkimResults: 'fail', dkimAligned: false, totalMessages: 5 })],
    spfFailure: [buildDmarcRow(3, { spfResults: 'fail', spfAligned: false, totalMessages: 10 })],
    dmarcFailure: [
      buildDmarcRow(4, {
        spfResults: 'fail',
        spfAligned: false,
        dkimResults: 'fail',
        dkimAligned: false,
        disposition: 'reject',
        totalMessages: 5,
      }),
    ],
  },
})

// ---------------------------------------------------------------------------
// Seeding steps
// ---------------------------------------------------------------------------

const seedOrganizations = async (db) => {
  const orgsByHandle = {}
  for (const [handle, org] of Object.entries(ORGANIZATIONS)) {
    orgsByHandle[handle] = await upsertWhere(db, 'organizations', aql`d.orgDetails.en.slug == ${org.orgDetails.en.slug}`, org)
  }
  return orgsByHandle
}

const seedUsers = async (db, orgsByHandle, superAdmin) => {
  const saUser = await upsertWhere(
    db,
    'users',
    aql`d.userName == ${superAdmin.email}`,
    buildUser({ email: superAdmin.email, displayName: 'Super Admin', password: superAdmin.password }),
  )
  await upsertEdge(db, 'affiliations', {
    _from: orgsByHandle.sa._id,
    _to: saUser._id,
    permission: 'super_admin',
    defaultSA: true,
  })

  for (const fixture of USERS) {
    const user = await upsertWhere(
      db,
      'users',
      aql`d.userName == ${fixture.email}`,
      buildUser({ ...fixture, password: FIXTURE_PASSWORD }),
    )
    for (const { org, permission } of fixture.affiliations) {
      await upsertEdge(db, 'affiliations', { _from: orgsByHandle[org]._id, _to: user._id, permission })
    }
  }
}

const seedScans = async (db, { domainId, domainName, domainIndex, profiles, now }) => {
  const ip = ipForDomain(domainIndex)
  const timestamps = scanTimestamps(profiles.length, now)
  let latest
  for (const [scanIndex, profile] of profiles.entries()) {
    const keys = scanKeys(domainIndex, scanIndex)
    const timestamp = timestamps[scanIndex]
    const dnsScan = { _key: keys.dns, ...buildDnsScan({ domain: domainName, ip, profile, timestamp }) }
    const webScan = { _key: keys.webScan, ...buildWebScan({ domain: domainName, ip, profile, timestamp }) }

    const dnsDoc = await upsertByKey(db, 'dns', dnsScan)
    const webDoc = await upsertByKey(db, 'web', { _key: keys.web, timestamp, domain: domainName })
    const webScanDoc = await upsertByKey(db, 'webScan', webScan)
    await upsertEdge(db, 'domainsDNS', { _from: domainId, _to: dnsDoc._id, timestamp })
    await upsertEdge(db, 'domainsWeb', { _from: domainId, _to: webDoc._id, timestamp })
    await upsertEdge(db, 'webToWebScans', { _from: webDoc._id, _to: webScanDoc._id })

    latest = { dnsScan, webScan, dnsId: dnsDoc._id, webId: webDoc._id }
  }
  return {
    latestDnsScan: latest.dnsId,
    latestWebScan: latest.webId,
    ...domainFieldsFromScan({ dnsScan: latest.dnsScan, webScan: latest.webScan }),
  }
}

const seedDomainExtras = async (db, { fixture, domainDoc, orgsByHandle, now }) => {
  if (fixture.ownedBy) {
    await upsertEdge(db, 'ownership', { _from: orgsByHandle[fixture.ownedBy]._id, _to: domainDoc._id })
  }
  if (fixture.hasSelector) {
    const selector = await upsertWhere(db, 'selectors', aql`d.selector == ${SELECTOR}`, { selector: SELECTOR })
    await upsertEdge(db, 'domainsToSelectors', {
      _from: domainDoc._id,
      _to: selector._id,
      firstSeen: new Date(now.getTime() - 30 * ONE_DAY_MS).toISOString(),
      lastSeen: now.toISOString(),
    })
  }
  if (fixture.hasDmarcSummary) {
    const summary = await upsertByKey(db, 'dmarcSummaries', buildDmarcSummary())
    const edge = { _from: domainDoc._id, _to: summary._id, startDate: 'thirtyDays' }
    await upsertWhere(db, 'domainsToDmarcSummaries', aql`d._from == ${edge._from} AND d.startDate == ${edge.startDate}`, edge)
  }
}

// Returns one entry per domain for the summary step.
const seedDomains = async (db, { orgsByHandle, now }) => {
  const entries = []
  for (const [domainIndex, fixture] of DOMAINS.entries()) {
    const baseDomain = buildBaseDomain(fixture)
    let domainDoc = await upsertWhere(db, 'domains', aql`d.domain == ${baseDomain.domain}`, baseDomain)

    if (fixture.scans) {
      const scanFields = await seedScans(db, {
        domainId: domainDoc._id,
        domainName: domainDoc.domain,
        domainIndex,
        profiles: fixture.scans,
        now,
      })
      domainDoc = await upsertByKey(db, 'domains', { _key: domainDoc._key, ...scanFields })
    }

    for (const { org, assetState } of fixture.claims) {
      await upsertEdge(db, 'claims', {
        _from: orgsByHandle[org]._id,
        _to: domainDoc._id,
        tags: [],
        assetState,
        firstSeen: now.toISOString(),
      })
    }

    await seedDomainExtras(db, { fixture, domainDoc, orgsByHandle, now })

    entries.push({
      domain: domainDoc,
      negativeTags: [...domainDoc.negativeTags.dns, ...domainDoc.negativeTags.web],
      claims: fixture.claims.map(({ org, assetState }) => ({
        orgHandle: org,
        orgVerified: ORGANIZATIONS[org].verified,
        assetState,
      })),
    })
  }
  return entries
}

const seedSummaries = async (db, { orgsByHandle, entries, now }) => {
  const date = now.toISOString().slice(0, 10)
  for (const scope of ['all', 'verified']) {
    const summary = buildChartSummary({ date, scope, entries })
    await upsertWhere(db, 'chartSummaries', aql`d.date == ${date} AND d.scope == ${scope}`, summary)
  }

  const orgHandles = Object.keys(ORGANIZATIONS).filter((handle) => handle !== 'sa')
  for (const handle of orgHandles) {
    const organizationId = orgsByHandle[handle]._id
    const summary = buildOrganizationSummary({ organizationId, orgHandle: handle, date, entries })
    const saved = await upsertWhere(
      db,
      'organizationSummaries',
      aql`d.organization == ${organizationId} AND d.date == ${date}`,
      summary,
    )
    await upsertByKey(db, 'organizations', { _key: orgsByHandle[handle]._key, latestSummaryId: saved._id })
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const orgLabel = (handle) => ORGANIZATIONS[handle].orgDetails.en.acronym

const printLogins = (superAdmin) => {
  const rows = [
    {
      email: superAdmin.email,
      password: '(as provided)',
      role: 'super_admin @ SA',
      demonstrates: 'Super admin; sees every org and domain, admin-only fields',
    },
    ...USERS.map((user) => ({
      email: user.email,
      password: FIXTURE_PASSWORD,
      role: user.affiliations.map(({ org, permission }) => `${permission} @ ${orgLabel(org)}`).join(', ') || '(none)',
      demonstrates: user.demonstrates,
    })),
  ]
  console.log('\nLogins')
  console.table(rows)
}

const printDomainMatrix = (entries) => {
  const rows = entries.map(({ domain }, index) => {
    const fixture = DOMAINS[index]
    const notes = [
      fixture.archived && 'archived',
      fixture.rcode,
      fixture.ownedBy && `owned by ${orgLabel(fixture.ownedBy)}`,
      fixture.hasDmarcSummary && 'DMARC summary',
      fixture.hasSelector && `selector ${SELECTOR}`,
    ].filter(Boolean)
    return {
      domain: domain.domain,
      claims: fixture.claims.map(({ org, assetState }) => `${orgLabel(org)}:${assetState}`).join(', '),
      scans: fixture.scans ? fixture.scans.join(' → ') : '(none)',
      dmarc: domain.status.dmarc,
      spf: domain.status.spf,
      dkim: domain.status.dkim,
      https: domain.status.https,
      hsts: domain.status.hsts,
      ssl: domain.status.ssl,
      notes: notes.join(', '),
    }
  })
  console.log('\nDomains')
  console.table(rows)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const env = readEnv()
  const superAdmin = await parseOptions()

  const db = new Database({
    url: env.DB_URL,
    databaseName: env.DB_NAME,
    auth: { username: env.DB_USER, password: env.DB_PASS },
  })
  await ensureSchema(env)
  await assertCollectionsExist(db)
  await guardAgainstUnseededData(db, superAdmin)
  await loadGuidance(db)
  if (superAdmin.reset) await resetCollections(db)

  const now = new Date()
  const orgsByHandle = await seedOrganizations(db)
  await seedUsers(db, orgsByHandle, superAdmin)
  const entries = await seedDomains(db, { orgsByHandle, now })
  await seedSummaries(db, { orgsByHandle, entries, now })

  console.log(`Seeded database "${env.DB_NAME}".`)
  printLogins(superAdmin)
  printDomainMatrix(entries)
}

main().catch((err) => fail(err.stack || err.message))
