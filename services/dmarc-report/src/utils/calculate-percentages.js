const calculatePercentages = ({ fail, pass, passDkimOnly, passSpfOnly }) => {
  const total = [fail, pass, passDkimOnly, passSpfOnly].reduce(
    (a, b) => a + b,
    0,
  )

  // calculate base percentages
  const failPercentage = Number(
    fail <= 0 ? 0 : Number((fail / total) * 100).toFixed(1),
  )

  const passPercentage = Number(
    pass <= 0 ? 0 : Number((pass / total) * 100).toFixed(1),
  )

  const passDkimOnlyPercentage = Number(
    passDkimOnly <= 0 ? 0 : Number((passDkimOnly / total) * 100).toFixed(1),
  )

  const passSpfOnlyPercentage = Number(
    passSpfOnly <= 0 ? 0 : Number((passSpfOnly / total) * 100).toFixed(1),
  )

  return {
    totalMessages: total,
    categoryPercentages: {
      fail: failPercentage,
      pass: passPercentage,
      passDkimOnly: passDkimOnlyPercentage,
      passSpfOnly: passSpfOnlyPercentage,
    },
  }
}

module.exports = {
  calculatePercentages,
}
