const generateDetailTableFields = ({ subField, variables }) => {
  const nodeSelections = []
  const nodeFields = [
    'id',
    'dkimAligned',
    'dkimDomains',
    'dkimSelectors',
    'dkimResults',
    'disposition',
    'dnsHost',
    'envelopFrom',
    'headerFrom',
    'guidance',
    'sourceIpAddress',
    'spfAligned',
    'spfDomains',
    'spfResults',
    'totalMessages',
  ]
  const pageInfoSelections = []
  const pageInfoFields = [
    'hasNextPage',
    'hasPreviousPage',
    'startCursor',
    'endCursor',
  ]
  let paginationArgs = ''
  let cursor = ''
  let edgeSelection = ''
  let pageInfoSelection = ''
  let node = ''

  const paginationArr = []
  if (typeof subField.arguments !== 'undefined') {
    if (subField.arguments.length !== 0) {
      subField.arguments.forEach((arg) => {
        if (arg.name.value === 'first' || arg.name.value === 'last')
          if (arg.value.kind === 'Variable') {
            paginationArr.push(
              `${arg.name.value}: ${variables[arg.value.name.value]}`,
            )
          } else {
            paginationArr.push(`${arg.name.value}: ${arg.value.value}`)
          }
        else if (arg.name.value === 'before' || arg.name.value === 'after')
          if (arg.value.kind === 'Variable') {
            paginationArr.push(
              `${arg.name.value}: "${variables[arg.value.name.value]}"`,
            )
          } else {
            paginationArr.push(`${arg.name.value}: "${arg.value.value}"`)
          }
      })
      paginationArgs = paginationArr.join(' ')
    }
  }

  if (typeof subField.selectionSet !== 'undefined') {
    if (typeof subField.selectionSet.selections !== 'undefined') {
      if (subField.selectionSet.selections.length !== 0) {
        subField.selectionSet.selections.forEach((subSubField) => {
          if (subSubField.name.value === 'edges') {
            if (subSubField.selectionSet.selections.length !== 0) {
              subSubField.selectionSet.selections.forEach((subSelection) => {
                if (subSelection.name.value === 'cursor') {
                  cursor = 'cursor'
                } else if (subSelection.name.value === 'node') {
                  subSelection.selectionSet.selections.forEach((nodeField) => {
                    if (nodeFields.includes(nodeField.name.value)) {
                      nodeSelections.push(nodeField.name.value)
                    }
                  })
                }
              })

              if (nodeSelections.length > 0) {
                node = `node{\n${nodeSelections.join(' ')}\n}\n`
              }

              if (cursor !== '' || node !== '') {
                edgeSelection = `edges {\n${cursor}\n${node}}\n`
              }
            }
          } else if (subSubField.name.value === 'pageInfo') {
            if (subSubField.selectionSet.selections.length !== 0) {
              subSubField.selectionSet.selections.forEach((subSelection) => {
                if (pageInfoFields.includes(subSelection.name.value)) {
                  pageInfoSelections.push(subSelection.name.value)
                }
              })
              if (pageInfoSelections.length > 0) {
                pageInfoSelection = `pageInfo {\n${pageInfoSelections.join(
                  ' ',
                )}\n}\n`
              }
            }
          }
        })
      }
    }
  }

  return {
    paginationArgs: paginationArgs,
    edgeSelection: edgeSelection,
    pageInfoSelection: pageInfoSelection,
  }
}

module.exports = {
  generateDetailTableFields,
}
