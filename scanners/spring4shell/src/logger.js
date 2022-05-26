export const logger = {
  error: (message) =>
    console.log({
      severity: 'ERROR',
      time: new Date().toISOString(),
      message,
    }),
  info: (message) =>
    console.log({
      severity: 'INFO',
      time: new Date().toISOString(),
      message,
    }),
}

