import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { Circle, Group, Rect } from "react-konva";
import { ElkNode } from "elkjs/lib/elk-api"

import { selectedSelector, useStore } from "../store";
import { Label } from "./Label";
import { useHover } from "../../lib/useHover";
import { stayInPlace } from "../../lib/konva";
import { createParents, createSpouse, makeChild, marry } from "../modification";
import { ParentsID, PersonID } from "../types";
import { mkEdge, mkNode } from "../../lib/elk";

export default function Person({ node }: { node: ElkNode }): JSX.Element {

  const [hoverProps, hovering] = useHover()

  const groupRef = useRef<Konva.Group>(null)
  const rectRef = useRef<Konva.Rect>(null)

  useEffect(() => {
    groupRef.current?.setPosition({ x: node.x!, y: node.y! })
    rectRef.current?.setSize({ width: node.width, height: node.height })
  }, [])

  useEffect(() => {
    groupRef.current?.to({ x: node.x, y: node.y })
    rectRef.current?.to({ width: node.width, height: node.height })
  }, [node])

  const pid = node.id as PersonID

  const selected = useStore(selectedSelector)
  const isSelected = selected.has(pid)

  return (
    <Group
      ref={groupRef}
      {...hoverProps}
      onClick={({ evt, target }: Konva.KonvaEventObject<MouseEvent>) => {
        const { tree, selected, root } = useStore.getState()
        const newRoot = root && { ...root }

        switch (target.name()) {
          case "person": {
            const old = evt.ctrlKey || evt.shiftKey
              ? selected
              : []

            const selected1 = new Set(old)
            selected1.add(pid)
            useStore.setState({ selected: selected1 })
            break
          }

          case "create_parents": {
            const result = createParents(tree, pid, "Dad", 'Mom')
            if (result) {
              const [p1, p2, fid] = result
              newRoot?.children?.push(
                mkNode(p1, node),
                mkNode(p2, node),
              )
              newRoot?.edges?.push(
                mkEdge(`${p1}:${fid}`, node),
                mkEdge(`${p2}:${fid}`, node),
                mkEdge(`${fid}:${pid}`, node),
              )
              useStore.setState({ editing: p1, root: newRoot })
            }
            break
          }

          case "create_spouse": {
            const result = createSpouse(tree, pid)
            if (result) {
              const [editing, fid] = result
              newRoot?.children?.push(mkNode(editing, node))
              newRoot?.edges?.push(
                mkEdge(`${pid}:${fid}`, node),
                mkEdge(`${editing}:${fid}`, node),
              )
              useStore.setState({ editing, root: newRoot })
            }
            break
          }
        }
      }}
      onDblClick={() => useStore.setState({ editing: pid })}

      draggable={true}
      dragBoundFunc={stayInPlace}
      onDragStart={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowStart: [evt.x, evt.y] })}
      onDragMove={({ evt }: Konva.KonvaEventObject<DragEvent>) => useStore.setState({ arrowEnd: [evt.x, evt.y] })}
      onDragEnd={({ evt, target }: Konva.KonvaEventObject<DragEvent>) => {
        const drop: Konva.Node | undefined = target.getLayer()?.getIntersection(evt, ".person, .family")

        const { tree } = useStore.getState()
        switch (drop?.name()) {
          case "person": {
            marry(tree, pid, drop.id() as PersonID)
            break
          }

          case "family": {
            makeChild(tree, pid, drop.id() as ParentsID)
            break
          }
        }
        useStore.setState({ arrowStart: undefined, arrowEnd: undefined })
      }}
    >
      <Rect
        ref={rectRef}
        id={pid}
        name="person"

        stroke={hovering ? "blue" : "black"}
        fill="white"
        cornerRadius={2}
        strokeWidth={1}
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

      {isSelected && (
        <Rect
          stroke="blue"
          x={-2}
          y={-2}
          width={node.width! + 4}
          height={node.height! + 4}
          strokeWidth={2}
          listening={false}
          cornerRadius={4}
        />
      )}
    </Group>
  )
}
