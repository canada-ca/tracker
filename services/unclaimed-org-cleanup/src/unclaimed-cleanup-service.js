const { UNCLAIMED_ORG_ID } = process.env

const unclaimedCleanupService = async ({ query, log }) => {
  console.log('unclaimedCleanupService')

  // get domains in unclaimed org

  // for domain in unclaimed org
  // get length of domain claims
  // if length > 1, delete claim to unclaimed org
}

module.exports = {
  unclaimedCleanupService,
}
