import { ElkEdge, ElkEdgeSection, ElkNode } from "elkjs/lib/elk.bundled";

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