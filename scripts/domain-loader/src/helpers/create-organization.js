const createOrganization = async ({ slugify, data, key, trx, query }) => {
  console.info(`\tCreating domain: ${data[key].acronym_en}.`)

  const orgStruct = {
    verified: true,
    summaries: {
      web: {
        pass: 0,
        fail: 0,
        total: 0,
      },
      mail: {
        pass: 0,
        fail: 0,
        total: 0,
      },
    },
    orgDetails: {
      en: {
        slug: slugify(data[key].organization_en),
        acronym: data[key].acronym_en,
        name: data[key].organization_en,
        zone: 'FED',
        sector: 'TBS',
        country: 'Canada',
        province: 'Ontario',
        city: 'Ottawa',
      },
      fr: {
        slug: slugify(data[key].organization_fr),
        acronym: data[key].acronym_fr,
        name: data[key].organization_fr,
        zone: 'FED',
        sector: 'TBS',
        country: 'Canada',
        province: 'Ontario',
        city: 'Ottawa',
      },
    },
  }

  const orgCursor = await trx.step(
    () => query`
      WITH organizations, domains, claims
      INSERT ${orgStruct} INTO organizations
      RETURN NEW
    `,
  )

  const org = await orgCursor.next()

  return org
}

module.exports = {
  createOrganization,
}
