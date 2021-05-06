import { ElkEdge, ElkEdgeSection, ElkLabel, ElkNode, ElkPoint } from "elkjs/lib/elk.bundled";
import { animated, useSpring } from "react-spring";
import { Text } from "react-konva";
import React, { useMemo, useState } from "react";
import { FamilyTree } from "./types";
import { makeChild, marry } from "../lib/modification";

const Label = ({ label, rect }: {
  label: ElkLabel
  rect: Rect
}) => {
  const spring = useSpring(rect)

  return (
    <Text
      {...spring}
      dominantBaseline="text-before-edge"
      fontFamily="Arial, sans-serif"
      fontSize="16px"
      pointerEvents="none"
    >
      {label.text}
    </Text>
  )
}

type Vector2 = [x: number, y: number]

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


const Person = ({ person, inParent, tree }: {
  person: ElkNode,
  inParent: Rect,
  tree: FamilyTree,
}): JSX.Element => {

  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [arrow, setArrow] = useState<Vector2 | null>(null)

  const spring = useSpring(inParent)

  const gestures = useGesture({
    onDragStart: ({ event }) => {
      event.preventDefault()
      setDragging(true)
      setHovering(false)
    },
    onDrag: ({ xy: [x, y], event: { target }, tap }) => {
      if (tap) return

      const svgRect = target as SVGElement
      const { offsetLeft, offsetTop } = svgRect.ownerSVGElement!.parentElement!
      setArrow(globalState.zoom.invert([x - offsetLeft, y - offsetTop]))

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

        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
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
