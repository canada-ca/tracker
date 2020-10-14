const { generateDetailTableFields } = require('../loaders')

describe('given the generateDetailTableFields function', () => {
  describe('given a successful generation', () => {
    describe('pagination args are set', () => {
      describe('having first argument', () => {
        it('returns paginationArgs with first field set', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'first',
                },
                value: {
                  value: 5,
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: 'first: 5',
          })
        })
      })
      describe('having last argument ', () => {
        it('returns subfield gql string with last argument set', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'last',
                },
                value: {
                  value: 5,
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: 'last: 5',
          })
        })
      })
      describe('having before argument', () => {
        it('returns subfield gql string with before argument set', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'before',
                },
                value: {
                  value: 'SGVsbG8xMjM0',
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: 'before: "SGVsbG8xMjM0"',
          })
        })
      })
      describe('having after argument', () => {
        it('returns subfield gql string with after argument set', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'after',
                },
                value: {
                  value: 'SGVsbG8xMjM0',
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: 'after: "SGVsbG8xMjM0"',
          })
        })
      })
      describe('having all arguments set', () => {
        it('returns paginationArgs with all arguments set', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'first',
                },
                value: {
                  value: 5,
                },
              },
              {
                name: {
                  value: 'last',
                },
                value: {
                  value: 5,
                },
              },
              {
                name: {
                  value: 'before',
                },
                value: {
                  value: 'SGVsbG8xMjM0',
                },
              },
              {
                name: {
                  value: 'after',
                },
                value: {
                  value: 'SGVsbG8xMjM0',
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs:
              'first: 5 last: 5 before: "SGVsbG8xMjM0" after: "SGVsbG8xMjM0"',
          })
        })
      })
    })
    describe('having edge field', () => {
      describe('having cursor field', () => {
        it('returns subfield gql string with cursor selection field set', () => {
          const subField = {
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
                          value: 'cursor',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: 'edges {\ncursor\n}\n',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('having node field', () => {
        describe('having id field', () => {
          it('returns subfield gql string with node selection field, with id subfield set', () => {
            const subField = {
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
            }

            const detailTableField = generateDetailTableFields({ subField })

            expect(detailTableField).toEqual({
              edgeSelection: 'edges {\n\nnode{\nid\n}\n}\n',
              pageInfoSelection: '',
              paginationArgs: '',
            })
          })
        })
      })
      describe('having cursor and node fields set', () => {
        it('returns subfield gql string with node & cursor selection fields set', () => {
          const subField = {
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
                          value: 'cursor',
                        },
                      },
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
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: 'edges {\ncursor\nnode{\nid\n}\n}\n',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
    })
    describe('having pageInfo field', () => {
      describe('having hasNextPage field', () => {
        it('returns subfield gql string with pageInfo selection', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'pageInfo',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'hasNextPage',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: 'pageInfo {\nhasNextPage\n}\n',
            paginationArgs: '',
          })
        })
      })
      describe('having hasPreviousPage field', () => {
        it('returns subfield gql string with pageInfo selection', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'pageInfo',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'hasPreviousPage',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: 'pageInfo {\nhasPreviousPage\n}\n',
            paginationArgs: '',
          })
        })
      })
      describe('having startCursor field', () => {
        it('returns subfield gql string with pageInfo selection', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'pageInfo',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'startCursor',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: 'pageInfo {\nstartCursor\n}\n',
            paginationArgs: '',
          })
        })
      })
      describe('having endCursor field', () => {
        it('returns subfield gql string with pageInfo selection', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'pageInfo',
                  },
                  selectionSet: {
                    selections: [
                      {
                        name: {
                          value: 'endCursor',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: 'pageInfo {\nendCursor\n}\n',
            paginationArgs: '',
          })
        })
      })
    })
  })
  describe('test edge cases', () => {
    describe('paginationArgs edge cases', () => {
      describe('argument list length == 0', () => {
        it('returns empty string', () => {
          const subField = {
            arguments: [],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('first, last, before, after fields are not set', () => {
        it('returns empty strings', () => {
          const subField = {
            arguments: [
              {
                name: {
                  value: 'test',
                },
              },
            ],
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
    })
    describe('pageInfo and edge selection edge cases', () => {
      describe('pageInfo and edge are not in the selection set', () => {
        it('returns empty args', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'test',
                  },
                  selectionSet: {
                    selections: [],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('subField.selectionSet.selections is undefined', () => {
        it('returns empty args', () => {
          const subField = {
            selectionSet: {},
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('subField.selectionSet.selections has length of zero', () => {
        it('returns empty args', () => {
          const subField = {
            selectionSet: {
              selections: [],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('edges selectionSet.selections is length zero', () => {
        it('returns empty args', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'edges',
                  },
                  selectionSet: {
                    selections: [],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('edges selectionSet.selections does not contain cursor or node', () => {
        it('returns an empty string', () => {
          const subField = {
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
                          value: 'test',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
      describe('pageInfo selectionSet.selections is length zero', () => {
        it('returns empty args', () => {
          const subField = {
            selectionSet: {
              selections: [
                {
                  name: {
                    value: 'pageInfo',
                  },
                  selectionSet: {
                    selections: [],
                  },
                },
              ],
            },
          }

          const detailTableField = generateDetailTableFields({ subField })

          expect(detailTableField).toEqual({
            edgeSelection: '',
            pageInfoSelection: '',
            paginationArgs: '',
          })
        })
      })
    })
  })
})
