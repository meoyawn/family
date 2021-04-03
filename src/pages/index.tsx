import React, { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb"
import { animated, useSpring } from "react-spring"
import ELK, { ElkLabel, ElkNode } from "elkjs/lib/elk.bundled.js"
import { useGesture } from "react-use-gesture"
import { ArrowOptions, getBoxToBoxArrow } from "perfect-arrows"

import { toELK } from "../lib/layout"
import { giveBirth } from "../lib/modification"
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

const Label = ({ label, inParent }: {
  label: ElkLabel
  inParent: Rect
}) => {
  const lblProps = useSpring(inParent)

  return (
    <animated.text
      {...lblProps}
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
};

const Person = ({ person, inParent }: {
  person: ElkNode,
  inParent: Rect
}): JSX.Element => {

  const [hovering, setHovering] = useState(false)
  const [arrow, setArrow] = useState<Vector2 | null>(null)

  const props = useSpring({ ...inParent, stroke: hovering ? "blue" : "black" })

  const gestures = useGesture({
    onDrag: ({ dragging, xy: [x, y], event: { target } }) => {
      const svgRect = target as SVGRectElement
      const { offsetLeft, offsetTop } = svgRect.ownerSVGElement!.parentElement!

      setArrow(dragging ? [x - offsetLeft, y - offsetTop] : null)
      // console.log(document.elementFromPoint(x, y))
    },
    onHover: ({ hovering }) => setHovering(hovering),
  })

  return (
    <g>
      <animated.rect
        {...props}
        {...gestures()}
        fill="transparent"
        stroke={hovering && !arrow ? "blue" : "black"}
        strokeWidth={2}
        rx={2}
        cursor={"pointer"}
      />

      {person.labels?.map(label => (
        <Label
          key={label.text}
          inParent={addParent(inParent, label as Rect)}
          label={label}
        />
      ))}

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

function NewPerson({ submit }: { submit: (x: FormValues) => void }): JSX.Element {
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
}

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
          {layout?.children?.map(p => (
            <Person
              key={p.id}
              person={p}
              inParent={addParent(layout as Rect, p as Rect)}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
