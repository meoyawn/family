import React from "react";
import Konva from "konva";
import { Circle } from "react-konva";
import { a, useSpring } from '@react-spring/konva'
import { ElkNode } from "elkjs/lib/elk-api"

import { selectedSelector, useStore } from "../store";
import { Label } from "./Label";
import { useHover } from "../../lib/useHover";
import { stayInPlace } from "../../lib/konva";
import { createParents, createSpouse, makeChild, marry } from "../modification";

export default function Person({ node }: { node: ElkNode }): JSX.Element {

  const [hoverProps, hovering] = useHover()

  const [{ x, y, width, height }] = useSpring({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }, [node])

  const selected = useStore(selectedSelector)
  const isSelected = selected.has(node.id)

  return (
    <a.Group
      x={x}
      y={y}

      {...hoverProps}
      onClick={({ evt, target }: Konva.KonvaEventObject<MouseEvent>) => {
        const { tree, selected } = useStore.getState()
        switch (target.name()) {
          case "person": {
            const old = evt.ctrlKey ? selected : []
            const selected1 = new Set(old)
            selected1.add(node.id)
            useStore.setState({ selected: selected1 })
            break
          }

          case "create_parents": {
            const result = createParents(tree, node.id)
            if (result) {
              const [editing] = result
              useStore.setState({ editing })
            }
            break
          }

          case "create_spouse": {
            const editing = createSpouse(tree, node.id)
            if (editing) {
              useStore.setState({ editing })
            }
            break
          }
        }
      }}
      onDblClick={() => useStore.setState({ editing: node.id })}

      draggable={true}
      dragBoundFunc={stayInPlace}
      onDragStart={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowStart: [evt.x, evt.y] })}
      onDragMove={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowEnd: [evt.x, evt.y] })}
      onDragEnd={({ evt, target }: Konva.KonvaEventObject<DragEvent>) => {
        const drop: Konva.Node | undefined = target.getLayer()?.getIntersection(evt, ".person, .family")

        const { tree } = useStore.getState()
        switch (drop?.name()) {
          case "person": {
            marry(tree, node.id, drop.id())
            break
          }

          case "family": {
            makeChild(tree, node.id, drop.id())
            break
          }
        }
        useStore.setState({ arrowStart: undefined, arrowEnd: undefined })
      }}
    >
      <a.Rect
        id={node.id}
        name="person"
        width={width}
        height={height}

        stroke={hovering ? "blue" : "black"}
        fill="white"
        cornerRadius={2}
        strokeWidth={isSelected ? 2 : 1}
      />

      {node.labels?.map((lbl, i) => (
        <Label key={i} label={lbl} />
      ))}

      {hovering && (
        <Circle
          name="create_parents"
          x={node.width && node.width / 2}
          radius={4}
          fill="black"
        />
      )}

      {hovering && (
        <Circle
          name="create_spouse"
          x={node.width}
          y={node.height && node.height / 2}
          radius={4}
          fill="black"
        />
      )}
    </a.Group>
  )
}
