import { indexes } from '../indexes'

describe('indexes', () => {
  describe('with 1 record per page', () => {
    const recordsPerPage = 1
    describe('on page 1', () => {
      it('returns 0', () => {
        expect(indexes({ recordsPerPage, page: 1 })).toEqual([0, 1])
      })
    })
    describe('on page 2', () => {
      it('returns 1', () => {
        expect(indexes({ recordsPerPage, page: 2 })).toEqual([1, 2])
      })
    })
    describe('on page 3', () => {
      it('returns 2', () => {
        expect(indexes({ recordsPerPage, page: 3 })).toEqual([2, 3])
      })
    })
  })
  describe('with 2 records per page', () => {
    const recordsPerPage = 2
    describe('on page 1', () => {
      it('returns 0', () => {
        expect(indexes({ recordsPerPage, page: 1 })).toEqual([0, 2])
      })
    })
    describe('on page 2', () => {
      it('returns 2', () => {
        expect(indexes({ recordsPerPage, page: 2 })).toEqual([2, 4])
      })
    })
    describe('on page 3', () => {
      it('returns 4', () => {
        expect(indexes({ recordsPerPage, page: 3 })).toEqual([4, 6])
      })
    })
  })

  describe('with 5 records per page', () => {
    const recordsPerPage = 5
    describe('on page 1', () => {
      it('returns 0', () => {
        expect(indexes({ recordsPerPage, page: 1 })).toEqual([0, 5])
      })
    })
    describe('on page 2', () => {
      it('returns 5', () => {
        expect(indexes({ recordsPerPage, page: 2 })).toEqual([5, 10])
      })
    })
    describe('on page 3', () => {
      it('returns 9', () => {
        expect(indexes({ recordsPerPage, page: 3 })).toEqual([10, 15])
      })
    })
  })
  describe('with 10 records per page', () => {
    const recordsPerPage = 10
    describe('on page 1', () => {
      it('returns 0', () => {
        expect(indexes({ recordsPerPage, page: 1 })).toEqual([0, 10])
      })
    })
    describe('on page 2', () => {
      it('returns 9', () => {
        expect(indexes({ recordsPerPage, page: 2 })).toEqual([10, 20])
      })
    })
    describe('on page 3', () => {
      it('returns 19', () => {
        expect(indexes({ recordsPerPage, page: 3 })).toEqual([20, 30])
      })
    })
  })
})
