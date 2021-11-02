const removeEdges = async ({
  db,
  direction,
  vertexSelectorId,
  edgeCollection,
  removeVertices = false,
  vertexCollection,
}) => {
  // remove vertices
  if (removeVertices) {
    const params = { vertexSelectorId, edgeCollection }
    await (
      await db.query(
        `
        FOR v, e IN 1..1 ${direction} @vertexSelectorId @edgeCollection
          REMOVE e IN ${edgeCollection}
          REMOVE v IN ${vertexCollection}
      `,
        params,
      )
    ).all()

    return
  }

  // don't remove vertices
  const params = { vertexSelectorId, edgeCollection }
  await (
    await db.query(
      `
      FOR v, e IN 1..1 ${direction} @vertexSelectorId @edgeCollection
        REMOVE e IN ${edgeCollection}
  `,
      params,
    )
  ).all()
}

module.exports = {
  removeEdges,
}
