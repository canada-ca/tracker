const { GraphQLNonNull, GraphQLString, GraphQLID } = require('graphql')
const { mutationWithClientMutationId, fromGlobalId } = require('graphql-relay')
const { GraphQLEmailAddress } = require('graphql-scalars')
const { t } = require('@lingui/macro')
const { LanguageEnums, RoleEnums } = require('../../enums')

const inviteUserToOrg = new mutationWithClientMutationId({
  name: 'InviteUserToOrg',
  description: `This mutation allows admins and higher to invite users to any of their
    organizations, if the invited user does not have an account, they will be
    able to sign-up and be assigned to that organization in one mutation.`,
  inputFields: () => ({
    userName: {
      type: GraphQLNonNull(GraphQLEmailAddress),
      description: 'Users email that you would like to invite to your org.',
    },
    requestedRole: {
      type: GraphQLNonNull(RoleEnums),
      description: 'The role which you would like this user to have.',
    },
    orgId: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The organization you wish to invite the user to.',
    },
    preferredLang: {
      type: GraphQLNonNull(LanguageEnums),
      description: 'The language in which the email will be sent in.',
    },
  }),
  outputFields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the invite or invite email was successfully sent.',
      resolve: async (payload) => {
        return payload.status
      },
    },
  }),
  mutateAndGetPayload: async (
    args,
    {
      i18n,
      request,
      collections,
      transaction,
      userId,
      auth: { checkPermission, tokenize, userRequired },
      loaders: { orgLoaderByKey, userLoaderByKey, userLoaderByUserName },
      notify: { sendOrgInviteCreateAccount, sendOrgInviteEmail },
      validators: { cleanseInput },
    },
  ) => {
    const userName = cleanseInput(args.userName)
    const requestedRole = cleanseInput(args.requestedRole)
    const { id: orgId } = fromGlobalId(cleanseInput(args.orgId))
    const preferredLang = cleanseInput(args.preferredLang)

    // Get requesting user
    const user = await userRequired(userId, userLoaderByKey)

    // Make sure user is not inviting themselves
    if (user.userName === userName) {
      console.warn(
        `User: ${userId} attempted to invite themselves to ${orgId}.`,
      )
      throw new Error(i18n._(t`Unable to invite yourself to an org. Please try again.`))
    }

    // Check to see if requested org exists
    const org = await orgLoaderByKey.load(orgId)

    if (typeof org === 'undefined') {
      console.warn(
        `User: ${userId} attempted to invite user: ${userName} to ${orgId} however there is no org associated with that id.`,
      )
      throw new Error(i18n._(t`Unable to invite user. Please try again.`))
    }

    // Check to see requesting users permission to the org is
    const permission = await checkPermission({ orgId: org._id})

    if (
      permission === 'user' ||
      (permission === 'admin' && requestedRole === 'super_admin')
    ) {
      console.warn(
        `User: ${userId} attempted to invite user: ${userName} to org: ${org.slug} with role: ${requestedRole} but does not have permission to do so.`,
      )
      throw new Error(i18n._(t`Unable to invite user. Please try again.`))
    }

    // Check to see if requested user exists
    const requestedUser = await userLoaderByUserName.load(userName)

    // If there is not associated account with that user name send invite to org with create account
    if (typeof requestedUser === 'undefined') {
      let templateId
      if (preferredLang === 'french') {
        templateId = '3c10d11b-f502-439d-bca1-afa551012310'
      } else {
        templateId = 'e66e1a68-8041-40be-af0e-83d064965431'
      }

      const token = tokenize({
        parameters: { userName, orgId: org._id, requestedRole },
      })
      const createAccountLink = `${request.protocol}://${request.get(
        'host',
      )}/create-account/${token}`

      await sendOrgInviteCreateAccount({
        templateId,
        user: { userName: userName },
        orgName: org.name,
        createAccountLink,
      })

      console.info(
        `User: ${userId} successfully invited user: ${userName} to the service, and org: ${org.slug}.`,
      )

      return {
        status:
          i18n._(t`Successfully sent invitation to service, and organization email.`),
      }
    }
    // If account is found add just add affiliation
    else {
      // Generate list of collections names
      const collectionStrings = []
      for (const property in collections) {
        collectionStrings.push(property.toString())
      }

      // Setup Transaction
      const trx = await transaction(collectionStrings)

      // Create affiliation
      try {
        await trx.run(() =>
          collections.affiliations.save({
            _from: org._id,
            _to: requestedUser._id,
            permission: requestedRole,
          }),
        )
      } catch (err) {
        console.error(
          `Transaction run error occurred while user: ${userId} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to invite user. Please try again.`))
      }

      let templateId
      if (requestedUser.preferredLang === 'french') {
        templateId = 'a6eb3fdd-c7ab-4404-af04-316abd2fb221'
      } else {
        templateId = 'eccc6a60-44e8-40ff-8b15-ed82155b769f'
      }
      await sendOrgInviteEmail({
        templateId,
        user: requestedUser,
        orgName: org.name,
      })

      // Commit affiliation
      try {
        await trx.commit()
      } catch (err) {
        console.error(
          `Transaction commit error occurred while user: ${userId} attempted to invite user: ${requestedUser._key} to org: ${org.slug}, error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to invite user. Please try again.`))
      }

      console.info(
        `User: ${userId} successfully invited user: ${requestedUser._key} to the org: ${org.slug}.`,
      )

      return {
        status:
          i18n._(t`Successfully invited user to organization, and sent notification email.`),
      }
    }
  },
})

module.exports = {
  inviteUserToOrg,
}
