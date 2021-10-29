import crypto from 'crypto'

const { CIPHER_KEY } = process.env

export const decryptPhoneNumber = ({ iv, tag, phoneNumber: encrypted }) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-ccm',
    String(CIPHER_KEY),
    Buffer.from(iv, 'hex'),
    { authTagLength: 16 },
  )
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
