export const customOnConnect =
  ({
    createContext,
    serverContext,
    createI18n,
    verifyToken,
    userRequired,
    loadUserByKey,
    verifiedRequired,
  }) =>
  async (connectionParams, webSocket, context) => {
    const expandedContext = { ...serverContext, ...context }

    const factoryFunc = createContext(expandedContext)

    const enLangPos = String(
      webSocket.upgradeReq.headers['accept-language'],
    ).indexOf('en')
    const frLangPos = String(
      webSocket.upgradeReq.headers['accept-language'],
    ).indexOf('fr')

    let language = 'en'
    if (frLangPos > enLangPos) {
      language = 'fr'
    }

    const authorization = connectionParams?.authorization

    const i18n = createI18n(language)
    const verify = verifyToken({ i18n })
    const token = authorization || ''

    let userKey
    if (token !== '') {
      userKey = verify({ token }).userKey
    }

    const { query } = serverContext

    const user = await userRequired({
      i18n,
      userKey,
      loadUserByKey: loadUserByKey({ query, userKey }),
    })()

    verifiedRequired({ user })

    console.info(`User: ${userKey}, connected to subscription.`)

    const finalContext = await factoryFunc({ req: context.request, connection: { language, authorization } })

    return finalContext
  }
