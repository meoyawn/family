import { ElkNode } from "elkjs/lib/elk.bundled"
import React, { useEffect, useRef } from "react"
import { Circle } from "react-konva"
import Konva from "konva";

import { createPerson } from "../modification";
import { useStore } from "../store";
import { useHover } from "../../lib/useHover";

export const Family = ({ node }: { node: ElkNode }): JSX.Element => {
  const [hoverProps, hovering] = useHover()
  const ref = useRef<Konva.Circle>(null)

  useEffect(() => {
    ref.current?.setPosition({ x: node.x, y: node.y })
  }, [])

  useEffect(() => {
    ref.current?.to({ x: node.x, y: node.y })
  }, [node])

  return (
    <Circle
      id={node.id}
      name="family"
      ref={ref}
      radius={hovering ? 6 : 1}
      fill="black"
      hitStrokeWidth={hovering ? 0 : 6}
      {...hoverProps}
      onClick={() => {
        const { tree } = useStore.getState()
        const editing = createPerson(tree, "", node.id)
        useStore.setState({ editing })
      }}
    />
  )
}
