import { t } from '@lingui/macro'

import {
  loadAllOrganizationDomainStatuses,
  loadOrgByKey,
  loadOrgBySlug,
  loadOrgConnectionsByDomainId,
  loadOrgConnectionsByUserId,
  loadOrganizationDomainStatuses,
  loadOrganizationNamesById,
  loadOrganizationSummariesByPeriod,
} from './loaders'

export class OrganizationDataSource {
  constructor({ query, userKey, i18n, language, cleanseInput, loginRequiredBool, transaction, collections }) {
    this._query = query
    this._userKey = userKey
    this._i18n = i18n
    this._transaction = transaction
    this._collections = collections
    this.byKey = loadOrgByKey({ query, language, userKey, i18n })
    this.bySlug = loadOrgBySlug({ query, language, userKey, i18n })
    this.connectionsByDomainId = loadOrgConnectionsByDomainId({ query, language, userKey, cleanseInput, i18n, auth: { loginRequiredBool } })
    this.connectionsByUserId = loadOrgConnectionsByUserId({ query, userKey, cleanseInput, language, i18n, auth: { loginRequiredBool } })
    this.summariesByPeriod = loadOrganizationSummariesByPeriod({ query, userKey, cleanseInput, i18n })
    this.namesById = loadOrganizationNamesById({ query, userKey, i18n })
    this.domainStatuses = loadOrganizationDomainStatuses({ query, userKey, i18n })
    this.allDomainStatuses = loadAllOrganizationDomainStatuses({ query, userKey, i18n, language })
  }

  async create({ organizationDetails, userId, language }) {
    const trx = await this._transaction(this._collections)

    let cursor
    try {
      cursor = await trx.step(
        () => this._query`
          WITH organizations
          INSERT ${organizationDetails} INTO organizations
          RETURN MERGE(
            {
              _id: NEW._id,
              _key: NEW._key,
              _rev: NEW._rev,
              _type: "organization",
              id: NEW._key,
              verified: NEW.verified,
              domainCount: 0,
              summaries: NEW.summaries
            },
            TRANSLATE(${language}, NEW.orgDetails)
          )
        `,
      )
    } catch (err) {
      console.error(`Database error occurred when user: ${this._userKey} was creating new organization: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create organization. Please try again.`))
    }
    const organization = await cursor.next()

