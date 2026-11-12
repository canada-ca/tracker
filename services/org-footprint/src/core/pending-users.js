const buildPendingUsersPayload = ({ user, orgNames, adminLink }) => ({
  display_name: user.displayName,
  organization_name_en: orgNames.en,
  organization_name_fr: orgNames.fr,
  admin_link: adminLink,
})

module.exports = { buildPendingUsersPayload }
