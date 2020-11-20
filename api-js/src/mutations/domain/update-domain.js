const { GraphQLID, GraphQLNonNull, GraphQLList } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')
const { Domain, Selectors } = require('../../scalars')
const { domainType } = require('../../types')

const updateDomain = new mutationWithClientMutationId({
  name: 'UpdateDomain',
  description:
    'Mutation allows the modification of domains if domain is updated through out its life-cycle',
  inputFields: () => ({
    domainId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global id of the domain that is being updated.',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description:
        'The global ID of the organization used for permission checks.',
    },
    domain: {
      type: Domain,
      description: 'The new url of the of the old domain.',
    },
    selectors: {
      type: new GraphQLList(Selectors),
      description:
        'The updated DKIM selector strings corresponding to this domain.',
    },
  }),
  outputFields: () => ({
    domain: {
      type: domainType,
      description: 'The updated domain.',
      resolve: async (payload) => {
        return payload.domain
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      query,
      collections,
      transaction,
      userKey,
      auth: { checkPermission, userRequired },
      validators: { cleanseInput },
      loaders: { domainLoaderByKey, orgLoaderByKey },
    },
  ) => {
    const { id: domainId } = fromGlobalId(cleanseInput(args.domainId))
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const updatedDomain = cleanseInput(args.domain)

    let selectors
    if (typeof args.selectors !== 'undefined') {
      selectors = args.selectors.map((selector) => cleanseInput(selector))
    } else {
      selectors = null
    }

    // Get User
    await userRequired()

    // Check to see if domain exists
    const domain = await domainLoaderByKey.load(domainId)

    if (typeof domain === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId}, however there is no domain associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Check to see if org exists
    const org = await orgLoaderByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however there is no org associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Check permission
    const permission = await checkPermission({ orgId: org._id })

    if (
      permission !== 'user' &&
      permission !== 'admin' &&
      permission !== 'super_admin'
    ) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however they do not have permission in that org.`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Check to see if org has a claim to this domain
    let countCursor
    try {
      countCursor = await query`
        FOR v, e IN 1..1 ANY ${domain._id} claims 
          FILTER e._from == ${org._id}
          RETURN e
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    if (countCursor.count < 1) {
      console.warn(
        `User: ${userKey} attempted to update domain: ${domainId} for org: ${orgId}, however that org has no claims to that domain.`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Generate list of collections names
    const collectionStrings = []
    for (const property in collections) {
      collectionStrings.push(property.toString())
    }

    // Setup Transaction
    const trx = await transaction(collectionStrings)

    // Update domain
    const domainToInsert = {
      domain: updatedDomain || domain.domain,
      lastRan: domain.lastRan,
      selectors: selectors || domain.selectors,
    }

    try {
      await trx.run(
        async () =>
          await query`
          UPSERT { _key: ${domain._key} }
            INSERT ${domainToInsert}
            UPDATE ${domainToInsert}
            IN domains
      `,
      )
    } catch (err) {
      console.error(
        `Transaction run error occurred when user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Commit transaction
    try {
      await trx.commit()
    } catch (err) {
      console.error(
        `Transaction commit error occurred when user: ${userKey} attempted to update domain: ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to update domain. Please try again.`))
    }

    // Clear dataloader and load updated domain
    await domainLoaderByKey.clear(domain._key)
    const returnDomain = await domainLoaderByKey.load(domain._key)

    console.info(`User: ${userKey} successfully updated domain: ${domainId}.`)
    returnDomain.id = returnDomain._key

    return {
      domain: {
        ...returnDomain,
      },
    }
  },
})

module.exports = {
  updateDomain,
}
