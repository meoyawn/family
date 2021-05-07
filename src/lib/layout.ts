import { ElkEdge, ElkLabel, ElkNode } from 'elkjs/lib/elk.bundled.js'

import { Family, FamilyTree, Person } from "../app/types";
import { measureText } from "./text";
import { FONT_SIZE, LINE_HEIGHT } from "../app/font";

type EdgeRouting =
  | 'UNDEFINED'
  | 'POLYLINE'
  | 'ORTHOGONAL'
  | 'SPLINES'

type NodePlacementStrategy =
  | 'SIMPLE'
  | 'INTERACTIVE'
  | 'LINEAR_SEGMENTS'
  | 'BRANDES_KOEPF'
  | 'NETWORK_SIMPLEX'

type CycleBreakingStrategy =
  | "GREEDY"
  | "DEPTH_FIRST"
  | "INTERACTIVE"

const EDGE_ROUTING: EdgeRouting = "POLYLINE"
const NODE_PLACEMENT_STRATEGY: NodePlacementStrategy = "LINEAR_SEGMENTS"
const CYCLE_BREAKING_STRATEGY: CycleBreakingStrategy = "GREEDY"

const measuredLabel = (text: string): ElkLabel => (
  {
    text,
    ...measureText(text, {
      fontSize: `${FONT_SIZE}px`,
      lineHeight: `${LINE_HEIGHT}`,
    }),
  } as ElkLabel
)

const personNode = ({ id, name, birthYear, deathYear }: Person): ElkNode => {
  const labels = [measuredLabel(name)]

  if (birthYear) {
    labels.push(measuredLabel(`${birthYear} - ${deathYear}`))
  }

  return (
    {
      id,
      labels,
      layoutOptions: {
        'org.eclipse.elk.nodeLabels.placement': 'INSIDE H_CENTER V_CENTER',
        'org.eclipse.elk.nodeSize.constraints': 'PORTS PORT_LABELS NODE_LABELS MINIMUM_SIZE',
      },
    }
  )
}

const personEdges = ({ id, marriages }: Person): ElkEdge[] =>
  marriages.map(fid => ({
    id: `${id}:${fid}`,
    sources: [id],
    targets: [`${fid}.spouses`],
  }))

const smol = 0.000000001

const familyNode = ({ id }: Family): ElkNode => (
  {
    id,
    width: smol,
    height: smol,
    ports: [
      {
        id: `${id}.spouses`,
        width: smol,
        height: smol,
      },
      {
        id: `${id}.children`,
        width: smol,
        height: smol,
      },
    ]
  }
)

const familyEdges = ({ id, children }: Family): ElkEdge[] =>
  children.map(cid => ({
    id: `${id}:${cid}`,
    sources: [`${id}.children`],
    targets: [cid],
  }))

export const toELK = ({ people, families }: FamilyTree): ElkNode => {

  const root: ElkNode = {
    id: 'root',
    children: [],
    edges: [],
    layoutOptions: {
      'org.eclipse.elk.direction': "DOWN",
      'org.eclipse.elk.layered.nodePlacement.strategy': NODE_PLACEMENT_STRATEGY,
    },
  }

  people.forEach(p => {
    root.children?.push(personNode(p))
    root.edges?.push(...personEdges(p))
  })

  families.forEach(f => {
    root.children?.push(familyNode(f))
    root.edges?.push(...familyEdges(f))
  })

  return root
}
