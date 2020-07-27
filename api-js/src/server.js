const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const validator = require('validator')
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

const cleanseInput = (input) => {
  if (typeof input == 'undefined') {
    return ''
  }
  input = validator.trim(input)
  input = validator.stripLow(input)
  input = validator.escape(input)
  return input
}

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
    context: ({ request, response }) => {
      // Get userid from token
      if (typeof request !== 'undefined') {
        const token = request.headers.authorization || ''
        let userId
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
        functions: {
          cleanseInput,
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
