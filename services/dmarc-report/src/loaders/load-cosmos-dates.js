const loadCosmosDates =
  ({ container }) =>
  async () => {
    // Get date range failure
    const { resources } = await container.items
      .query({
        query: `
          SELECT DISTINCT VALUE c.id 
          FROM c 
          WHERE c.id != "thirty_days"
        `,
      })
      .fetchAll()

    return resources.sort()
  }

module.exports = {
  loadCosmosDates,
}
