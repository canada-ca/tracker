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
      loaders: { domainLoaderById, orgLoaderById, userLoaderById },
      validators: { cleanseInput, slugify },
    },
  ) => {
    // Cleanse input
    const { type: _orgType, id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const domain = cleanseInput(args.domain)
    const selectors = args.selectors.map((selector) => cleanseInput(selector))

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

    const checkDomain = await checkDomainCursor.next()

    if (typeof checkDomain !== 'undefined') {
      console.warn(
        `User: ${userId} attempted to create a domain for: ${org.slug}, however that org already has that domain claimed.`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    // Insert into DB
    const trx = await transaction(collections)
    const insertedDomain = await trx.run(() =>
      collections.domains.save(insertDomain),
    )
    await trx.run(() =>
      collections.claims.save({ _from: org._id, _to: insertedDomain._id }),
    )
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Database error occurred while committing create domain transaction: ${err}`,
      )
      throw new Error('Unable to create domain. Please try again.')
    }

    const returnDomain = await domainLoaderById.load(insertedDomain._key)
    console.info(
      `User: ${userId} successfully created ${returnDomain.slug} in org: ${org.slug}.`,
    )

    returnDomain.id = insertedDomain._key
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
