const createSuperAdminAffiliation = async ({ collections, org, admin }) => {
  let affiliation
  try {
    affiliation = await collections.affiliations.save({
      _from: org._id,
      _to: admin._id,
      permission: 'super_admin',
      defaultSA: true,
    })
  } catch (err) {
    throw new Error(
      `Database error occurred while creating new super admin affiliation: ${err}`,
    )
  }

  return affiliation
}

module.exports = {
  createSuperAdminAffiliation,
}
