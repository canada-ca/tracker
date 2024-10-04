import net from 'net'

export function isListening({ host, port }) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port })
    socket.once('error', () => {
      reject(false) // eslint-disable-line prefer-promise-reject-errors
    })

    socket.once('connect', function () {
      socket.end()
      resolve(true)
    })
  })
}
