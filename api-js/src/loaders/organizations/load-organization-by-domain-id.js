const DataLoader = require('dataloader')

module.exports.orgLoaderByDomainId = (query, language) => 
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
      FOR id IN ${ids}
        LET orgId = (FOR v, e IN 1..1 ANY id claims RETURN e._from )
        FOR org IN organizations
          FILTER orgId
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.log(err)
    }
    const key = await cursor.next()
    console.log(key)
})
