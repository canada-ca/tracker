import { t } from '@lingui/macro'
import { aql } from 'arangojs'

import {
  loadDomainByDomain,
  loadDomainByKey,
  loadDomainConnectionsByOrgId,
  loadDomainConnectionsByUserId,
  loadDkimSelectorsByDomainId,
} from './loaders'

export class DomainDataSource {
  constructor({ query, userKey, i18n, language, cleanseInput, loginRequiredBool, transaction, collections }) {
    this._query = query
    this._userKey = userKey
    this._i18n = i18n
    this._transaction = transaction
    this._collections = collections
    this.byDomain = loadDomainByDomain({ query, userKey, i18n })
    this.byKey = loadDomainByKey({ query, userKey, i18n })
    this.connectionsByOrgId = loadDomainConnectionsByOrgId({
      query,
      userKey,
      language,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
    })
    this.connectionsByUserId = loadDomainConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
    })
    this.dkimSelectorsByDomainId = loadDkimSelectorsByDomainId({ query, userKey, i18n })
  }

  async create({ insertDomain, org, tags, assetState }) {
    const trx = await this._transaction(this._collections)

    let domainCursor
    try {
      domainCursor = await trx.step(
        () => this._query`
          UPSERT { domain: ${insertDomain.domain} }
            INSERT ${insertDomain}
            UPDATE { }
            IN domains
            RETURN NEW
        `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${this._userKey} when inserting new domain: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    let insertedDomain
    try {
      insertedDomain = await domainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred for user: ${this._userKey} when inserting new domain: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    try {
      await trx.step(
        () => this._query`
          WITH claims
          INSERT {
            _from: ${org._id},
            _to: ${insertedDomain._id},
            tags: ${tags},
            assetState: ${assetState},
            firstSeen: ${new Date().toISOString()},
          } INTO claims
        `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${this._userKey} when inserting new domain edge: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${this._userKey} was creating domain: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    this.byDomain.clear(insertDomain.domain)
    return this.byDomain.load(insertDomain.domain)
  }

  async favourite({ domain, user }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH favourites
          INSERT {
            _from: ${user._id},
            _to: ${domain._id},
          } INTO favourites
        `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${this._userKey} when inserting new domain edge: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to favourite domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${this._userKey} was creating domain: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to favourite domain. Please try again.`))
    }
  }

  async isFavouritedByUser({ domainId, userId }) {
    let checkDomainCursor
    try {
      checkDomainCursor = await this._query`
        WITH domains
        FOR v, e IN 1..1 ANY ${domainId} favourites
          FILTER e._from == ${userId}
          RETURN e
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already favourited: ${err}`)
      throw new Error(this._i18n._(t`Unable to favourite domain. Please try again.`))
    }

    let checkUserDomain
    try {
      checkUserDomain = await checkDomainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already favourited: ${err}`)
      throw new Error(this._i18n._(t`Unable to favourite domain. Please try again.`))
    }

    return typeof checkUserDomain !== 'undefined'
  }

  async organizationsClaimingDomain({ domainId, domainName }) {
    let countCursor
    try {
      countCursor = await this._query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${domainId} claims
          RETURN v
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${this._userKey}, when counting domain claims for domain: ${domainName || domainId}, error: ${err}`,
      )
      throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
    }

    return {
      organizations: await countCursor.all(),
      count: countCursor.count,
    }
  }

  async hasOwnershipClaim({ orgId, domainId, domainName }) {
    let dmarcCountCursor
    try {
      dmarcCountCursor = await this._query`
        WITH domains, organizations, ownership
          FOR v IN 1..1 OUTBOUND ${orgId} ownership
            FILTER v._id == ${domainId}
            RETURN true
      `
    } catch (err) {
      console.error(
        `Database error occurred for user: ${this._userKey}, when counting ownership claims for domain: ${domainName}, error: ${err}`,
      )
      throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
    }

    return dmarcCountCursor.count === 1
  }

  async organizationAlreadyClaimsDomainName({ orgId, domainName }) {
    let checkDomainCursor
    try {
      checkDomainCursor = await this._query`
        WITH claims, domains, organizations
        LET domainIds = (FOR domain IN domains FILTER domain.domain == ${domainName} RETURN { id: domain._id })
        FOR domainId IN domainIds
          LET domainEdges = (FOR v, e IN 1..1 ANY domainId.id claims RETURN { _from: e._from })
            FOR domainEdge IN domainEdges
              LET org = DOCUMENT(domainEdge._from)
              FILTER org._id == ${orgId}
              RETURN true
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    let checkOrgDomain
    try {
      checkOrgDomain = await checkDomainCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(this._i18n._(t`Unable to create domain. Please try again.`))
    }

    return typeof checkOrgDomain !== 'undefined'
  }

  async organizationHasClaim({ orgId, domainId, domainKey }) {
    let countCursor
    try {
      countCursor = await this._query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${domainId} claims
          FILTER e._from == ${orgId}
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${this._userKey} attempted to update domain: ${domainKey}, error: ${err}`,
      )
      throw new Error(this._i18n._(t`Unable to update domain. Please try again.`))
    }

    return countCursor.count > 0
  }

  async loadClaimByOrgAndDomain({ orgId, domainId }) {
    let claimCursor
    try {
      claimCursor = await this._query`
        WITH claims
        FOR claim IN claims
          FILTER claim._from == ${orgId} && claim._to == ${domainId}
          RETURN MERGE({ id: claim._key, _type: "claim" }, claim)
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${this._userKey} running loadDomainByKey: ${err}`)
      return undefined
    }

    if (typeof claimCursor?.next !== 'function') {
      return undefined
    }

    try {
      return await claimCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred when user: ${this._userKey} running loadDomainByKey: ${err}`)
      return undefined
    }
  }

  async loadClaimForOrgByDomainKey({ orgId, domainKey }) {
    let checkClaimCursor
    try {
      checkClaimCursor = await this._query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${orgId} claims
          FILTER v._key == ${domainKey}
          RETURN { claim: e, domain: v.domain }
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
      return undefined
    }

    try {
      return await checkClaimCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
      return undefined
    }
  }

  async loadClaimsForOrgByFilters({ orgId, filters, search }) {
    let domainFilters = aql``
    if (typeof filters !== 'undefined') {
      filters.forEach(({ filterCategory, comparison, filterValue }) => {
        if (comparison === '==') {
          comparison = aql`==`
        } else {
          comparison = aql`!=`
        }
        if (filterCategory === 'dmarc-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.dmarc ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'dkim-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.dkim ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'https-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.https ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'spf-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.spf ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'ciphers-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.ciphers ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'curves-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.curves ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'hsts-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.hsts ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'policy-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.policy ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'protocols-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.protocols ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'certificates-status') {
          domainFilters = aql`
              ${domainFilters}
              FILTER v.status.certificates ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'tags') {
          if (filterValue === 'archived') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.archived ${comparison} true
              `
          } else if (filterValue === 'nxdomain') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.rcode ${comparison} "NXDOMAIN"
              `
          } else if (filterValue === 'blocked') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.blocked ${comparison} true
              `
          } else if (filterValue === 'wildcard-sibling') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.wildcardSibling ${comparison} true
              `
          } else if (filterValue === 'wildcard-entry') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.wildcardEntry ${comparison} true
              `
          } else if (filterValue === 'scan-pending') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.webScanPending ${comparison} true
              `
          } else if (filterValue === 'has-entrust-certificate') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.hasEntrustCertificate ${comparison} true
              `
          } else if (filterValue === 'cve-detected') {
            domainFilters = aql`
                ${domainFilters}
                FILTER v.cveDetected ${comparison} true
              `
          } else {
            domainFilters = aql`
                ${domainFilters}
                FILTER POSITION( e.tags, ${filterValue}) ${comparison} true
              `
          }
        } else if (filterCategory === 'asset-state') {
          domainFilters = aql`
              ${domainFilters}
              FILTER e.assetState ${comparison} ${filterValue}
            `
        } else if (filterCategory === 'guidance-tag') {
          domainFilters = aql`
              ${domainFilters}
              FILTER POSITION(negativeTags, ${filterValue}) ${comparison} true
            `
        }
      })
    }

    let searchString = aql``
    if (typeof search !== 'undefined' && search !== '') {
      searchString = aql`FILTER LOWER(v.domain) LIKE LOWER(${search})`
    }

    let checkClaimsCursor
    try {
      checkClaimsCursor = await this._query`
        WITH claims, domains, organizations
        FOR v, e IN 1..1 ANY ${orgId} claims
          ${domainFilters}
          ${searchString}
          RETURN { claim: e, domain: v.domain }
      `
    } catch (err) {
      console.error(`Database error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(this._i18n._(t`Unable to update domains. Please try again.`))
    }

    let checkClaims
    try {
      checkClaims = await checkClaimsCursor.all()
    } catch (err) {
      console.error(`Cursor error occurred while running check to see if domain already exists in an org: ${err}`)
      throw new Error(this._i18n._(t`Unable to update domains. Please try again.`))
    }

    if (typeof checkClaims === 'undefined') {
      throw new Error(this._i18n._(t`Unable to update domains. Please try again.`))
    }

    return checkClaims
  }

  async unfavourite({ domain, user }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH favourites, domains, users
          LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} favourites RETURN { _key: e._key, _from: e._from, _to: e._to })
          LET edgeKeys = (
            FOR domainEdge IN domainEdges
              FILTER domainEdge._to == ${domain._id}
              FILTER domainEdge._from == ${user._id}
              RETURN domainEdge._key
          )
          FOR edgeKey IN edgeKeys
            REMOVE edgeKey IN favourites
            OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred for user: ${this._userKey} when removing domain edge: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to unfavourite domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${this._userKey} was unfavouriting domain: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to unfavourite domain. Please try again.`))
    }
  }

  async update({ domain, org, domainToInsert, claimToInsert }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        async () =>
          await this._query`
            WITH domains
            UPSERT { _key: ${domain._key} }
              INSERT ${domainToInsert}
              UPDATE ${domainToInsert}
              IN domains
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${this._userKey} attempted to update domain: ${domain._key}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update domain. Please try again.`))
    }

    try {
      await trx.step(
        async () =>
          await this._query`
            WITH claims
            UPSERT { _from: ${org._id}, _to: ${domain._id} }
              INSERT ${claimToInsert}
              UPDATE ${claimToInsert}
              IN claims
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${this._userKey} attempted to update domain edge, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update domain edge. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${this._userKey} attempted to update domain: ${domain._key}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update domain. Please try again.`))
    }

    this.byKey.clear(domain._key)
    return this.byKey.load(domain._key)
  }

  async updateClaim({ claim, claimToInsert }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        async () =>
          await this._query`
            WITH claims
            UPSERT { _key: ${claim._key} }
              INSERT ${claimToInsert}
              UPDATE ${claimToInsert}
              IN claims
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: ${this._userKey} attempted to update domain edge, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update domain. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${this._userKey} was updating domain claim: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update domain. Please try again.`))
    }
  }

  async remove({ domain, org, orgsClaimingDomain, hasOwnership }) {
    const trx = await this._transaction(this._collections)

    if (hasOwnership) {
      try {
        await trx.step(
          () => this._query`
            WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
            LET dmarcSummaryEdges = (
              FOR v, e IN 1..1 OUTBOUND ${domain._id} domainsToDmarcSummaries
                RETURN { edgeKey: e._key, dmarcSummaryId: e._to }
            )
            LET removeDmarcSummaryEdges = (
              FOR dmarcSummaryEdge IN dmarcSummaryEdges
                REMOVE dmarcSummaryEdge.edgeKey IN domainsToDmarcSummaries
                OPTIONS { waitForSync: true }
            )
            LET removeDmarcSummary = (
              FOR dmarcSummaryEdge IN dmarcSummaryEdges
                LET key = PARSE_IDENTIFIER(dmarcSummaryEdge.dmarcSummaryId).key
                REMOVE key IN dmarcSummaries
                OPTIONS { waitForSync: true }
            )
            RETURN true
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when removing dmarc summary data for user: ${this._userKey} while attempting to remove domain: ${domain.domain}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(
          () => this._query`
            WITH ownership, organizations, domains
            LET domainEdges = (
              FOR v, e IN 1..1 INBOUND ${domain._id} ownership
                REMOVE e._key IN ownership
                OPTIONS { waitForSync: true }
            )
            RETURN true
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when removing ownership data for user: ${this._userKey} while attempting to remove domain: ${domain.domain}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    if (orgsClaimingDomain <= 1) {
      try {
        await trx.step(async () => {
          await this._query`
            WITH web, webScan, domains
            FOR webV, domainsWebEdge IN 1..1 OUTBOUND ${domain._id} domainsWeb
              LET removeWebScansQuery = (
                FOR webScanV, webToWebScansV In 1..1 OUTBOUND webV._id webToWebScans
                  REMOVE webScanV IN webScan
                  REMOVE webToWebScansV IN webToWebScans
                  OPTIONS { waitForSync: true }
              )
              REMOVE webV IN web
              REMOVE domainsWebEdge IN domainsWeb
              OPTIONS { waitForSync: true }
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove web data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(async () => {
          await this._query`
            WITH dns, domains
            FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domain._id} domainsDNS
              REMOVE dnsV IN dns
              REMOVE domainsDNSEdge IN domainsDNS
              OPTIONS { waitForSync: true }
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove DNS data for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(async () => {
          await this._query`
            WITH favourites, domains
            FOR fav IN favourites
              FILTER fav._to == ${domain._id}
              REMOVE fav IN favourites
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove favourites for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(async () => {
          await this._query`
            FOR e IN domainsToSelectors
              FILTER e._from == ${domain._id}
              REMOVE e IN domainsToSelectors
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove DKIM selectors for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }

      try {
        await trx.step(async () => {
          await this._query`
            FOR claim IN claims
              FILTER claim._to == ${domain._id}
              REMOVE claim IN claims
            REMOVE ${domain} IN domains
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove domain ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }
    } else {
      try {
        await trx.step(async () => {
          await this._query`
            WITH claims, domains, organizations
            LET domainEdges = (FOR v, e IN 1..1 INBOUND ${domain._id} claims RETURN { _key: e._key, _from: e._from, _to: e._to })
            LET edgeKeys = (
              FOR domainEdge IN domainEdges
                FILTER domainEdge._to == ${domain._id}
                FILTER domainEdge._from == ${org._id}
                RETURN domainEdge._key
            )
            FOR edgeKey IN edgeKeys
              REMOVE edgeKey IN claims
              OPTIONS { waitForSync: true }
          `
        })
      } catch (err) {
        console.error(
          `Trx step error occurred while user: ${this._userKey} attempted to remove claim for ${domain.domain} in org: ${org.slug}, error: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Trx commit error occurred while user: ${this._userKey} attempted to remove ${domain.domain} in org: ${org.slug}, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove domain. Please try again.`))
    }
  }

  async ignoreCve({ domain, ignoredCve, newIgnoredCves }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        async () =>
          await this._query`
            UPSERT { _key: ${domain._key} }
              INSERT ${{ ignoredCves: newIgnoredCves }}
              UPDATE ${{ ignoredCves: newIgnoredCves }}
              IN domains
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to ignore CVE "${ignoredCve}" on domain "${domain._key}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to ignore CVE. Please try again.`))
    }

    let currentDomainVulnerabilitiesCursor
    try {
      currentDomainVulnerabilitiesCursor = await trx.step(
        () => this._query`
          FOR finding IN additionalFindings
            FILTER finding.domain == ${domain._id}
            LIMIT 1
            FOR wc IN finding.webComponents
              FILTER LENGTH(wc.WebComponentCves) > 0
              FOR vuln IN wc.WebComponentCves
                FILTER vuln.Cve NOT IN ${newIgnoredCves}
                RETURN DISTINCT vuln.Cve
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to ignore CVE "${ignoredCve}" on domain "${domain._key}" when getting current CVEs, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to ignore CVE. Please try again.`))
    }

    try {
      await trx.step(
        () => this._query`
          UPDATE { _key: ${domain._key}, cveDetected: ${currentDomainVulnerabilitiesCursor.count > 0} } IN domains
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to ignore CVE "${ignoredCve}" on domain "${domain._key}" when updating domain, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to ignore CVE. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: "${this._userKey}" attempted to ignore CVE "${ignoredCve}" on domain "${domain._key}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to ignore CVE. Please try again.`))
    }

    this.byKey.clear(domain._key)
    return this.byKey.load(domain._key)
  }

  async unignoreCve({ domain, ignoredCve, newIgnoredCves }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        async () =>
          await this._query`
            UPSERT { _key: ${domain._key} }
              INSERT ${{ ignoredCves: newIgnoredCves }}
              UPDATE ${{ ignoredCves: newIgnoredCves }}
              IN domains
          `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domain._key}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    let currentDomainVulnerabilitiesCursor
    try {
      currentDomainVulnerabilitiesCursor = await trx.step(
        () => this._query`
          FOR finding IN additionalFindings
            FILTER finding.domain == ${domain._id}
            LIMIT 1
            FOR wc IN finding.webComponents
              FILTER LENGTH(wc.WebComponentCves) > 0
              FOR vuln IN wc.WebComponentCves
                FILTER vuln.Cve NOT IN ${newIgnoredCves}
                RETURN DISTINCT vuln.Cve
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domain._key}" when getting current CVEs, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    try {
      await trx.step(
        () => this._query`
          UPDATE { _key: ${domain._key}, cveDetected: ${currentDomainVulnerabilitiesCursor.count > 0} } IN domains
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred when user: "${this._userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domain._key}" when updating domain, error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: "${this._userKey}" attempted to unignore CVE "${ignoredCve}" on domain "${domain._key}", error: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to stop ignoring CVE. Please try again.`))
    }

    this.byKey.clear(domain._key)
    return this.byKey.load(domain._key)
  }
}
