const { generateGqlQuery, generateDetailTableFields } = require('../loaders')

describe('given the generateGqlQuery function', () => {
  describe('given a successful generation', () => {
    describe('year field is set', () => {
      it('returns query with startDate and endDate are present', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'month',
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('month field is set', () => {
      it('returns query with startDate and endDate are present', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'year',
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('categoryTotals field is set', () => {
      it('returns query with categoryTotals, and fields present', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'categoryTotals',
                    },
                    selectionSet: {
                      selections: [
                        {
                          name: {
                            value: 'fail',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\ncategoryTotals {\nfail\n}\n\n\n}\n}',
        )
      })
    })
    describe('detailTables field is set', () => {
      it('returns query with detailTables field', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'detailTables',
                    },
                    selectionSet: {
                      selections: [
                        {
                          name: {
                            value: 'fullPass',
                          },
                          selectionSet: {
                            selections: [
                              {
                                name: {
                                  value: 'edges',
                                },
                                selectionSet: {
                                  selections: [
                                    {
                                      name: {
                                        value: 'node',
                                      },
                                      selectionSet: {
                                        selections: [
                                          {
                                            name: {
                                              value: 'id',
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\n\ndetailTables {\nfullPass (\n\n){\n\nedges {\n\nnode{\nid\n}\n}\n\n}\n\n}\n\n}\n}',
        )
      })
    })
    describe('string argument is set', () => {
      it('returns gql query with a string argument', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'month',
                    },
                  },
                ],
              },
              arguments: [
                {
                  name: {
                    value: 'testArgument',
                  },
                  value: {
                    value: 'testString',
                    kind: 'StringValue',
                  },
                },
              ],
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ntestArgument: "testString"\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('in argument is set', () => {
      const gqlGen = generateGqlQuery({ generateDetailTableFields })

      const info = {
        fieldName: 'testQuery',
        fieldNodes: [
          {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'month',
                  },
                },
              ],
            },
            arguments: [
              {
                name: {
                  value: 'testArgument',
                },
                value: {
                  value: 5,
                  kind: 'IntValue',
                },
              },
            ],
          },
        ],
      }

      const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
      expect(gqlQuery).toEqual(
        '{\ntestQuery(\ntestArgument: 5\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
      )
    })
  })
  describe('edge case occurs', () => {
    describe('fieldNodes is undefined', () => {
      it('returns null', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: undefined,
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(null)
      })
    })
    describe('fieldNodes length is zero', () => {
      it('returns null', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(null)
      })
    })
    describe('fieldNodes arguments is undefined', () => {
      it('returns null', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'month',
                    },
                  },
                ],
              },
              arguments: undefined,
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: undefined })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\n\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('fieldNodes arguments length is zero', () => {
      it('returns null', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'month',
                    },
                  },
                ],
              },
              arguments: [],
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: undefined })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\n\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('no field selections in categoryTotals', () => {
      it('returns query without categoryTotals selection', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'categoryTotals',
                    },
                    selectionSet: {
                      selections: [],
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\n\n\n}\n}',
        )
      })
    })
    describe('no field selections in detailTables', () => {
      it('returns query without detailTables selection', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'detailTables',
                    },
                    selectionSet: {
                      selections: [],
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\n\n\n}\n}',
        )
      })
    })
    describe('field selection is not month, year, categoryTotals, or detailTables', () => {
      it('returns an empty query', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'randomField',
                    },
                    selectionSet: {
                      selections: [],
                    },
                  },
                ],
              },
            },
          ],
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\n\n\n}\n}',
        )
      })
    })
    describe('domain is undefined', () => {
      describe('its not included in argument list', () => {
        it('returns query string', () => {
          const gqlGen = generateGqlQuery({ generateDetailTableFields })

          const info = {
            fieldName: 'testQuery',
            fieldNodes: [
              {
                selectionSet: {
                  selections: [
                    {
                      name: {
                        value: 'month',
                      },
                    },
                  ],
                },
                arguments: [
                  {
                    name: {
                      value: 'testArgument',
                    },
                    value: {
                      value: 5,
                      kind: 'IntValue',
                    },
                  },
                ],
              },
            ],
          }

          const gqlQuery = gqlGen({ info, domain: undefined })
          expect(gqlQuery).toEqual(
            '{\ntestQuery(\ntestArgument: 5\n){\nstartDate\nendDate\n\n\n\n}\n}',
          )
        })
      })
    })
  })
})
