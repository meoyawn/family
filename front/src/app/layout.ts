import { ElkEdge, ElkLabel, ElkNode } from 'elkjs/lib/elk-api'

import { FamilyTree, Parents, ParentsID, Person } from "./types";
import { measureText } from "../lib/text";
import { FONT_SIZE, LINE_HEIGHT } from "./font";

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

type Direction =
  | "DOWN"
  | "RIGHT"

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

const personEdges = ({ id, fid }: Person): ElkEdge[] =>
  fid
    ? [
      {
        id: `${fid}:${id}`,
        sources: [children(fid)],
        targets: [id],
      } as ElkEdge
    ]
    : []

const smol = 0.000000001

const familyNode = ({ id }: Parents): ElkNode => (
  {
    id,
    width: smol,
    height: smol,
    ports: [
      {
        id: spouses(id),
        width: smol,
        height: smol,
      },
      {
        id: children(id),
        width: smol,
        height: smol,
      },
    ]
  }
)

const spouses = (id: ParentsID) => `${id}.spouses`
const children = (id: ParentsID) => `${id}.children`

const familyEdges = ({ id, p1, p2 }: Parents): ElkEdge[] =>
  [
    {
      id: `${p1}:${id}`,
      sources: [p1],
      targets: [spouses(id)],
    } as ElkEdge,
    {
      id: `${p2}:${id}`,
      sources: [p2],
      targets: [spouses(id)],
    } as ElkEdge
  ]

const DIRECTION: Direction = "DOWN"
const EDGE_ROUTING: EdgeRouting = "ORTHOGONAL"
const NODE_PLACEMENT_STRATEGY: NodePlacementStrategy = "LINEAR_SEGMENTS"
const CYCLE_BREAKING_STRATEGY: CycleBreakingStrategy = "DEPTH_FIRST"

export const toELK = ({ people, families }: FamilyTree): ElkNode => {

  const root: ElkNode = {
    id: 'root',
    children: [],
    edges: [],
    layoutOptions: {
      'org.eclipse.elk.direction': DIRECTION,
      'org.eclipse.elk.layered.nodePlacement.strategy': NODE_PLACEMENT_STRATEGY,
      'org.eclipse.elk.edgeRouting': EDGE_ROUTING,
      'org.eclipse.elk.layered.cycleBreaking.strategy': CYCLE_BREAKING_STRATEGY,
      // 'org.eclipse.elk.layered.spacing.baseValue': '20',
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

  // console.log(JSON.stringify(root, null, 2))

  return root
}
