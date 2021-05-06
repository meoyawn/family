import React from "react";
import { Group, Rect, Text } from "react-konva";
import { ElkNode } from "elkjs/lib/elk.bundled";

import { useStore } from "../store";

export default function Person({ node }: { node: ElkNode }): JSX.Element {
  return (
    <Group
      x={node.x}
      y={node.y}

      onDblClick={() => {
        useStore.setState({ editing: node.id })
      }}
    >
      <Rect
        stroke="black"
        cornerRadius={2}
        width={node.width}
        height={node.height}
      />

      {node.labels?.map((l, i) => (
        <Text
          key={i}
          x={l.x}
          y={l.y}
          text={l.text}
        />
      ))}
    </Group>
  )
}
