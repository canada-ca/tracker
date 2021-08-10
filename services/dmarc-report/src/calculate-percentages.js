const calculatePercentages = ({ fail, pass, passDkimOnly, passSpfOnly }) => {
  const total = [fail, pass, passDkimOnly, passSpfOnly].reduce(
    (a, b) => a + b,
    0,
  )

  // calculate base percentages
  const failPercentage = fail <= 0 ? 0 : Number((fail / total) * 100)

  const passPercentage = pass <= 0 ? 0 : Number((pass / total) * 100)

  const passDkimOnlyPercentage =
    passDkimOnly <= 0 ? 0 : Number((passDkimOnly / total) * 100)

  const passSpfOnlyPercentage =
    passSpfOnly <= 0 ? 0 : Number((passSpfOnly / total) * 100)

  const percentages = [
    failPercentage,
    passPercentage,
    passDkimOnlyPercentage,
    passSpfOnlyPercentage,
  ]

  // do a basic rounding of all percentages
  const rounded = percentages.map((x) => Math.floor(x))

  // get the sum of the current rounded percentages
  const afterRoundSum = rounded.reduce((pre, curr) => pre + curr, 0)

  // get the amount of numbers larger or equal to 1
  const countMutableItems = rounded.filter((x) => x >= 1).length

  // get the current error rate based off of the expected total and calculated total
  const errorRate = 100 - afterRoundSum

  // calculate the amount needed to subtract from the rounded percentages
  const deductPortion = Math.ceil(errorRate / countMutableItems)

  // sort the rounded percentages in desc order
  const biggest = [...rounded]
    .sort((a, b) => b - a)
    .slice(0, Math.min(Math.abs(errorRate), countMutableItems))

  // get the modified percentages
  const [
    calculatedFailPercentage,
    calculatedPassPercentage,
    calculatedPassDkimOnlyPercentage,
    calculatedPassSpfOnlyPercentage,
  ] = rounded.map((x) => {
    // get the index of the current percentage
    const indexOfX = biggest.indexOf(x)
    // if its not the largest index
    if (indexOfX >= 0) {
      // subtract the calculated amount based off of error rate
      x += deductPortion
      // remove modified value from array
      biggest.splice(indexOfX, 1)
      // return modified value
      return x
    }
    // return current value
    return x
  })

  return {
    totalMessages: total,
    percentages: {
      fail: calculatedFailPercentage,
      pass: calculatedPassPercentage,
      passDkimOnly: calculatedPassDkimOnlyPercentage,
      passSpfOnly: calculatedPassSpfOnlyPercentage,
    },
  }
}

module.exports = {
  calculatePercentages,
}
