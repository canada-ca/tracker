export const customOnConnect = ({
  context,
  createI18n,
  verifyToken,
  userRequired,
  loadUserByKey,
}) => async (connectionParams, webSocket) => {
  const enLangPos = String(
    webSocket.upgradeReq.headers['accept-language'],
  ).indexOf('en')
  const frLangPos = String(
    webSocket.upgradeReq.headers['accept-language'],
  ).indexOf('fr')
  let language
  if (frLangPos > enLangPos) {
    language = 'fr'
  } else {
    language = 'en'
  }

  let authorization
  if (connectionParams.authorization) {
    authorization = connectionParams.authorization
  }

  const i18n = createI18n(language)
  const verify = verifyToken({ i18n })
  const token = authorization || ''

  let userKey = ''
  if (token !== '') {
    userKey = verify({ token }).userKey
  }

  const { query } = context

  await userRequired({
    i18n,
    userKey,
    loadUserByKey: loadUserByKey({ query, userKey }),
  })()

  console.info(`User: ${userKey}, connected to subscription.`)

  return {
    language,
    authorization,
  }
}
