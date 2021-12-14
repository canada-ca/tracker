const crypto = require('crypto')

const saltedHash = (data, salt) => {
  const saltedData = data + salt

  return crypto.createHash('md5').update(saltedData).digest('hex')
}

module.exports = {
  saltedHash,
}
