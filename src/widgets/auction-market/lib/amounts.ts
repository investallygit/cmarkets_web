/** AUC writes the amounts, held in millions of XAF, in billions with one decimal ("20.0"). */
export function billions(millions: number): number {
  return millions / 1000
}
