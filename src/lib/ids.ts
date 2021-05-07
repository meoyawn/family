export const genID = (prefix: string): string => {
  const neverZero = Date.now() + Math.random()
  return prefix + neverZero.toString(36).replace(".", "")
}
