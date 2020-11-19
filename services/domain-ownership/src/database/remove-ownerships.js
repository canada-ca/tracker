const removeOwnerships = async ({ query }) => {
  console.info('Removing current ownerships ...')
  try {
    await query`
      FOR item IN ownership
        REMOVE item IN ownership
    `
  } catch (err) {
    console.error(`Error occurred while removing current ownerships: ${err}`)
  }
}

module.exports = {
  removeOwnerships,
}
