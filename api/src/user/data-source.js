import { t } from '@lingui/macro'

import {
  loadMyTrackerByUserId,
  loadUserByKey,
  loadUserByUserName,
  loadUserConnectionsByUserId,
} from './loaders'

export class UserDataSource {
  constructor({ query, userKey, i18n, language, cleanseInput, transaction, collections }) {
    this._query = query
    this._userKey = userKey
    this._i18n = i18n
    this._transaction = transaction
    this._collections = collections
    this.byKey = loadUserByKey({ query, userKey, i18n })
    this.byUserName = loadUserByUserName({ query, userKey, i18n })
    this.myTrackerByUserId = loadMyTrackerByUserId({ query, userKey, i18n, language })
    this.connectionsByUserId = loadUserConnectionsByUserId({ query, userKey, cleanseInput, i18n })
  }

  async createTransaction() {
    return this._transaction(this._collections)
  }

  async isAdminForAnyOrg({ userId }) {
    let userAdmin
    try {
      userAdmin = await this._query`
        WITH users, affiliations
        FOR v, e IN 1..1 INBOUND ${userId} affiliations
          FILTER e.permission IN ["admin", "owner", "super_admin"]
          LIMIT 1
          RETURN e.permission
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${this._userKey} was seeing if they were an admin, err: ${err}`)
      throw new Error(this._i18n._(t`Unable to verify if user is an admin, please try again.`))
    }

