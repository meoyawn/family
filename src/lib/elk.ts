import { ElkEdge, ElkEdgeSection, ElkNode } from "elkjs/lib/elk-api";

export const sections = (edge: ElkEdge): ReadonlyArray<ElkEdgeSection> | undefined =>
  // @ts-ignore elk typing
  edge.sections

export const getPoints = (edge: ElkEdge): Array<number> | undefined =>
  sections(edge)?.reduce((arr, { startPoint, bendPoints, endPoint }) => {
    arr.push(startPoint.x, startPoint.y)
    bendPoints?.forEach(b => arr.push(b.x, b.y))
    arr.push(endPoint.x, endPoint.y)
    return arr
  }, Array<number>())

export const mkEdge = (id: string, [x1, y1, x2, y2]: number[]): ElkEdge => {

  const section: ElkEdgeSection = {
    id: "",
    startPoint: { x: x1, y: y1 },
    endPoint: { x: x2, y: y2 },
  }

  return {
    id,
    // @ts-ignore sections
    sections: [section],
  }
}

export const elkBFS = (root: ElkNode, what: string): ElkNode | undefined => {
  const queue = [root]

  for (; ;) {
    const node = queue.shift()
    if (!node) {
      return undefined
    }

    const { id, children } = node

    if (id === what) {
      return node
    }

    if (children) {
      for (const child of children) {
        queue.push(child)
      }
    }
  }
}
