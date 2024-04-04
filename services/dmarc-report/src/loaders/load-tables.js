const { mapGuidance, calculatePercentages } = require('../utils')
const loadTables = async ({
  loadCategoryTotals,
  loadDkimFailureTable,
  loadDmarcFailureTable,
  loadFullPassTable,
  loadSpfFailureTable,
  domain,
  date,
}) => {
  const cosmosDate = date === 'thirtyDays' ? 'thirty_days' : date

  const [
    { resources: categoryTotalResources },
    { resources: dkimFailureResources },
    { resources: dmarcFailureResources },
    { resources: fullPassResources },
    { resources: spfFailureResources },
  ] = await Promise.all([
    loadCategoryTotals({ domain, date: cosmosDate }),
    loadDkimFailureTable({ domain, date: cosmosDate }),
    loadDmarcFailureTable({ domain, date: cosmosDate }),
    loadFullPassTable({ domain, date: cosmosDate }),
    loadSpfFailureTable({ domain, date: cosmosDate }),
  ])

  let categoryTotals
  if (typeof categoryTotalResources[0] === 'undefined') {
    categoryTotals = {
      pass: 0,
      fail: 0,
      passDkimOnly: 0,
      passSpfOnly: 0,
    }
  } else {
    categoryTotals = categoryTotalResources[0]
  }

  const dkimFailureTable = dkimFailureResources.map((data) => {
    data.guidance = mapGuidance(data.guidance)
    return data
  })

  const dmarcFailureTable = dmarcFailureResources
  const fullPassTable = fullPassResources
  const spfFailureTable = spfFailureResources

  const categoryPercentages = calculatePercentages({ ...categoryTotals })

  return {
    categoryTotals,
    dkimFailureTable,
    dmarcFailureTable,
    fullPassTable,
    spfFailureTable,
    categoryPercentages,
  }
}

module.exports = {
  loadTables,
}
