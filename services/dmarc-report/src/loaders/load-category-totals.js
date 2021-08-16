const loadCategoryTotals =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get category totals
    const { resources } = await container.items
      .query({
        query: `
          SELECT 
            c.category_totals.pass AS pass,
            c.category_totals.fail AS fail,
            c.category_totals['pass-dkim-only'] AS passDkimOnly,
            c.category_totals['pass-spf-only'] AS passSpfOnly
          FROM c 
          WHERE c.domain = @domain 
          AND c.id = @date
        `,
        parameters: [
          { name: '@domain', value: domain },
          { name: '@date', value: String(date) },
        ],
      })
      .fetchAll()

    if (typeof resources[0] === 'undefined') {
      return {
        pass: 0,
        fail: 0,
        passDkimOnly: 0,
        passSpfOnly: 0,
      }
    } else {
      return resources[0]
    }
  }

module.exports = {
  loadCategoryTotals,
}
