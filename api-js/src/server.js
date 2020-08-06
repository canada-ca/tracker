const cors = require('cors')
const express = require('express')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
// const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const { ApolloServer } = require('apollo-server-express')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

const { userLoaderByUserName, userLoaderById } = require('./loaders')

// internationalization.load({
//   fr: unpackCatalog(require('./locale/fr/messages.js')),
//   en: unpackCatalog(require('./locale/en/messages.js')),
// })

const Server = (context = {}) => {
  const app = express()

  app.use('*', cors())

  app.use(
    requestLanguage({
      languages: ['en', 'fr'],
    }),
  )

  app.get('/alive', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: 'yes' })
  })

  // internationalization.activate(req.language)
  // const schema = new GraphQLSchema({
  //   query: createQuerySchema(internationalization),
  //   mutation: createMutationSchema(internationalization)
  // })

  const server = new ApolloServer({
    schema: new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    }),
    context: ({ req: request, res: response }) => {
      const {auth: { verifyToken }, query} = context
      // Get user id from token
      let userId
      const token = request.headers.authorization || ''
      if (token !== '') {
        userId = verifyToken({token}).userId
      }

      return {
        request,
        response,
        userId,
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
          userLoaderById: userLoaderById(query),
        },
        ...context,
      }
    },
  })

  server.applyMiddleware({ app })
  return createServer(app)
}

module.exports = {
  Server,
}
