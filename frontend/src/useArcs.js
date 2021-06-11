import { arc as Arc, pie as Pie } from 'd3'

export function useArcs({
  innerRadius,
  outerRadius,
  data,
  padAngle = 0,
  valueAccessor = (d) => d,
}) {
  const pie = Pie().value(valueAccessor).sort(null)(data)
  const arc = Arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .padAngle(padAngle)

  return pie.map((slice, index) => {
    const datum = data[index]
    if (!isNaN(parseFloat(datum)) && isFinite(datum)) {
      return {
        value: datum,
        d: arc(slice),
      }
    } else {
      return {
        ...datum,
        d: arc(slice),
      }
    }
  })
}
