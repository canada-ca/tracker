export const differenceInTime = (start, end) => {
  if (start >= end) throw new Error('Start time is after end time!')
  const diff = end - start
  return {
    hours: Math.floor(diff / 360000),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    milliseconds: Math.floor(diff % 1000),
    days: Math.floor(diff / 86400000),
  }
}
