const loadCategoryTotals =
  ({ container }) =>
  async ({ domain, date }) => {
    // Get category totals
    return container.items
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
  }

module.exports = {
  loadCategoryTotals,
}