    return userAdmin.count > 0
  }

  async isSuperAdmin({ userId }) {
    let userAdmin
    try {
      userAdmin = await this._query`
        WITH users, affiliations
        FOR v, e IN 1..1 INBOUND ${userId} affiliations
          FILTER e.permission == "super_admin"
          LIMIT 1
          RETURN e.permission
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${this._userKey} was seeing if they were a super admin, err: ${err}`,
      )
      throw new Error(this._i18n._(t`Unable to verify if user is a super admin, please try again.`))
    }

    return userAdmin.count > 0
  }

  async closeAccount({ userId }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH affiliations, organizations, users
          FOR v, e IN 1..1 INBOUND ${userId} affiliations
            REMOVE { _key: e._key } IN affiliations
            OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing users remaining affiliations when user: ${this._userKey} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.step(
        () => this._query`
          WITH users
          REMOVE PARSE_IDENTIFIER(${userId}).key
          IN users OPTIONS { waitForSync: true }
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when removing user: ${this._userKey} attempted to close account: ${userId}: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to close account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${this._userKey} attempted to close account: ${userId}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to close account. Please try again.`))
    }
  }

  async authenticateSuccess({ userKey, refreshInfo, loginDate, verifyEmail = false }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              tfaCode: null,
              refreshInfo: ${refreshInfo},
              lastLogin: ${loginDate}
            }
            UPDATE {
              tfaCode: null,
              refreshInfo: ${refreshInfo},
              lastLogin: ${loginDate}
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when clearing tfa code and setting refresh id for user: ${userKey} during authentication: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to authenticate. Please try again.`))
    }

    if (verifyEmail) {
      try {
        await trx.step(
          () => this._query`
            WITH users
            UPSERT { _key: ${userKey} }
              INSERT {
                emailValidated: true,
              }
              UPDATE {
                emailValidated: true,
              }
              IN users
          `,
        )
      } catch (err) {
        console.error(
          `Trx step error occurred when setting email validated to true for user: ${userKey} during authentication: ${err}`,
        )
        await trx.abort()
        throw new Error(this._i18n._(t`Unable to authenticate. Please try again.`))
      }
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${userKey} attempted to authenticate: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to authenticate. Please try again.`))
    }
  }

  async clearTfaCode({ userKey }) {
    const trx = await this._transaction(this._collections)
    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              tfaCode: null,
            }
            UPDATE {
              tfaCode: null,
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when clearing tfa code on attempt timeout for user: ${userKey} during authentication: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Incorrect TFA code. Please sign in again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${userKey} attempted to authenticate: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Incorrect TFA code. Please sign in again.`))
    }
  }

  async updateRefreshInfo({ userKey, refreshInfo }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT { refreshInfo: ${refreshInfo} }
            UPDATE { refreshInfo: ${refreshInfo} }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when attempting to refresh tokens for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to refresh tokens, please sign in.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${userKey} attempted to refresh tokens: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to refresh tokens, please sign in.`))
    }
  }

  async removePhoneNumber({ userKey, tfaSendMethod }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              phoneDetails: null,
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            UPDATE {
              phoneDetails: null,
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred well removing phone number for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove phone number. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred well removing phone number for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to remove phone number. Please try again.`))
    }
  }

  async resetPassword({ userKey, hashedPassword }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          FOR user IN users
            UPDATE ${userKey}
            WITH {
              password: ${hashedPassword},
              failedLoginAttempts: 0
            } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when user: ${userKey} attempted to reset their password: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to reset password. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${userKey} attempted to authenticate: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to reset password. Please try again.`))
    }
  }

  async setPhoneNumber({ userKey, tfaCode, phoneDetails, tfaSendMethod }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              tfaCode: ${tfaCode},
              phoneDetails: ${phoneDetails},
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            UPDATE {
              tfaCode: ${tfaCode},
              phoneDetails: ${phoneDetails},
              phoneValidated: false,
              tfaSendMethod: ${tfaSendMethod}
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred for user: ${userKey} when upserting phone number information: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to set phone number, please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred for user: ${userKey} when upserting phone number information: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to set phone number, please try again.`))
    }
  }

  async signInResetFailedLoginAttempts({ userKey, trx }) {
    try {
      await trx.step(
        () => this._query`
          WITH users
          FOR u IN users
            UPDATE ${userKey} WITH { failedLoginAttempts: 0 } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when resetting failed login attempts for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }
  }

  async signInSetTfaCodeAndRefreshInfo({ userKey, tfaCode, refreshInfo, trx }) {
    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              tfaCode: ${tfaCode},
              refreshInfo: ${refreshInfo}
            }
            UPDATE {
              tfaCode: ${tfaCode},
              refreshInfo: ${refreshInfo}
            }
            IN users
          `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when inserting TFA code for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }
  }

  async signInSetRefreshInfoAndLastLogin({ userKey, refreshInfo, loginDate, trx }) {
    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT { refreshInfo: ${refreshInfo}, lastLogin: ${loginDate} }
            UPDATE { refreshInfo: ${refreshInfo}, lastLogin: ${loginDate} }
            IN users
        `,
      )
    } catch (err) {
      console.error(
        `Trx step error occurred when attempting to setting refresh tokens for user: ${userKey} during sign in: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }
  }

  async signInIncrementFailedLoginAttempts({ userKey, failedLoginAttempts }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          FOR u IN users
            UPDATE ${userKey} WITH {
              failedLoginAttempts: ${failedLoginAttempts}
            } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when incrementing failed login attempts for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred while user: ${userKey} failed to sign in: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }
  }

  async commitSignInTransaction({ trx, userKey, type }) {
    try {
      await trx.commit()
    } catch (err) {
      const action = type === 'tfa' ? 'to tfa sign in' : 'a regular sign in'
      console.error(`Trx commit error occurred while user: ${userKey} attempted ${action}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign in, please try again.`))
    }
  }

  async insertUser({ user, userName }) {
    const trx = await this._transaction(this._collections)

    let insertedUserCursor
    try {
      insertedUserCursor = await trx.step(
        () => this._query`
          WITH users
          INSERT ${user} INTO users
          RETURN MERGE(
            {
              id: NEW._key,
              _type: "user"
            },
            NEW
          )
        `,
      )
    } catch (err) {
      console.error(`Transaction step error occurred while user: ${userName} attempted to sign up, creating user: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign up. Please try again.`))
    }

    let insertedUser
    try {
      insertedUser = await insertedUserCursor.next()
    } catch (err) {
      console.error(`Cursor error occurred while user: ${userName} attempted to sign up, creating user: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign up. Please try again.`))
    }

    return { trx, insertedUser }
  }

  async addAffiliation({ trx, orgId, userId, permission, userName }) {
    try {
      await trx.step(
        () => this._query`
          WITH affiliations, organizations, users
          INSERT {
            _from: ${orgId},
            _to: ${userId},
            permission: ${permission},
          } INTO affiliations
        `,
      )
    } catch (err) {
      console.error(
        `Transaction step error occurred while user: ${userName} attempted to sign up, assigning affiliation: ${err}`,
      )
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign up. Please try again.`))
    }
  }

  async commitSignUpTransaction({ trx, userName }) {
    try {
      await trx.commit()
    } catch (err) {
      console.error(`Transaction commit error occurred while user: ${userName} attempted to sign up: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to sign up. Please try again.`))
    }
  }

  async updatePassword({ userKey, hashedPassword }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          FOR user IN users
            UPDATE ${userKey} WITH { password: ${hashedPassword} } IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when user: ${userKey} attempted to update their password: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update password. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${userKey} attempted to update their password: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update password. Please try again.`))
    }
  }

  async updateProfile({ userKey, updatedUser }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT ${updatedUser}
            UPDATE ${updatedUser}
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when user: ${this._userKey} attempted to update their profile: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update profile. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when user: ${this._userKey} attempted to update their profile: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to update profile. Please try again.`))
    }
  }

  async verifyAccount({ userKey, newUserName }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT {
              emailValidated: true,
              userName: ${newUserName},
            }
            UPDATE {
              emailValidated: true,
              userName: ${newUserName},
            }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when upserting email validation for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to verify account. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when upserting email validation for user: ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to verify account. Please try again.`))
    }
  }

  async verifyPhoneNumber({ userKey }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH users
          UPSERT { _key: ${userKey} }
            INSERT { phoneValidated: true }
            UPDATE { phoneValidated: true }
            IN users
        `,
      )
    } catch (err) {
      console.error(`Trx step error occurred when upserting the tfaValidate field for ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to two factor authenticate. Please try again.`))
    }

    try {
      await trx.commit()
    } catch (err) {
      console.error(`Trx commit error occurred when upserting the tfaValidate field for ${userKey}: ${err}`)
      await trx.abort()
      throw new Error(this._i18n._(t`Unable to two factor authenticate. Please try again.`))
    }
  }

  async completeTour({ userKey, tourId }) {
    try {
      const completeTourCursor = await this._query`
        LET userCompleteTours = FIRST(
          FOR user IN users
            FILTER user._key == ${userKey}
            LIMIT 1
            RETURN user.completedTours
        )
        UPDATE { _key: ${userKey} }
        WITH {
          completedTours: APPEND(
            userCompleteTours[* FILTER CURRENT.tourId != ${tourId}],
            { tourId: ${tourId}, completedAt: DATE_ISO8601(DATE_NOW()) }
          )
        }
        IN users
      `
      await completeTourCursor.next()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} attempted to complete tour: ${tourId}: ${err}`)
      throw new Error(this._i18n._(t`Unable to confirm completion of the tour. Please try again.`))
    }
  }

  async dismissMessage({ userKey, messageId }) {
    try {
      const dismissMessageCursor = await this._query`
        LET userDismissedMessages = FIRST(
          FOR user IN users
            FILTER user._key == ${userKey}
            LIMIT 1
            RETURN user.dismissedMessages
        )
        UPDATE { _key: ${userKey} }
        WITH {
          dismissedMessages: APPEND(
            userDismissedMessages[* FILTER CURRENT.messageId != ${messageId}],
            { messageId: ${messageId}, dismissedAt: DATE_ISO8601(DATE_NOW()) }
          )
        }
        IN users
      `
      await dismissMessageCursor.next()
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} attempted to dismiss message: ${messageId}: ${err}`)
      throw new Error(this._i18n._(t`Unable to dismiss message. Please try again.`))
    }
  }
}
