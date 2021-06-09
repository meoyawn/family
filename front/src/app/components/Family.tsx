import { ElkNode } from "elkjs/lib/elk-api"
import React, { useEffect, useRef } from "react"
import { Circle } from "react-konva"
import Konva from "konva";

import { createChild } from "../modification";
import { useStore } from "../store";
import { useHover } from "../../lib/useHover";
import { ParentsID } from "../types";
import { mkEdge, mkNode } from "../../lib/elk";

export const Family = ({ node }: { node: ElkNode }): JSX.Element => {
  const [hoverProps, hovering] = useHover()
  const ref = useRef<Konva.Circle>(null)

  const fid = node.id as ParentsID

  useEffect(() => {
    ref.current?.setPosition({ x: node.x!, y: node.y! })
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

        const pid = createChild(tree, "", "m", fid)

        const newRoot = root && { ...root }
        newRoot?.children?.push(mkNode(pid, node))

        const eid = `${fid}:${pid}`;
        newRoot?.edges?.push(mkEdge(eid, node))

        useStore.setState({
          editing: pid,
          root: newRoot,
        })
      }}
    />
  )
}
