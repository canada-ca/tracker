const calculatePercentages = ({ fail, pass, passDkimOnly, passSpfOnly }) => {
  const total = [fail, pass, passDkimOnly, passSpfOnly].reduce(
    (a, b) => a + b,
    0,
  )

  return {
    fail: fail <= 0 ? 0 : Number(((fail / total) * 100).toFixed(1)),
    pass: pass <= 0 ? 0 : Number(((pass / total) * 100).toFixed(1)),
    passDkimOnly:
      passDkimOnly <= 0 ? 0 : Number(((passDkimOnly / total) * 100).toFixed(1)),
    passSpfOnly:
      passSpfOnly <= 0 ? 0 : Number(((passSpfOnly / total) * 100).toFixed(1)),
  }
}

module.exports = {
  calculatePercentages,
}
