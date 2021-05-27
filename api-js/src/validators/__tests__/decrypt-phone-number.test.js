import { decryptPhoneNumber } from '../decrypt-phone-number'
import crypto from 'crypto'

const { CIPHER_KEY } = process.env

describe('given an encrypted phone number field', () => {
  describe('phone number field is a valid phone number', () => {
    it('returns the decrypted phone number', () => {
      const originalPhoneNumber = "+12345678912"

      const phoneDetails = {
        iv: crypto.randomBytes(12).toString('hex'),
      }
      const cipher = crypto.createCipheriv(
        'aes-256-ccm',
        String(CIPHER_KEY),
        Buffer.from(phoneDetails.iv, 'hex'),
        {
          authTagLength: 16,
        },
      )
      let encrypted = cipher.update(originalPhoneNumber, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      phoneDetails.phoneNumber = encrypted
      phoneDetails.tag = cipher.getAuthTag().toString('hex')

      const decryptedPhoneNumber = decryptPhoneNumber(phoneDetails)

      expect(decryptedPhoneNumber).toEqual(originalPhoneNumber)
    })
  })
})
