require('isomorphic-fetch')

const { DMARC_REPORT_API_URL } = process.env

const generateDetailTableQuery = (subField) => {
  let paginationArgs = ''
  let cursor = ''
  let edgeSelection = ''
  let pageInfoSelection = ''

  const paginationArr = []
  if (subField.arguments.length !== 0) {
    subField.arguments.forEach((arg) => {
      if (arg.name.value === 'first')
        paginationArr.push(`first: ${arg.value.value}`)
      else if (arg.name.value === 'last')
        paginationArr.push(`last: ${arg.value.value}`)
      else if (arg.name.value === 'before')
        paginationArr.push(`before: "${arg.value.value}"`)
      else if (arg.name.value === 'after')
        paginationArr.push(`after: "${arg.value.value}"`)
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
          edgeSelection = `
          edges {
            ${cursor}
            node { 
              ${nodeSelections.join(' ')} 
            }
          }`
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
  let startDateStr = ''
  let endDateStr = ''
  let categoryTotalsStr = ''
  const detailTables = []
  let detailTablesStr = ''

  info.fieldNodes[0].selectionSet.selections.forEach((field) => {
    if (field.name.value === 'startDate') {
      startDateStr = 'startDate'
    } else if (field.name.value === 'endDate') {
      endDateStr = 'endDate'
    } else if (field.name.value === 'categoryTotals') {
      const selectionArr = []
      if (field.selectionSet.selections.length !== 0) {
        field.selectionSet.selections.forEach((subField) => {
          if (subField.name.value === 'fail') selectionArr.push('fail')
          else if (subField.name.value === 'fullPass')
            selectionArr.push('fullPass')
          else if (subField.name.value === 'passDkimOnly')
            selectionArr.push('passDkimOnly')
          else if (subField.name.value === 'passSpfOnly')
            selectionArr.push('passSpfOnly')
        })

        const selections = selectionArr.join(' ')
        categoryTotalsStr = `categoryTotals {\n${selections}\n}\n`
      }
    } else if (field.name.value === 'detailTables') {
      let dkimFailure = ''
      let dmarcFailure = ''
      let fullPass = ''
      let spfFailure = ''
      if (field.selectionSet.selections.length !== 0) {
        field.selectionSet.selections.forEach((subField) => {
          if (subField.name.value === 'dkimFailure') {
            const {
              paginationArgs,
              pageInfoSelection,
              edgeSelection,
            } = generateDetailTableQuery(subField)
            dkimFailure = `dkimFailure (\n${paginationArgs}\n){\n${pageInfoSelection}\n${edgeSelection}\n}\n`
            detailTables.push(dkimFailure)
          } else if (subField.name.value === 'dmarcFailure') {
            const {
              paginationArgs,
              pageInfoSelection,
              edgeSelection,
            } = generateDetailTableQuery(subField)
            dmarcFailure = `dmarcFailure (\n${paginationArgs}\n){\n${pageInfoSelection}\n${edgeSelection}\n}\n`
            detailTables.push(dmarcFailure)
          } else if (subField.name.value === 'fullPass') {
            const {
              paginationArgs,
              pageInfoSelection,
              edgeSelection,
            } = generateDetailTableQuery(subField)
            fullPass = `fullPass (\n${paginationArgs}\n){\n${pageInfoSelection}\n${edgeSelection}\n}\n`
            detailTables.push(fullPass)
          } else if (subField.name.value === 'spfFailure') {
            const {
              paginationArgs,
              pageInfoSelection,
              edgeSelection,
            } = generateDetailTableQuery(subField)
            spfFailure = `spfFailure (\n${paginationArgs}\n){\n${pageInfoSelection}\n${edgeSelection}\n}\n`
            detailTables.push(spfFailure)
          }
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
  )}\n){\n${startDateStr}\n${endDateStr}\n${categoryTotalsStr}\n${detailTablesStr}\n}\n}`

  let data
  try {
    data = await fetch(DMARC_REPORT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery }),
    }).then((response) => response.json())
  } catch (err) {
    console.error(`Fetch error occurred well trying to retrieve ${info.fieldName} from the dmarc-report-api, error: ${err}`)
    throw new Error(`Unable to retrieve ${info.fieldName} for domain: ${domain}.`)
  }

  return data
}

module.exports = {
  domainLoaderDmarcReport,
}
