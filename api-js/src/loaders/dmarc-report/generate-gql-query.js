const generateGqlQuery = ({ generateDetailTableFields }) => ({
  info,
  domain,
}) => {
  const detailTables = []
  let categoryTotalsStr = ''
  let detailTablesStr = ''
  let startEndDateStr = ''

  if (typeof info.fieldNodes !== 'undefined') {
    if (info.fieldNodes.length > 0) {
      info.fieldNodes[0].selectionSet.selections.forEach((field) => {
        if (field.name.value === 'month' || field.name.value === 'year') {
          startEndDateStr = 'startDate\nendDate\n'
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
              } = generateDetailTableFields({ subField })
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

      if (typeof info.fieldNodes[0].arguments !== 'undefined') {
        if (info.fieldNodes[0].arguments.length > 0) {
          info.fieldNodes[0].arguments.forEach((arg) => {
            if (arg.value.kind === 'StringValue') {
              queryArgs.push(`${arg.name.value}: "${arg.value.value}"`)
            } else {
              queryArgs.push(`${arg.name.value}: ${arg.value.value}`)
            }
          })
        }
      }

      if (typeof domain !== 'undefined') {
        queryArgs.push(`domain: "${domain}"`)
      }

      const gqlQuery = `{\n${info.fieldName}(\n${queryArgs.join(
        '\n',
      )}\n){\n${startEndDateStr}\n${categoryTotalsStr}\n${detailTablesStr}\n}\n}`

      return gqlQuery
    } else {
      return null
    }
  } else {
    return null
  }
}

module.exports = {
  generateGqlQuery,
}
