import ldap from 'ldapjs'

const { NODE_ENV } = process.env

;(async () => {
  const server = ldap.createServer()
  server.after(function (req, _res, next) {
    if (req.dn.toString() !== '' && req.dn.toString() !== 'cn=anonymous') {
      // Do the thing
      const domain = req.dn.toString().split('=')[1]
      console.log({
        timestamp: Date.now(),
        remoteAddress: req.connection.remoteAddress,
        remoteport: req.connection.remotePort,
        domain: domain,
      })
    }
    return next()
  })

  server.listen(1389, () => {
    console.log('LDAP server listening at %s', server.url)
  })
})()
