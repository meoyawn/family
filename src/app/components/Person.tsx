import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { Circle, Group, Rect } from "react-konva";
import { ElkNode } from "elkjs/lib/elk-api"

import { selectedSelector, useStore } from "../store";
import { Label } from "./Label";
import { useHover } from "../../lib/useHover";
import { stayInPlace } from "../../lib/konva";
import { createParents, createSpouse, makeChild, marry } from "../modification";
import { FamilyID, PersonID } from "../types";
import { mkEdge, mkNode } from "../../lib/elk";

export default function Person({ node }: { node: ElkNode }): JSX.Element {

  const [hoverProps, hovering] = useHover()

  const gref = useRef<Konva.Group>(null)
  const rref = useRef<Konva.Rect>(null)

  useEffect(() => {
    gref.current?.setPosition({ x: node.x, y: node.y })
    rref.current?.setSize({ width: node.width, height: node.height })
  }, [])

  useEffect(() => {
    gref.current?.to({ x: node.x, y: node.y })
    rref.current?.to({ width: node.width, height: node.height })
  }, [node])

  const pid = node.id as PersonID

  const selected = useStore(selectedSelector)
  const isSelected = selected.has(pid)

  return (
    <Group
      ref={gref}
      {...hoverProps}
      onClick={({ evt, target }: Konva.KonvaEventObject<MouseEvent>) => {
        const { tree, selected, root } = useStore.getState()
        const newRoot = root && { ...root }

        switch (target.name()) {
          case "person": {
            const old = evt.ctrlKey ? selected : []
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
            makeChild(tree, pid, drop.id() as FamilyID)
            break
          }
        }
        useStore.setState({ arrowStart: undefined, arrowEnd: undefined })
      }}
    >
      <Rect
        ref={rref}
        id={pid}
        name="person"

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
    </Group>
  )
}
