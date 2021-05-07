import { ElkNode } from "elkjs/lib/elk.bundled"
import React from "react"
import { Circle } from "react-konva"
import { giveBirth } from "../modification";
import { useStore } from "../store";
import { useHover } from "../../lib/useHover";

export const Family = ({ node }: { node: ElkNode }): JSX.Element => {
  const [props, hovering] = useHover()

  return (
    <Circle
      {...props}
      radius={hovering ? 6 : 2}
      hitStrokeWidth={6}
      id={node.id}
      name="family"
      x={node.x}
      y={node.y}
      onClick={() => {
        const { tree } = useStore.getState()
        const editing = giveBirth(tree, "", node.id)
        useStore.setState({ editing })
      }}
      fill="black"
    />
  )
}
