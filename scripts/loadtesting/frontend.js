import { check } from 'k6'
import http from 'k6/http'

export default function () {
  let res = http.get('https://tracker.alpha.canada.ca')
  check(res, {
    'is status 200': (r) => r.status === 200,
    'body size is 1239 bytes': (r) => {
      if (r.body && r.body.length) {
        return r.body.length == 1239
      } else {
        return false
      }
    },
  })
}
