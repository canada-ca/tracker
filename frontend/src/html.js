import './images/apple-touch-icon.png'
import './images/android-chrome-192x192.png'
import './images/android-chrome-512x512.png'
import './images/favicon.ico'
import './images/favicon-32x32.png'
import './images/favicon-16x16.png'
import './images/logo192.png'
import './images/logo512.png'
import './manifest.json'
import './robots.txt'

export default () => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />

      <meta http-equiv="Pragma" content="no-cache" />
      <meta http-equiv="Cache-control" content="no-cache, no-store, must-revalidate" />

      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="images/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="images/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="images/favicon-16x16.png"
      />
      <link
        rel="mask-icon"
        href="images/safari-pinned-tab.svg"
        color="#e65225"
      />
      <link rel="shortcut icon" href="images/favicon.ico" />
      <link rel="manifest" href="manifest.json" />
      <meta name="msapplication-TileColor" content="#2e2e40" />
      <meta name="msapplication-config" content="./browserconfig.xml" />
      <meta name="theme-color" content="#ff0000" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta
        name="description"
        content="Tracking security best practices for the Government of Canada"
      />
      <title>Tracker</title>
    </head>
    <body>
      <div id="root"></div>
      <noscript>
        <h1>Application error</h1>
        <p>
          The JavaScript application you are accessing requires JavaScript to be
          enabled to run.
        </p>
      </noscript>
    </body>
  </html>
`
