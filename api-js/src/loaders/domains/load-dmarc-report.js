require('isomorphic-fetch')

const { DMARC_REPORT_API_URL } = process.env

const generateDetailTableFields = (subField) => {
  let paginationArgs = ''
  let cursor = ''
  let edgeSelection = ''
  let pageInfoSelection = ''

  const paginationArr = []
  if (subField.arguments.length !== 0) {
    subField.arguments.forEach((arg) => {
      if (arg.name.value === 'first' || arg.name.value === 'last')
        paginationArr.push(`${arg.name.value}: ${arg.value.value}`)
      else if (arg.name.value === 'before' || arg.name.value === 'after')
        paginationArr.push(`${arg.name.value}: "${arg.value.value}"`)
    })
    paginationArgs = paginationArr.join(' ')
  }

  const nodeSelections = []
  const pageInfoSelections = []
  subField.selectionSet.selections.forEach((subField) => {
    if (subField.name.value === 'edges') {
      if (subField.selectionSet.selections.length !== 0) {
        subField.selectionSet.selections.forEach((subSelection) => {
          if (subSelection.name.value === 'cursor') {
            cursor = 'cursor'
          } else if (subSelection.name.value === 'node') {
            subSelection.selectionSet.selections.forEach((nodeField) => {
              nodeSelections.push(nodeField.name.value)
            })
          }
        })

        if (cursor !== '' || nodeSelections.length > 0) {
          edgeSelection = `edges {\n${cursor}\nnode{\n${nodeSelections.join(
            ' ',
          )}\n}\n}\n`
        }
      }
    } else if (subField.name.value === 'pageInfo') {
      if (subField.selectionSet.selections.length !== 0) {
        subField.selectionSet.selections.forEach((subSelection) => {
          pageInfoSelections.push(subSelection.name.value)
        })
        if (pageInfoSelections.length > 0) {
          pageInfoSelection = `pageInfo {\n${pageInfoSelections.join(' ')}\n}\n`
        }
      }
    }
  })

  return {
    paginationArgs: paginationArgs,
    edgeSelection: edgeSelection,
    pageInfoSelection: pageInfoSelection,
  }
}

const domainLoaderDmarcReport = async (info, domain) => {
  const detailTables = []
  let categoryTotalsStr = ''
  let detailTablesStr = ''
  let startEndDateStr = ''

  info.fieldNodes[0].selectionSet.selections.forEach((field) => {
    if (field.name.value === 'month' || field.name.value === 'year') {
      startEndDateStr = 'startDate\nendDate'
    } else if (field.name.value === 'categoryTotals') {
      const selectionArr = []
      if (field.selectionSet.selections.length !== 0) {
        field.selectionSet.selections.forEach((subField) => {
          selectionArr.push(subField.name.value)
        })

        const selections = selectionArr.join(' ')
        categoryTotalsStr = `categoryTotals {\n${selections}\n}\n`
      }
    } else if (field.name.value === 'detailTables') {
      if (field.selectionSet.selections.length !== 0) {
        field.selectionSet.selections.forEach((subField) => {
          const {
            paginationArgs,
            pageInfoSelection,
            edgeSelection,
          } = generateDetailTableFields(subField)
          detailTables.push(
            `${subField.name.value} (\n${paginationArgs}\n){\n${pageInfoSelection}\n${edgeSelection}\n}\n`,
          )
        })
      }
    }
  })

  if (detailTables.length > 0) {
    detailTablesStr = `detailTables {\n${detailTables.join(' ')}\n}\n`
  }

  const queryArgs = []

  if (info.fieldNodes[0].arguments.length > 0) {
    info.fieldNodes[0].arguments.forEach((arg) => {
      if (arg.value.kind === 'StringValue') {
        queryArgs.push(`${arg.name.value}: "${arg.value.value}"`)
      } else {
        queryArgs.push(`${arg.name.value}: ${arg.value.value}`)
      }
    })
  }

  if (typeof domain !== 'undefined') {
    queryArgs.push(`domain: "${domain}"`)
  }

  const gqlQuery = `{\n${info.fieldName}(\n${queryArgs.join(
    '\n',
  )}\n){\n${startEndDateStr}\n${categoryTotalsStr}\n${detailTablesStr}\n}\n}`

  let data
  try {
    data = await fetch(DMARC_REPORT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery }),
    }).then((response) => response.json())
  } catch (err) {
    console.error(
      `Fetch error occurred well trying to retrieve ${info.fieldName} from the dmarc-report-api, error: ${err}`,
    )
    throw new Error(
      `Unable to retrieve ${info.fieldName} for domain: ${domain}.`,
    )
  }

  return data
}

module.exports = {
  domainLoaderDmarcReport,
}
