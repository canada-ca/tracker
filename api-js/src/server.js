const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const requestLanguage = require('express-request-language')
const { GraphQLSchema } = require('graphql')
const { createServer } = require('http')
// const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const { ApolloServer } = require('apollo-server-express')

const { createQuerySchema } = require('./queries')
const { createMutationSchema } = require('./mutations')

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
      // Get userid from token
      let userId
      if (typeof request !== 'undefined') {
        const token = request.headers.authorization || ''
        if (token !== '') {
          userId = jwt.verify(token, 'secretKeyGoesHere').userId
        }
      } else {
        userId = null
      }

      return {
        request,
        response,
        userId,
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
