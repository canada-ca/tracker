const { NotifyClient } = require('notifications-node-client')

const { NOTIFICATION_API_KEY, NOTIFICATION_API_URL } = process.env

const notifyClient = new NotifyClient(
  NOTIFICATION_API_URL,
  NOTIFICATION_API_KEY,
)

module.exports = {
  notifyClient,
}
