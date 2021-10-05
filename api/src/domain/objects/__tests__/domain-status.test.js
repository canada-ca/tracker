import { StatusEnum } from '../../../enums'
import { domainStatus } from '../domain-status'

describe('given the domainStatus object', () => {
  describe('testing its field definitions', () => {
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
