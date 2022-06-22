import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { tagType } from '../../domain/objects'
import { Acronym, Domain, Slug } from '../../scalars'
import { organizationOrder } from '../inputs'

const webCheckType = new GraphQLObjectType({
  name: 'WebCheckConnection',
  description: '',
  fields: () => ({
    organizations: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'WebCheckOrganizationConnection',
          fields: () => ({
            organization: {
              type: new GraphQLObjectType({
                name: 'WebCheckOrganization',
                fields: () => ({
                  id: globalIdField('organization'),
                  acronym: {
                    type: Acronym,
                    description: 'The organizations acronym.',
                    resolve: ({ acronym }) => acronym,
                  },
                  name: {
                    type: GraphQLString,
                    description: 'The full name of the organization.',
                    resolve: ({ name }) => name,
                  },
                  slug: {
                    type: Slug,
                    description: 'Slugified name of the organization.',
                    resolve: ({ slug }) => slug,
                  },
                  tags: {
                    type: tagType,
                    description:
                      'Whether or not the domain has a aggregate dmarc report.',
                    resolve: async (
                      { _id },
                      args,
                      {
                        _i18n,
                        // auth: {
                        //   userRequired,
                        //   verifiedRequired,
                        //   checkSuperAdmin,
                        //   superAdminRequired,
                        // },
                        loaders: { loadDomainTagsByOrgId },
                      },
                    ) => {
                      // const user = await userRequired()
                      // verifiedRequired({ user })

                      // const isSuperAdmin = await checkSuperAdmin()
                      // superAdminRequired({ user, isSuperAdmin })
                      const orgTags = await loadDomainTagsByOrgId({
                        orgId: _id,
                        ...args,
                      })
                      return orgTags
                    },
                  },
                }),
              }),
              description: '',
            },
            domains: {
              type: new GraphQLObjectType({
                name: 'WebCheckDomainConnection',
                fields: () => ({
                  edges: {
                    type: new GraphQLList(
                      new GraphQLObjectType({
                        name: 'WebCheckDomain',
                        fields: () => ({
                          id: globalIdField('domain'),
                          domain: {
                            type: Domain,
                            description: 'Domain that scans will be ran on.',
                            resolve: ({ domain }) => domain,
                          },
                          lastRan: {
                            type: GraphQLString,
                            description:
                              'The last time that a scan was ran on this domain.',
                            resolve: ({ lastRan }) => lastRan,
                          },
                          tags: {
                            type: tagType,
                            description:
                              'Vulnerabilities that the domain has tested positive for.',
                            resolve: async (
                              { tags },
                              _,
                              // {
                              //   auth: {
                              //     userRequired,
                              //     verifiedRequired,
                              //     checkSuperAdmin,
                              //     superAdminRequired,
                              //   },
                              // },
                            ) => {
                              // const user = await userRequired()
                              // verifiedRequired({ user })

                              // const isSuperAdmin = await checkSuperAdmin()
                              // superAdminRequired({ user, isSuperAdmin })
                              return { edges: tags, totalCount: tags.length }
                            },
                          },
                        }),
                      }),
                    ),
                  },
                  totalCount: {
                    type: GraphQLInt,
                    description:
                      'The total amount of domains with vulnerability tags',
                    resolve: ({ totalCount }) => totalCount,
                  },
                }),
              }),
            },
          }),
        }),
      ),
      description: '',
      resolve: ({ organizations }) => organizations,
    },
    totalCount: {
      type: GraphQLInt,
      description: '',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})

export const findMyWebCheckOrganizations = {
  type: webCheckType,
  description: 'Select organizations a user has access to.',
  args: {
    orderBy: {
      type: organizationOrder,
      description: 'Ordering options for organization connections',
    },
    search: {
      type: GraphQLString,
      description: 'String argument used to search for organizations.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: {
        checkSuperAdmin,
        userRequired,
        verifiedRequired,
        loginRequiredBool,
      },
      loaders: { loadWebCheckConnectionsByUserId },
    },
  ) => {
    if (loginRequiredBool) {
      const user = await userRequired()
      verifiedRequired({ user })
    }

    const isSuperAdmin = await checkSuperAdmin()

    const orgConnections = await loadWebCheckConnectionsByUserId({
      isSuperAdmin,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their organizations.`)

    return orgConnections
  },
}
