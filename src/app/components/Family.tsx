import { ElkNode } from "elkjs/lib/elk-api"
import React, { useEffect, useRef } from "react"
import { Circle } from "react-konva"
import Konva from "konva";

import { createChild } from "../modification";
import { useStore } from "../store";
import { useHover } from "../../lib/useHover";
import { FamilyID } from "../types";
import { mkEdge } from "../../lib/elk";

export const Family = ({ node }: { node: ElkNode }): JSX.Element => {
  const [hoverProps, hovering] = useHover()
  const ref = useRef<Konva.Circle>(null)

  const fid = node.id as FamilyID

  useEffect(() => {
    ref.current?.setPosition({ x: node.x, y: node.y })
  }, [])

  useEffect(() => {
    ref.current?.to({ x: node.x, y: node.y })
  }, [node])

  return (
    <Circle
      {...hoverProps}
      id={node.id}
      name="family"
      ref={ref}
      radius={hovering ? 6 : 1}
      fill="black"
      hitStrokeWidth={hovering ? 0 : 6}
      onClick={() => {
        const { tree, root } = useStore.getState()

        const pid = createChild(tree, "", fid)

        const newRoot = root && { ...root }
        newRoot?.children?.push({
          id: pid,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        })

        newRoot?.edges?.push(mkEdge(`${fid}:${pid}`, [node.x!, node.y!, node.x!, node.y!]))

        useStore.setState({ editing: pid, root: newRoot })
      }}
    />
  )
}
