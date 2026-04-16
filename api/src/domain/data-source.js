import { t } from '@lingui/macro'

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
