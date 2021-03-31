import * as Y from "yjs";

export const mapValues = <T, R>(m: Y.Map<T>, f: (x: T) => R): ReadonlyArray<R> => {
  const ret = Array<R>(m.size)

  m.forEach(x => ret.push(f(x)))

  return ret
}
