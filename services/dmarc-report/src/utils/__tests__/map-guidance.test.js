const { mapGuidance } = require('../map-guidance')

describe('given the mapGuidance function', () => {
  it('maps agg-spf-no-record to agg1', () => {
    const mappedGuidance = mapGuidance('agg-spf-no-record')
    expect(mappedGuidance).toEqual('agg1')
  })
  it('maps agg-spf-invalid to agg2', () => {
    const mappedGuidance = mapGuidance('agg-spf-invalid')
    expect(mappedGuidance).toEqual('agg2')
  })
  it('maps agg-spf-failed to agg3', () => {
    const mappedGuidance = mapGuidance('agg-spf-failed')
    expect(mappedGuidance).toEqual('agg3')
  })
  it('maps agg-spf-mismatch to agg4', () => {
    const mappedGuidance = mapGuidance('agg-spf-mismatch')
    expect(mappedGuidance).toEqual('agg4')
  })
  it('maps agg-spf-strict to agg5', () => {
    const mappedGuidance = mapGuidance('agg-spf-strict')
    expect(mappedGuidance).toEqual('agg5')
  })
  it('maps agg-dkim-unsigned to agg6', () => {
    const mappedGuidance = mapGuidance('agg-dkim-unsigned')
    expect(mappedGuidance).toEqual('agg6')
  })
  it('maps agg-dkim-invalid to agg7', () => {
    const mappedGuidance = mapGuidance('agg-dkim-invalid')
    expect(mappedGuidance).toEqual('agg7')
  })
  it('maps agg-dkim-failed to agg8', () => {
    const mappedGuidance = mapGuidance('agg-dkim-failed')
    expect(mappedGuidance).toEqual('agg8')
  })
  it('maps agg-dkim-mismatch to agg9', () => {
    const mappedGuidance = mapGuidance('agg-dkim-mismatch')
    expect(mappedGuidance).toEqual('agg9')
  })
  it('maps agg-dkim-strict to agg10', () => {
    const mappedGuidance = mapGuidance('agg-dkim-strict')
    expect(mappedGuidance).toEqual('agg10')
  })
  describe('guidance is not a matching case', () => {
    it('returns passed in value', () => {
      const mappedGuidance = mapGuidance('agg1')
      expect(mappedGuidance).toEqual('agg1')
    })
  })
})
