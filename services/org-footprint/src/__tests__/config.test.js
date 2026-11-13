const { buildConfig, ConfigError } = require('../../config')

const FAKE_DB_PASS = 'fake-db-pass-9f3a1c'
const FAKE_API_KEY = 'fake-api-key-7b2e5d'

const validEnv = () => ({
  NODE_ENV: 'test',
  DB_PASS: FAKE_DB_PASS,
  DB_URL: 'http://db.example:8529',
  DB_NAME: 'tracker-db',
  NOTIFICATION_API_KEY: FAKE_API_KEY,
  NOTIFICATION_API_URL: 'http://notify.example',
  NOTIFICATION_PENDING_USERS: 'tpl-pending',
  NOTIFICATION_ORG_FOOTPRINT_BILINGUAL: 'tpl-footprint',
  NOTIFICATION_NEW_CVD_ENROLLMENTS: 'tpl-cvd',
  SERVICE_ACCOUNT_EMAIL: 'svc@gc.ca',
})

const without = (env, ...names) => Object.fromEntries(Object.entries(env).filter(([k]) => !names.includes(k)))

describe('buildConfig', () => {
  it('maps a full valid env to nested config keys', () => {
    expect(buildConfig(validEnv())).toEqual({
      nodeEnv: 'test',
      logLevel: 'info',
      serviceAccount: 'svc@gc.ca',
      redirect: false,
      logTimeWindow: 86400000,
      db: { rootPassword: FAKE_DB_PASS, url: 'http://db.example:8529', name: 'tracker-db' },
      notify: {
        apiKey: FAKE_API_KEY,
        apiUrl: 'http://notify.example',
        adminLink: 'https://tracker.canada.ca/admin/organizations',
        templates: { pendingUsers: 'tpl-pending', orgFootprint: 'tpl-footprint', cvdEnrollment: 'tpl-cvd' },
      },
    })
  })

  it('defaults logLevel to info and honours LOG_LEVEL when set', () => {
    expect(buildConfig(validEnv()).logLevel).toBe('info')
    expect(buildConfig({ ...validEnv(), LOG_LEVEL: 'debug' }).logLevel).toBe('debug')
  })

  it('uses NOTIFICATION_ADMIN_LINK when set', () => {
    const config = buildConfig({ ...validEnv(), NOTIFICATION_ADMIN_LINK: 'https://example.test/admin' })

    expect(config.notify.adminLink).toBe('https://example.test/admin')
  })

  it.each([
    ['"true"', 'true', true],
    ['"TRUE"', 'TRUE', true],
    ['"false"', 'false', false],
    ['empty string', '', false],
    ['unset', undefined, false],
  ])('parses redirect from %s', (_name, value, expected) => {
    const env = { ...validEnv(), REDIRECT_TO_SERVICE_ACCOUNT_EMAIL: value }

    expect(buildConfig(env).redirect).toBe(expected)
  })

  describe('required variables', () => {
    it.each([
      'DB_URL',
      'DB_NAME',
      'NOTIFICATION_API_KEY',
      'NOTIFICATION_API_URL',
      'NOTIFICATION_PENDING_USERS',
      'NOTIFICATION_ORG_FOOTPRINT_BILINGUAL',
      'NOTIFICATION_NEW_CVD_ENROLLMENTS',
      'SERVICE_ACCOUNT_EMAIL',
    ])(
      'throws naming %s when it is missing',
      (name) => {
        expect(() => buildConfig(without(validEnv(), name))).toThrow(
          new RegExp(`Missing required config: .*${name}`),
        )
      },
    )

    it('lists every missing variable in one error', () => {
      const env = without(validEnv(), 'DB_URL', 'NOTIFICATION_API_KEY')

      expect(() => buildConfig(env)).toThrow(/Missing required config: DB_URL, NOTIFICATION_API_KEY$/)
    })

    it('treats an empty string as missing', () => {
      expect(() => buildConfig({ ...validEnv(), DB_NAME: '' })).toThrow(/Missing required config: DB_NAME$/)
    })

    it('does not leak secret values in the error message', () => {
      const secret = 'distinctive-secret-value-4d8c1e'
      const env = { ...without(validEnv(), 'DB_URL'), DB_PASS: secret, NOTIFICATION_API_KEY: secret }

      expect(() => buildConfig(env)).toThrow(/Missing required config: DB_URL/)
      expect(() => buildConfig(env)).not.toThrow(new RegExp(secret))
    })

    it('throws a ConfigError named ConfigError', () => {
      let thrown
      try {
        buildConfig(without(validEnv(), 'DB_URL'))
      } catch (error) {
        thrown = error
      }

      expect(thrown).toBeInstanceOf(ConfigError)
      expect(thrown.name).toBe('ConfigError')
    })
  })
})
