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
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="mask-icon"
        href="/safari-pinned-tab.svg"
        color="#e65225"
      />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
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
