import { ElkEdge, ElkEdgeSection } from "elkjs/lib/elk.bundled";

export const sections = (edge: ElkEdge): ReadonlyArray<ElkEdgeSection> | undefined =>
  // @ts-ignore elk typing
  edge.sections

export const getPoints = (edge: ElkEdge): Array<number> | undefined =>
  sections(edge)?.reduce((arr, { startPoint: s, bendPoints, endPoint: e }) => {
    arr.push(s.x, s.y)
    bendPoints?.forEach(b => arr.push(b.x, b.y))
    arr.push(e.x, e.y)
    return arr
  }, Array<number>())
