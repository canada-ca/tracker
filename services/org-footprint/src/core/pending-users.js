/**
 * Builds the pending users email payload for one org admin.
 * @param {{user: {displayName: string}, orgNames: {en: string, fr: string}, adminLink: string}} params
 *   The recipient, bilingual org names, and link to the admin page.
 * @returns {{display_name: string, organization_name_en: string, organization_name_fr: string, admin_link: string}}
 *   The template personalisation values.
 * @throws {TypeError} If `user` or `orgNames` is missing.
 */
const buildPendingUsersPayload = ({ user, orgNames, adminLink }) => ({
  display_name: user.displayName,
  organization_name_en: orgNames.en,
  organization_name_fr: orgNames.fr,
  admin_link: adminLink,
})

module.exports = { buildPendingUsersPayload }
