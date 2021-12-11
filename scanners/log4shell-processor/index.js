import ldap from 'ldapjs'

const { NODE_ENV } = process.env

;(async () => {
  const server = ldap.createServer()

  server.search('c=log4shelltest', (req, res) => {
    console.log({
      timestamp: Date.now(),
      remoteAddress: req.connection.remoteAddress,
      remoteport: req.connection.remotePort
      // query: req.dn.toString(),
      // scope: req.scope,
      // filter: req.filter.toString(),
    })

    res.end()
  })

  server.listen(1389, () => {
    console.log('LDAP server listening at %s', server.url)
  })
})()
