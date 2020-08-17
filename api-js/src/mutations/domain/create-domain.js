const { GraphQLNonNull, GraphQLList, GraphQLID } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')
const { Domain, Selectors } = require('../../scalars')
const { domainType } = require('../../types')

const createDomain = new mutationWithClientMutationId({
  name: 'CreateDomain',
  description: 'Mutation used to create a new domain for an organization.',
  inputFields: () => ({
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description:
        'The global id of the organization you wish to assign this domain to.',
    },
    domain: {
      type: GraphQLNonNull(Domain),
      description: 'Url that you would like to be added to the database.',
    },
    selectors: {
      type: new GraphQLList(Selectors),
      description: 'DKIM selector strings corresponding to this domain.',
    },
  }),
  outputFields: () => ({
    domain: {
      type: domainType,
      description: 'The newly created domain.',
      resolve: async (payload) => {
        return payload.domain
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      request,
      query,
      collections,
      transaction,
      userId,
      auth: { checkPermission, userRequired },
      loaders: { domainLoaderBySlug, orgLoaderById, userLoaderById },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Cleanse input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const domain = cleanseInput(args.domain)
    
    let selectors
    if (typeof args.selectors !== 'undefined') {
      selectors = args.selectors.map((selector) => cleanseInput(selector))
    } else {
      selectors = []
    }

    // Get User
    const user = await userRequired(userId, userLoaderById)

    // Check to see if org exists
    const org = await orgLoaderById.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userId} attempted to create a domain to an organization: ${orgId} that does not exist.`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    // Check to see if user belongs to org
    const permission = await checkPermission(user._id, org._id, query)

    if (
      permission !== 'user' &&
      permission !== 'admin' &&
      permission !== 'super_admin'
    ) {
      console.warn(
        `User: ${userId} attempted to create a domain in: ${org.slug}, however they do not have permission to do so.`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    const insertDomain = {
      domain: domain,
      slug: slugify(domain),
      lastRan: null,
      selectors: selectors,
    }

    // Check to see if domain already belongs to same org
    let checkDomainCursor
    try {
      checkDomainCursor = await query`
        LET domainIds = (FOR domain IN domains FILTER domain.slug == ${insertDomain.slug} RETURN { id: domain._id })
        FOR domainId IN domainIds 
          LET domainEdges = (FOR v, e IN 1..1 ANY domainId.id claims RETURN { _from: e._from })
            FOR domainEdge IN domainEdges
              LET org = DOCUMENT(domainEdge._from)
              FILTER org._key == ${org._key}
              RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE(${request.language}, org.orgDetails))
      `
    } catch (err) {
      console.error(
        `Database error occurred while running check to see if domain already exists in an org: ${err}`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    const checkOrgDomain = await checkDomainCursor.next()

    if (typeof checkOrgDomain !== 'undefined') {
      console.warn(
        `User: ${userId} attempted to create a domain for: ${org.slug}, however that org already has that domain claimed.`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    // Check to see if domain already exists in db
    const checkDomain = await domainLoaderBySlug.load(insertDomain.slug)

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    const trx = await transaction(collectionStrings)
        
    if (typeof checkDomain === 'undefined') {
      const insertedDomain = await trx.run(() =>
        collections.domains.save(insertDomain),
      )
      await trx.run(() =>
        collections.claims.save({ _from: org._id, _to: insertedDomain._id }),
      )
    } else {
      let selectorList
      if (typeof selectors !== 'undefined') {
        selectorList = checkDomain.selectors
        selectors.forEach((selector) => {
          if (!checkDomain.selectors.includes(selector)) {
            selectorList.push(selector)
          }
        })
      }
      insertDomain.selectors = selectorList

      await trx.run(async () => await query`
        UPSERT { _key: ${checkDomain._key} }
          INSERT ${insertDomain}
          UPDATE ${insertDomain}
          IN domains
      `)
      await trx.run(() =>
        collections.claims.save({ _from: org._id, _to: checkDomain._id }),
      )
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Database error occurred while committing create domain transaction: ${err}`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    // Clear dataloader incase anything was updated or inserted into domain
    await domainLoaderBySlug.clear(insertDomain.slug)
    const returnDomain = await domainLoaderBySlug.load(insertDomain.slug)

    console.info(
      `User: ${userId} successfully created ${returnDomain.slug} in org: ${org.slug}.`,
    )

    returnDomain.id = returnDomain._key
    return {
      domain: {
        ...returnDomain,
      },
    }
  },
})

module.exports = {
  createDomain,
}
