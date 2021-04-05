import React, { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb"
import ELK, { ElkEdge, ElkEdgeSection, ElkLabel, ElkNode } from "elkjs/lib/elk.bundled.js"
import { ArrowOptions, getBoxToBoxArrow } from "perfect-arrows"
import { atom, useAtom } from "jotai"
import Konva from "konva";
import { Arrow, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";

import { toELK } from "../lib/layout"
import { giveBirth, makeChild, marry } from "../lib/modification"
import { FamilyTree, PersonID } from "../lib/types"

interface RectObj {
  x: number
  y: number
  width: number
  height: number
}

interface PointObj {
  x: number
  y: number
}

const addParent = (parent: RectObj, child: RectObj): RectObj => (
  {
    x: parent.x + child.x,
    y: parent.y + child.y,
    width: child.width,
    height: child.height,
  }
)

const Label = ({ label, rect }: {
  label: ElkLabel
  rect: RectObj
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

const boxToPoint = ({ x, y, width, height }: RectObj, p: PointObj, options?: ArrowOptions): number[] =>
  getBoxToBoxArrow(x, y, width, height, p.x, p.y, 1, 1, options)

const PerfectArrow = ({ rect, point }: {
  rect: RectObj
  point: PointObj
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

const push = (arr: number[], point: PointObj) =>
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
  inParent: RectObj,
}): JSX.Element => {

  console.log('edge')

  return (
    <Line
      id={edge.id}
      fill="none"
      stroke="black"
      points={points(edge)}
    />
  )
}

const worldPointerPos = (stage: Konva.Stage): PointObj | undefined => {
  const pointerPosition = stage.pointerPos
  if (!pointerPosition) return undefined

  return {
    x: (pointerPosition.x - stage.x()) / stage.scaleX(),
    y: (pointerPosition.y - stage.y()) / stage.scaleY(),
  }
};

const Person = ({ person, inParent, tree }: {
  person: ElkNode,
  inParent: RectObj,
  tree: FamilyTree,
}): JSX.Element => {

  const [hovering, setHovering] = useAtom(hoveringAtom)
  const [arrowEnd, setArrowEnd] = useState<PointObj | null>(null)

  const isHovering = hovering === person.id

  return (
    <>
      <Group
        id={person.id}
        cursor="pointer"
        {...inParent}
        offsetX={inParent.x}
        offsetY={inParent.y}

        onMouseEnter={({ target }) => setHovering(target.parent?.id())}
        onMouseLeave={() => setHovering(undefined)}

        draggable={true}
        hitOnDragEnabled={true}
        dragBoundFunc={function () {
          return this.absolutePosition();
        }}
        onDragMove={({ target }) => {
          const stage = target.getStage()
          if (!stage) throw Error()

          const world = worldPointerPos(stage)
          if (!world) return

          setArrowEnd(world)

          setHovering(target.getLayer()?.getIntersection(stage.pointerPos!, "Group")?.id())
        }}
        onDragEnd={({ target }) => {
          setArrowEnd(null)

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
            rect={addParent(inParent, label as RectObj)}
            label={label}
          />
        ))}

        {isHovering && (
          <Circle
            {...inParent}
            radius={10}
            stroke="black"
          />
        )}
      </Group>

      {arrowEnd && (
        <PerfectArrow
          rect={inParent}
          point={arrowEnd}
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

const onWheel = ({ evt, target }: Konva.KonvaEventObject<WheelEvent>) => {
  const stage = target as Konva.Stage
  evt.preventDefault();

  const oldScale = stage.scaleX();
  const newScale = Math.max(oldScale + defaultWheelDelta(evt), 0.1)

  const screen = stage.pointerPos
  const world = worldPointerPos(stage)
  if (!world || !screen) return

  stage.setAttrs({
    scaleX: newScale,
    scaleY: newScale,
    x: screen.x - world.x * newScale,
    y: screen.y - world.y * newScale,
  })

  stage.batchDraw()
}

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
          onWheel={onWheel}
        >
          <Layer>
            {layout?.edges?.map(e => (
              <EdgeComp key={e.id} edge={e} inParent={layout as RectObj} />
            ))}

            {layout?.children?.map(p => (
              <Person
                key={p.id}
                person={p}
                inParent={addParent(layout as RectObj, p as RectObj)}
                tree={treeRef.current}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
