import {NotifyClient} from 'notifications-node-client'

const {NOTIFICATION_API_KEY, NOTIFICATION_API_URL} = process.env

export const notifyClient = new NotifyClient(
  NOTIFICATION_API_URL,
  NOTIFICATION_API_KEY,
)
