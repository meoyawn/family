import React, { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb"
import ELK, { ElkEdge, ElkEdgeSection, ElkLabel, ElkNode, ElkPoint } from "elkjs/lib/elk.bundled.js"
import { ArrowOptions, getBoxToBoxArrow } from "perfect-arrows"
import { atom, useAtom } from "jotai"
import Konva from "konva";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import { toELK } from "../lib/layout"
import { giveBirth, makeChild, marry } from "../lib/modification"
import { FamilyTree, PersonID } from "../lib/types"

interface RectT {
  x: number
  y: number
  width: number
  height: number
}

const addParent = (parent: RectT, child: RectT): RectT => (
  {
    x: parent.x + child.x,
    y: parent.y + child.y,
    width: child.width,
    height: child.height,
  }
)

const Label = ({ label, rect }: {
  label: ElkLabel
  rect: RectT
}) => {
  return (
    <Text
      {...rect}
      id={label.id}
      dominantBaseline="text-before-edge"
      fontFamily="Arial, sans-serif"
      fontSize={16}
      pointerEvents="none"
      text={label.text}
    />
  )
}

type Vector2 = [x: number, y: number]

const boxToPoint = ({ x, y, width, height }: RectT, [px, py]: Vector2, options?: ArrowOptions): number[] =>
  getBoxToBoxArrow(x, y, width, height, px, py, 1, 1, options)

const PerfectArrow = ({ rect, point }: {
  rect: RectT
  point: Vector2
}): JSX.Element => {
  const [sx, sy, cx, cy, ex, ey, ae, as, ec] = boxToPoint(rect, point, {
    padStart: 0,
    padEnd: 1,
  })

  return (
    <Arrow
      points={[sx, sy, cx, cy, ex, ey]}
      tension={0.5}

      fill="none"
      stroke="black"
    />
  )
}

const hoveringAtom = atom<PersonID | undefined>(undefined)
const selectedAtom = atom<PersonID | undefined>(undefined)

const push = (arr: number[], point: ElkPoint) =>
  arr.push(point.x, point.y)

const points = (edge: ElkEdge): number[] => {

  // @ts-ignore sections
  const sections: ElkEdgeSection[] = edge.sections

  return sections.reduce((acc, { startPoint, bendPoints, endPoint }) => {
    acc.push(startPoint.x, startPoint.y)
    push(acc, startPoint)
    bendPoints?.forEach(x => push(acc, x))
    push(acc, endPoint)
    return acc
  }, Array<number>())
}

const EdgeComp = ({ edge, inParent }: {
  edge: ElkEdge,
  inParent: RectT,
}): JSX.Element => {
  return (
    <Line
      id={edge.id}
      fill="none"
      stroke="black"
      points={points(edge)}
    />
  )
}

const scaledPointerPos = (stage: Konva.Stage): ElkPoint | undefined => {
  const pointerPosition = stage.pointerPos
  if (!pointerPosition) return undefined

  return {
    x: (pointerPosition.x - stage.x()) / stage.scaleX(),
    y: (pointerPosition.y - stage.y()) / stage.scaleY(),
  }
};

const Person = ({ person, inParent, tree }: {
  person: ElkNode,
  inParent: RectT,
  tree: FamilyTree,
}): JSX.Element => {

  const [hovering, setHovering] = useAtom(hoveringAtom)
  const [arrow, setArrow] = useState<Vector2 | null>(null)

  const isHovering = hovering === person.id

  return (
    <>
      <Group
        id={person.id}
        cursor="pointer"
        {...inParent}
        offsetX={inParent.x}
        offsetY={inParent.y}

        onMouseEnter={() => {
          setHovering(person.id)
        }}
        onMouseLeave={() => {
          setHovering(undefined)
        }}

        draggable={true}
        dragBoundFunc={function () {
          return this.absolutePosition();
        }}
        onDragMove={({ target }) => {
          const stage = target.getStage()
          if (!stage) throw Error()

          const xy = scaledPointerPos(stage)
          if (!xy) return

          setArrow([xy.x, xy.y])

          const layer = target.getLayer()
          setHovering(layer?.getIntersection(stage.pointerPos!, "Group")?.id())
        }}
        onDragEnd={({ target }) => {
          setArrow(null)

          const stage = target.getStage()
          const layer = target.getLayer()
          const targetID = layer?.getIntersection(stage!.pointerPos!, "Group")?.id()
          if (targetID) {
            if (targetID.includes(':')) {
              makeChild(tree, person.id, targetID)
            } else {
              marry(tree, person.id, targetID)
            }
          }
        }}
      >
        <Rect
          {...inParent}
          fill="transparent"
          stroke={isHovering ? "blue" : "black"}
          strokeWidth={2}
          rx={2}
        />

        {person.labels?.map(label => (
          <Label
            key={label.text}
            rect={addParent(inParent, label as RectT)}
            label={label}
          />
        ))}

        {isHovering && (
          <Circle radius={2} />
        )}
      </Group>

      {arrow && (
        <PerfectArrow
          rect={inParent}
          point={arrow}
        />
      )}
    </>
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

const defaultWheelDelta = (event: WheelEvent) =>
  -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1)

// noinspection JSUnusedGlobalSymbols
export default function Index(): JSX.Element {
  const treeRef = useRef<FamilyTree>({} as FamilyTree)
  const [layout, setLayout] = useState<ElkNode | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)

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
      setLayout(await elk.layout(toELK(tree)))
    };
    doc.on('update', onDocChange)
    return () => {
      doc.off('update', onDocChange)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <NewPerson submit={x => giveBirth(treeRef.current, x.name)} />

      <div className="w-full h-full" ref={containerRef}>
        <Stage
          width={containerRef.current?.clientWidth}
          height={containerRef.current?.clientHeight}
          draggable={true}
          onWheel={({ evt, target }) => {
            const stage = target as Konva.Stage
            evt.preventDefault();

            const oldScale = stage.scaleX();
            const newScale = Math.max(oldScale + defaultWheelDelta(evt), 0.1)

            const unscaledPointer = stage.pointerPos
            const scaledPointer = scaledPointerPos(stage)
            if (!scaledPointer || !unscaledPointer) return

            stage.scale({ x: newScale, y: newScale });
            stage.position({
              x: unscaledPointer.x - scaledPointer.x * newScale,
              y: unscaledPointer.y - scaledPointer.y * newScale,
            });
            stage.batchDraw()
          }}
        >
          <Layer>
            {layout?.edges?.map(e => (
              <EdgeComp key={e.id} edge={e} inParent={layout as RectT} />
            ))}

            {layout?.children?.map(p => (
              <Person
                key={p.id}
                person={p}
                inParent={addParent(layout as RectT, p as RectT)}
                tree={treeRef.current}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
