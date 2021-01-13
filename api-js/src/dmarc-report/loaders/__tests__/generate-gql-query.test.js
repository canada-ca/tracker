import { generateGqlQuery, generateDetailTableFields } from '../index'

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
      it('returns query with categoryTotals, with all sub fields set', () => {
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
                        {
                          name: {
                            value: 'fullPass',
                          },
                        },
                        {
                          name: {
                            value: 'passDkimOnly',
                          },
                        },
                        {
                          name: {
                            value: 'passSpfOnly',
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
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\ncategoryTotals {\nfail fullPass passDkimOnly passSpfOnly\n}\n\n\n}\n}',
        )
      })
    })
    describe('categoryPercentages field is set', () => {
      it('returns query with categoryPercentages, with all sub fields set', () => {
        const gqlGen = generateGqlQuery({ generateDetailTableFields })

        const info = {
          fieldName: 'testQuery',
          fieldNodes: [
            {
              selectionSet: {
                selections: [
                  {
                    name: {
                      value: 'categoryPercentages',
                    },
                    selectionSet: {
                      selections: [
                        {
                          name: {
                            value: 'fail',
                          },
                        },
                        {
                          name: {
                            value: 'fullPass',
                          },
                        },
                        {
                          name: {
                            value: 'passDkimOnly',
                          },
                        },
                        {
                          name: {
                            value: 'passSpfOnly',
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
          '{\ntestQuery(\ndomain: "test.domain.ca"\n){\n\ncategoryTotals {\nfail fullPass passDkimOnly passSpfOnly\n}\n\n\n}\n}',
        )
      })
    })
    describe('detailTables field is set', () => {
      it('returns query with only detailTables field', () => {
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
                        {
                          name: {
                            value: 'dkimFailure',
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
                        {
                          name: {
                            value: 'dmarcFailure',
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
                        {
                          name: {
                            value: 'spfFailure',
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
                        {
                          name: {
                            value: 'randomField',
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
          `{
testQuery(
domain: "test.domain.ca"
){
detailTables {
fullPass (
){
edges {
node{
id
}
}
}
 dkimFailure (
){
edges {
node{
id
}
}
}
 dmarcFailure (
){
edges {
node{
id
}
}
}
 spfFailure (
){
edges {
node{
id
}
}
}
}
}
}`,
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
    describe('int argument is set', () => {
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
    describe('string variable argument is set', () => {
      it('returns a gql query with a string argument set', () => {
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
                    name: {
                      value: 'varString',
                    },
                    kind: 'Variable',
                  },
                },
              ],
            },
          ],
          variableValues: {
            varString: 'testString',
          },
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ntestArgument: "testString"\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('other variable argument is set', () => {
      it('returns a gql query with an other argument set', () => {
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
                    name: {
                      value: 'varOther',
                    },
                    kind: 'Variable',
                  },
                },
              ],
            },
          ],
          variableValues: {
            varOther: 5,
          },
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\ntestArgument: 5\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
    })
    describe('month variable argument is set', () => {
      it('returns a gql query with a month argument set', () => {
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
                    value: 'month',
                  },
                  value: {
                    name: {
                      value: 'month',
                    },
                    kind: 'Variable',
                  },
                },
              ],
            },
          ],
          variableValues: {
            month: 'Last30days',
          },
        }

        const gqlQuery = gqlGen({ info, domain: 'test.domain.ca' })
        expect(gqlQuery).toEqual(
          '{\ntestQuery(\nmonth: LAST30DAYS\ndomain: "test.domain.ca"\n){\nstartDate\nendDate\n\n\n\n}\n}',
        )
      })
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
