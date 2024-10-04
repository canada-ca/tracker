// From: https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part1.html
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi

/** A pattern that matches safe data URLs. It only matches image, video, and audio types. */
const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i

function _sanitizeUrl(url) {
  url = String(url)
  if (url === 'null' || url.length === 0 || url === 'about:blank')
    return 'about:blank'
  if (url.match(SAFE_URL_PATTERN) || url.match(DATA_URL_PATTERN)) return url

  return `unsafe:${url}`
}

export function sanitizeUrl(url = 'about:blank') {
  return _sanitizeUrl(String(url).trim())
}
