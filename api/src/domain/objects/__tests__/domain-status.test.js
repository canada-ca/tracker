import { StatusEnum } from '../../../enums'
import { domainStatus } from '../domain-status'

describe('given the domainStatus object', () => {
  describe('testing its field definitions', () => {
    it('has a ciphers field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('ciphers')
      expect(demoType.ciphers.type).toMatchObject(StatusEnum)
    })
    it('has a curves field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('curves')
      expect(demoType.curves.type).toMatchObject(StatusEnum)
    })
    it('has a dkim field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('dkim')
      expect(demoType.dkim.type).toMatchObject(StatusEnum)
    })
    it('has a dmarc field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('dmarc')
      expect(demoType.dmarc.type).toMatchObject(StatusEnum)
    })
    it('has a https field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('https')
      expect(demoType.https.type).toMatchObject(StatusEnum)
    })
    it('has a hsts field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('hsts')
      expect(demoType.hsts.type).toMatchObject(StatusEnum)
    })
    it('has a policy field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('policy')
      expect(demoType.policy.type).toMatchObject(StatusEnum)
    })
    it('has a protocols field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('protocols')
      expect(demoType.protocols.type).toMatchObject(StatusEnum)
    })
    it('has a spf field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('spf')
      expect(demoType.spf.type).toMatchObject(StatusEnum)
    })
    it('has a ssl field', () => {
      const demoType = domainStatus.getFields()

      expect(demoType).toHaveProperty('ssl')
      expect(demoType.ssl.type).toMatchObject(StatusEnum)
    })
  })

  describe('testing its field resolvers', () => {
    describe('testing the ciphers resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.ciphers.resolve({ ciphers: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the curves resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.curves.resolve({ curves: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the dkim resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.dkim.resolve({ dkim: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the dmarc resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.dmarc.resolve({ dmarc: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the https resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.https.resolve({ https: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the hsts resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.hsts.resolve({ hsts: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the policy resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()
        const fields = {
          ciphers: 'pass',
          https: 'pass',
          hsts: 'pass',
          protocols: 'pass',
          ssl: 'pass',
        }
        // All pass so policy passes
        expect(demoType.policy.resolve(fields)).toEqual('pass')

        // One fails so policy fails
        Object.keys(fields).forEach((k) => {
          const mutatedFields = Object.assign({}, fields)
          mutatedFields[k] = 'fail'
          expect(demoType.policy.resolve(mutatedFields)).toEqual('fail')
        })
      })
    })
    describe('testing the protocols resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.protocols.resolve({ protocols: 'pass' })).toEqual(
          'pass',
        )
      })
    })
    describe('testing the spf resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.spf.resolve({ spf: 'pass' })).toEqual('pass')
      })
    })
    describe('testing the ssl resolver', () => {
      it('returns the resolved value', () => {
        const demoType = domainStatus.getFields()

        expect(demoType.ssl.resolve({ ssl: 'pass' })).toEqual('pass')
      })
    })
  })
})
