import React from "react";
import Konva from "konva";
import { Image } from "react-konva"
import { ElkNode } from "elkjs/lib/elk.bundled"
import { a, useSpring } from '@react-spring/konva'

import { useStore } from "../store";
import { Label } from "./Label";
import { dataImg } from "../../lib/image";
import { useHover } from "../../lib/useHover";
import { stayInPlace } from "../../lib/konva";
import { makeChild, marry } from "../modification";

const plusSVG = "%0A%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-plus-circle'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='16'%3E%3C/line%3E%3Cline x1='8' y1='12' x2='16' y2='12'%3E%3C/line%3E%3C/svg%3E"

const PlusBtn = () => {
  const [props, hovering] = useHover()
  return (
    <Image
      {...props}
      image={dataImg(plusSVG)}
      fill={hovering ? 'rgba(0, 0, 0, 0.1)' : 'transparent'}
    />
  )
}

export default function Person({ node }: { node: ElkNode }): JSX.Element {

  const [hoverProps, hovering] = useHover()

  const [{ x, y, width, height }] = useSpring({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }, [node])

  return (
    <a.Group
      id={node.id}
      name="person"

      x={x}
      y={y}

      {...hoverProps}
      onClick={({ evt }: Konva.KonvaEventObject<MouseEvent>) => {
        const old = evt.ctrlKey
          ? useStore.getState().selected
          : []
        const selected = new Set(old)
        selected.add(node.id)
        useStore.setState({ selected })
      }}
      onDblClick={() => useStore.setState({ editing: node.id })}

      draggable={true}
      dragBoundFunc={stayInPlace}
      onDragStart={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowStart: [evt.x, evt.y] })}
      onDragMove={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowEnd: [evt.x, evt.y] })}
      onDragEnd={({ evt, target }: Konva.KonvaEventObject<DragEvent>) => {
        const drop: Konva.Node | undefined = target.getLayer()?.getIntersection(evt, ".person,.family")

        const { tree } = useStore.getState()
        switch (drop?.name()) {
          case "person": {
            marry(tree, node.id, drop.id())
            break
          }

          case "family": {
            makeChild(tree, node.id, drop?.id())
            break
          }
        }
        useStore.setState({ arrowStart: undefined, arrowEnd: undefined })
      }}
    >
      <a.Rect
        width={width}
        height={height}

        stroke={hovering ? "blue" : "black"}
        fill="white"
        cornerRadius={2}
        strokeWidth={1}
      />

      {node.labels?.map((lbl, i) => (
        <Label key={i} label={lbl} />
      ))}
    </a.Group>
  )
}
