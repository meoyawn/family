import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb"
import { animated, Interpolation, to, useSpring } from "react-spring"
import ELK, { ElkEdge, ElkEdgeSection, ElkLabel, ElkNode, ElkPoint } from "elkjs/lib/elk.bundled.js"
import { ArrowOptions, getBoxToBoxArrow } from "perfect-arrows"
import { atom, useAtom } from "jotai"
import { line } from "d3-shape";
import { interpolatePath } from "d3-interpolate-path"
import { zoom, zoomIdentity } from "d3-zoom";
import { select } from "d3-selection";
import { useGesture } from "react-use-gesture";

import { toELK } from "../lib/layout"
import { giveBirth, makeChild, marry } from "../lib/modification"
import { FamilyTree } from "../lib/types"

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const addParent = (parent: Rect, child: Rect): Rect => (
  {
    x: parent.x + child.x,
    y: parent.y + child.y,
    width: child.width,
    height: child.height,
  }
)

const Label = ({ label, rect }: {
  label: ElkLabel
  rect: Rect
}) => {
  const spring = useSpring(rect)

  return (
    <animated.text
      {...spring}
      dominantBaseline="text-before-edge"
      fontFamily="Arial, sans-serif"
      fontSize="16px"
      pointerEvents="none"
    >
      {label.text}
    </animated.text>
  )
}

type Vector2 = [x: number, y: number]

const boxToPoint = ({ x, y, width, height }: Rect, [px, py]: Vector2, options?: ArrowOptions): number[] =>
  getBoxToBoxArrow(x, y, width, height, px, py, 1, 1, options)

const PerfectArrow = ({ rect, point }: {
  rect: Rect
  point: Vector2
}): JSX.Element => {
  const [sx, sy, cx, cy, ex, ey, ae, as, ec] = boxToPoint(rect, point, {
    bow: 0.2,
    stretch: 0.5,
    stretchMin: 40,
    stretchMax: 420,
    padStart: 0,
    padEnd: 20,
    flip: false,
    straights: true,
  })

  const endAngleAsDegrees = ae * (180 / Math.PI)

  return (
    <g
      stroke="#000"
      fill="#000"
      strokeWidth={3}
    >
      <circle cx={sx} cy={sy} r={4} />
      <path d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`} fill="none" />
      <polygon
        points="0,-6 12,0, 0,6"
        transform={`translate(${ex},${ey}) rotate(${endAngleAsDegrees})`}
      />
    </g>
  )
}

const ortho = line<ElkPoint>(({ x }) => x, ({ y }) => y)

const useInterpolatePath = (d: string): Interpolation<string> => {
  const prev = useRef(d)
  const interpolator = useMemo(() => interpolatePath(prev.current, d), [d])

  const spring = useSpring({
    from: { t: 0 },
    to: { t: 1 },
    reset: d !== prev.current,
  })

  prev.current = d

  return to(spring.t, interpolator)
}

const EdgeComp = ({ edge, inParent }: {
  edge: ElkEdge,
  inParent: Rect,
}): JSX.Element => {

  // @ts-ignore sections
  const sections: ElkEdgeSection[] = edge.sections

  const d = useMemo(() => ortho(
    sections.reduce((acc, { startPoint, bendPoints, endPoint }) => {
      acc.push(startPoint)
      bendPoints?.forEach(x => acc.push(x))
      acc.push(endPoint)
      return acc
    }, Array<ElkPoint>())
  ), [sections])

  if (!d) throw Error()

  const animatedD = useInterpolatePath(d)

  return (
    <animated.path fill="none" stroke="black" d={animatedD} />
  )
}

const zoomAtom = atom(zoomIdentity)

const ZoomingGroup = ({ children }: { children: ReactNode }) => {
  const ref = useRef<SVGGElement | null>(null)
  const [transform, setTransform] = useAtom(zoomAtom)

  useEffect(() => {
    select(ref.current?.ownerSVGElement as Element)
      .call(
        zoom()
          .on('zoom', ({ transform }) => setTransform(transform))
      )
  }, [])

  return (
    <g ref={ref} transform={transform.toString()}>
      {children}
    </g>
  )
}

const Person = ({ person, inParent, tree }: {
  person: ElkNode,
  inParent: Rect,
  tree: FamilyTree,
}): JSX.Element => {

  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [arrow, setArrow] = useState<Vector2 | null>(null)

  // TODO should be a ref
  const [transform] = useAtom(zoomAtom)

  const spring = useSpring(inParent)

  const gestures = useGesture({
    onHover: ({ hovering }) => setHovering(hovering),
    onDragStart: ({ event }) => {
      event.preventDefault()
      setDragging(true)
    },
    onDrag: ({ xy: [x, y], event: { target }, tap }) => {
      if (tap) return

      const svgRect = target as SVGElement
      const { offsetLeft, offsetTop } = svgRect.ownerSVGElement!.parentElement!
      setArrow(transform.invert([x - offsetLeft, y - offsetTop]))

      // const el = document.elementFromPoint(x, y)?.parentNode as SVGElement
      // setHovering(el?.dataset?.['id'])
    },
    onDragEnd: ({ xy: [x, y] }) => {
      setDragging(false)
      setArrow(null)
      const el = document.elementFromPoint(x, y)?.parentNode as SVGElement
      const targetID = el?.dataset?.['id']
      if (targetID) {
        if (targetID.includes(':')) {
          makeChild(tree, person.id, targetID)
        } else {
          marry(tree, person.id, targetID)
        }
      }
    },
  })

  const isHovering = hovering

  return (
    <g>
      <g
        {...gestures()}
        cursor="pointer"
        data-id={person.id}
        pointerEvents={dragging ? "none" : undefined}
      >
        <animated.rect
          {...spring}
          fill="transparent"
          stroke={isHovering ? "blue" : "black"}
          strokeWidth={2}
          rx={2}
        />

        {person.labels?.map(label => (
          <Label
            key={label.text}
            rect={addParent(inParent, label as Rect)}
            label={label}
          />
        ))}

        {isHovering && (
          <g
            stroke="currentColor"
            fill="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${inParent.x + inParent.width / 2 - 12}, ${inParent.y - 12})`}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="16 12 12 8 8 12" />
            <line x1="12" y1="16" x2="12" y2="8" />
          </g>
        )}
      </g>

      {arrow && (
        <PerfectArrow
          rect={inParent}
          point={arrow}
        />
      )}
    </g>
  )
}

