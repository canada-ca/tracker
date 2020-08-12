const DataLoader = require('dataloader')

module.exports.orgLoaderByDomainId = (query, language) => 
  new DataLoader(async (ids) => {
    let cursor
    
    try {
      cursor = await query`
      FOR id IN ${ids}
        LET orgIds = (FOR v, e IN 1..1 ANY id claims RETURN { _from: e._from, _to: e._to })
        FOR orgId IN orgIds
          LET org = DOCUMENT(orgId._from)
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, _to: orgId._to }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(`Database error occurred while running orgLoaderByDomainId: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org._to] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred during orgLoaderByDomainId: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    return ids.map((id) =>  {
      const org = orgMap[id]
      delete org._to
      return org
    })
})
