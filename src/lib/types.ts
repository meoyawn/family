import * as Y from 'yjs'
import ELK, { ElkEdge, ElkNode } from 'elkjs/lib/elk.bundled.js'

export const elk = new ELK()

type FamilyID = string
type PersonID = string

export interface Person {
  id: PersonID
  name: string
  families: FamilyID[]
}

export interface Family {
  id: FamilyID
  name: string
  children: PersonID[]
}

export interface Doc {
  people: Y.Map<Person>
  families: Y.Map<Family>
}

const personNode = ({ id, name }: Person): ElkNode => (
  {
    id,
    labels: [{
      id: name,
      text: name,
    }],
    layoutOptions: {
      'org.eclipse.elk.nodeLabels.placement': 'INSIDE H_CENTER V_CENTER',
      'org.eclipse.elk.nodeSize.constraints': 'PORTS PORT_LABELS NODE_LABELS MINIMUM_SIZE',
    },
  }
)

const personEdges = ({ id, families }: Person): ElkEdge[] =>
  families.map(fid => ({
    id: `${id}:${fid}`,
    sources: [id],
    targets: [fid],
    type: 'UNDIRECTED',
  }))

const familyNode = ({ id }: Family): ElkNode => (
  {
    id,
    width: 1,µ
    height: 1,
  }
)

const familyEdges = ({ id, children }: Family): ElkEdge[] =>
  children.map(cid => ({
    id: `${id}:${cid}`,
    sources: [id],
    targets: [cid],
    type: 'UNDIRECTED',
  }))

const toELK = ({ people, families }: Doc): ElkNode => {
  const root: ElkNode = {
    id: 'root',
    children: [],
    edges: [],
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