interface FormValues {
  name: string
}

const NewPerson = ({ submit }: { submit: (x: FormValues) => void }): JSX.Element => {
  const { register, handleSubmit, reset } = useForm<FormValues>({})

  return (
    <form onSubmit={handleSubmit(x => {
      submit(x)
      reset()
    })}>
      <input type="text" {...register("name", { required: true })} />
      <button type="submit">Add</button>
    </form>
  )
};

// noinspection JSUnusedGlobalSymbols
export default function Index(): JSX.Element {
  const treeRef = useRef<FamilyTree>({} as FamilyTree)
  const [layout, setLayout] = useState<ElkNode | null>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    const tree: FamilyTree = {
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    treeRef.current = tree

    const persistence = new IndexeddbPersistence('doc', doc)
    const undoMgr = new Y.UndoManager(Object.values(tree))
    persistence.whenSynced.then(() => undoMgr.clear())

    const elk = new ELK()
    const onDocChange = async () => {
      const layouted = await elk.layout(toELK(tree))
      setLayout(layouted)
    };
    doc.on('update', onDocChange)
    return () => {
      doc.off('update', onDocChange)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <NewPerson submit={x => giveBirth(treeRef.current, x.name)} />

      <div className="w-full h-full">
        <svg className="w-full h-full">
          <ZoomingGroup>
            {layout?.edges?.map(e => (
              <EdgeComp key={e.id} edge={e} inParent={layout as Rect} />
            ))}

            {layout?.children?.map(p => (
              <Person
                key={p.id}
                person={p}
                inParent={addParent(layout as Rect, p as Rect)}
                tree={treeRef.current}
              />
            ))}
          </ZoomingGroup>
        </svg>
      </div>
    </div>
  )
}
