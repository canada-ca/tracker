import ldap from 'ldapjs'

const { NODE_ENV } = process.env

;(async () => {
  const server = ldap.createServer()
  server.after(function (req, res, next) {
    if (req.dn.toString() != '' && req.dn.toString() != 'cn=anonymous') {
      // Do the thing
      let domain = req.dn.toString().split('=')[1]
      console.log(`Server is ${domain}`)
    }
    return next()
  })

  server.listen(1389, () => {
    console.log('LDAP server listening at %s', server.url)
  })
})()
