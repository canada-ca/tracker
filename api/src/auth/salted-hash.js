import crypto from 'crypto'

export const saltedHash = (salt) => (data) => {
  const saltedData = data + salt

  return crypto.createHash('md5').update(saltedData).digest('hex')
}