    try {
      await trx.step(
        () => this._query`
          WITH affiliations, organizations, users
          INSERT {
            _from: ${organization._id},
            _to: ${userId},
            permission: "owner",
          } INTO affiliations
        `,
      )
    } catch (err) {
      console.error(`Database error occurred when inserting affiliation for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction error occurred when committing new organization for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to create organization. Please try again.`))
    }

    return organization
  }

  async checkNameInUse({ nameEN, nameFR }) {
    let cursor
    try {
      cursor = await this._query`
        WITH organizations
        FOR org IN organizations
          FILTER (org.orgDetails.en.name == ${nameEN}) OR (org.orgDetails.fr.name == ${nameFR})
          RETURN org
      `
    } catch (err) {
      console.error(`Database error occurred during name check for user: ${this._userKey}: ${err}`)
      throw new Error(this._i18n._(t`Unable to update organization. Please try again.`))
    }
    return cursor
  }

  async getRawByKey({ orgKey }) {
    let cursor
    try {
      cursor = await this._query`
        WITH organizations
        FOR org IN organizations
          FILTER org._key == ${orgKey}
          RETURN org
      `
    } catch (err) {
      console.error(`Database error occurred while retrieving org: ${orgKey} for user: ${this._userKey}: ${err}`)
      throw new Error(this._i18n._(t`Unable to load organization. Please try again.`))
    }

    try {
      return await cursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while retrieving org: ${orgKey} for user: ${this._userKey}: ${err}`)
      throw new Error(this._i18n._(t`Unable to load organization. Please try again.`))
    }
  }

  async update({ orgKey, updatedOrgDetails }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH organizations
          UPSERT { _key: ${orgKey} }
            INSERT ${updatedOrgDetails}
            UPDATE ${updatedOrgDetails}
            IN organizations
        `,
      )
    } catch (err) {
      console.error(`Transaction error occurred while upserting org: ${orgKey} for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to load organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction error occurred while committing org: ${orgKey} for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to load organization. Please try again.`))
    }
  }

  async archive({ organization }) {
    const trx = await this._transaction(this._collections)

    let domainInfo
    try {
      const countCursor = await this._query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
            RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e IN 1..1 INBOUND domain._id claims
              RETURN 1
          )
          RETURN { _id: domain._id, _key: domain._key, count }
      `
      domainInfo = await countCursor.all()
    } catch (err) {
      console.error(`Database error occurred for user: ${this._userKey} while gathering domain count for archive of org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to archive organization. Please try again.`))
    }

    for (const domain of domainInfo) {
      if (domain.count === 1) {
        try {
          await trx.step(
            () => this._query`
              WITH domains
              UPDATE { _key: ${domain._key}, archived: true } IN domains
            `,
          )
        } catch (err) {
          console.error(`Transaction error occurred for user: ${this._userKey} while archiving domains for org: ${organization._key}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to archive organization. Please try again.`))
        }
      }
    }

    try {
      await trx.step(
        () => this._query`
          WITH organizations
          UPDATE { _key: ${organization._key}, verified: false } IN organizations
        `,
      )
    } catch (err) {
      console.error(`Transaction error occurred for user: ${this._userKey} while unverifying org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to archive organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred for user: ${this._userKey} while archiving org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to archive organization. Please try again.`))
    }
  }

  async verify({ currentOrg }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH organizations
          UPSERT { _key: ${currentOrg._key} }
            INSERT ${currentOrg}
            UPDATE ${currentOrg}
            IN organizations
        `,
      )
    } catch (err) {
      console.error(`Transaction error occurred while upserting verified org: ${currentOrg._key} for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to verify organization. Please try again.`))
    }

    try {
      await trx.step(
        () => this._query`
          WITH domains, claims
          FOR v, e IN 1..1 OUTBOUND ${currentOrg._id} claims
            FILTER v.archived == true
            UPDATE v WITH { archived: false } IN domains
        `,
      )
    } catch (err) {
      console.error(`Transaction error occurred while unarchiving affiliated domains for org: ${currentOrg._key} for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to verify organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction error occurred while committing verified org: ${currentOrg._key} for user: ${this._userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to verify organization. Please try again.`))
    }
  }

  async remove({ organization }) {
    const trx = await this._transaction(this._collections)

    let dmarcSummaryCheckList
    try {
      const dmarcSummaryCheckCursor = await this._query`
        WITH domains, ownership, dmarcSummaries, organizations
        FOR v, e IN 1..1 OUTBOUND ${organization._id} ownership
          RETURN e
      `
      dmarcSummaryCheckList = await dmarcSummaryCheckCursor.all()
    } catch (err) {
      console.error(`Database error occurred for user: ${this._userKey} while getting dmarc summaries for org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
    }

    for (const ownership of dmarcSummaryCheckList) {
      try {
        await trx.step(
          () => this._query`
            WITH ownership, organizations, domains, dmarcSummaries, domainsToDmarcSummaries
            LET dmarcSummaryEdges = (
              FOR v, e IN 1..1 OUTBOUND ${ownership._to} domainsToDmarcSummaries
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
        console.error(`Transaction error occurred for user: ${this._userKey} while removing dmarc summaries for org: ${organization._key}: ${err}`)
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
      }

      try {
        await trx.step(
          () => this._query`
            WITH ownership, organizations, domains
            REMOVE ${ownership._key} IN ownership
            OPTIONS { waitForSync: true }
          `,
        )
      } catch (err) {
        console.error(`Transaction error occurred for user: ${this._userKey} while removing ownerships for org: ${organization._key}: ${err}`)
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
      }
    }

    let domainInfo
    try {
      const countCursor = await this._query`
        WITH claims, domains, organizations
        LET domainIds = (
          FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
            RETURN e._to
        )
        FOR domain IN domains
          FILTER domain._id IN domainIds
          LET count = LENGTH(
            FOR v, e IN 1..1 INBOUND domain._id claims
              RETURN 1
          )
          RETURN {
            "_id": domain._id,
            "_key": domain._key,
            "domain": domain.domain,
            "count": count
          }
      `
      domainInfo = await countCursor.all()
    } catch (err) {
      console.error(`Database error occurred for user: ${this._userKey} while gathering domain count for removal of org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
    }

    for (const domain of domainInfo) {
      if (domain.count === 1) {
        try {
          await trx.step(async () => {
            await this._query`
              WITH web, webScan
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
          console.error(`Transaction error occurred for user: ${this._userKey} while removing web data for ${domain.domain} in org: ${organization.slug}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
        }

        try {
          await trx.step(async () => {
            await this._query`
              WITH dns
              FOR dnsV, domainsDNSEdge IN 1..1 OUTBOUND ${domain._id} domainsDNS
                REMOVE dnsV IN dns
                REMOVE domainsDNSEdge IN domainsDNS
                OPTIONS { waitForSync: true }
            `
          })
        } catch (err) {
          console.error(`Transaction error occurred for user: ${this._userKey} while removing DNS data for ${domain.domain} in org: ${organization.slug}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
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
          console.error(`Transaction error occurred for user: ${this._userKey} while removing favourites for ${domain.domain} in org: ${organization.slug}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
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
          console.error(`Transaction error occurred for user: ${this._userKey} while removing DKIM selectors for ${domain.domain} in org: ${organization.slug}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
        }

        try {
          await trx.step(
            () => this._query`
              WITH claims, domains, organizations
              LET domainEdges = (
                FOR v, e IN 1..1 OUTBOUND ${organization._id} claims
                  FILTER e._to == ${domain._id}
                  RETURN { edgeKey: e._key, domainId: e._to }
              )
              LET removeDomainEdges = (
                FOR domainEdge in domainEdges
                  REMOVE domainEdge.edgeKey IN claims
                  OPTIONS { waitForSync: true }
              )
              LET removeDomain = (
                FOR domainEdge in domainEdges
                  LET key = PARSE_IDENTIFIER(domainEdge.domainId).key
                  REMOVE key IN domains
                  OPTIONS { waitForSync: true }
              )
              RETURN true
            `,
          )
        } catch (err) {
          console.error(`Transaction error occurred for user: ${this._userKey} while removing domains for org: ${organization._key}: ${err}`)
          await trx.abort()
          throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
        }
      }
    }

    try {
      await trx.step(
        () => this._query`
          WITH affiliations, organizations, users
          LET userEdges = (
            FOR v, e IN 1..1 OUTBOUND ${organization._id} affiliations
              RETURN { edgeKey: e._key, userKey: e._to }
          )
          LET removeUserEdges = (
            FOR userEdge IN userEdges
              REMOVE userEdge.edgeKey IN affiliations
              OPTIONS { waitForSync: true }
          )
          RETURN true
        `,
      )

      await trx.step(
        () => this._query`
          WITH organizations, organizationSummaries
          FOR summary in organizationSummaries
            FILTER summary.organization == ${organization._id}
            REMOVE summary._key IN organizationSummaries
            OPTIONS { waitForSync: true }
        `,
      )

      await trx.step(
        () => this._query`
          WITH organizations
          REMOVE ${organization._key} IN organizations
          OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(`Transaction error occurred for user: ${this._userKey} while removing affiliations and org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred for user: ${this._userKey} while removing org: ${organization._key}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove organization. Please try again.`))
    }
  }
}
