// Reduce the precision of a GPS coordinate before it is stored or shown.
// Three decimal places corresponds to roughly a 110 m grid, which keeps an
// event locatable to a work area without pinpointing an individual — a data
// minimization measure for location data.
export function reduceGeoPrecision(n: number, decimals = 3): number {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}
