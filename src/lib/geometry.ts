export type PointTuple = [x: number, y: number]

export interface RectObj {
  x: number
  y: number
  width: number
  height: number
}

export interface PointObj {
  x: number
  y: number
}

export const subtract = ([x1, y1]: PointTuple, [x2, y2]: PointTuple): PointTuple =>
  [x2 - x1, y2 - y1]

export const expand = ({ x, y, width, height }: RectObj, by: number): RectObj => (
  {
    x: x - by / 2,
    y: y - by / 2,
    width: width + by,
    height: height + by,
  }
)

export const subtractObj = (what: PointObj, from: PointObj): PointObj => (
  {
    x: from.x - what.x,
    y: from.y - what.y,
  }
)

export const addObj = (p2: PointObj, p1: PointObj): PointObj => (
  {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
  }
)

export const pushFlat = (arr: number[], { x, y }: PointObj) => {
  arr.push(x, y)
}

const between = (x: number, a: number, b: number): boolean =>
  x > a && x < b

export const contains = ({ x, y, width, height }: RectObj, [px, py]: PointTuple): boolean =>
  between(px, x, x + width) && between(py, y, y + height)

export const containsObj = ({ x, y, width, height }: RectObj, p: PointObj): boolean =>
  between(p.x, x, x + width) && between(p.y, y, y + height)

export const rectArea = ({ width, height }: RectObj): number =>
  width * height

export const middle = ({ height, width, x, y }: RectObj): PointObj => (
  {
    x: x + width / 2,
    y: y + height / 2
  }
)

export const topRight = ({ width, x, y }: RectObj): PointObj => (
  {
    x: x + width,
    y: y,
  }
)
