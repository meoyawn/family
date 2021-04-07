import calculateSize from 'calculate-size';
import { ElkEdge, ElkLabel, ElkNode } from 'elkjs/lib/elk.bundled.js'

import { Family, FamilyTree, Person } from "./types";

const measuredLabel = (text: string): ElkLabel => (
  {
    text,
    ...calculateSize(text, {
      font: "Arial, sans-serif",
      fontSize: "16px",
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

const familyNode = ({ id }: Family): ElkNode => (
  {
    id,
    width: 24,
    height: 24,
    ports: [
      {
        id: `${id}.spouses`,
        width: 1,
        height: 1,
      },
      {
        id: `${id}.children`,
        width: 1,
        height: 1,
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
      'org.eclipse.elk.layered.nodePlacement.strategy': 'LINEAR_SEGMENTS',
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
