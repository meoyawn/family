import React, { useState } from "react";
import { Group, Rect } from "react-konva";
import { ElkNode } from "elkjs/lib/elk.bundled";

import { useStore } from "../store";
import Edge from "./Edge";
import { Label } from "./Label";

export default function Person({ node }: { node: ElkNode }): JSX.Element {

  const [hovering, setHovering] = useState(false)

  return (
    <Group
      x={node.x}
      y={node.y}
    >
      <Group
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onDblClick={() => {
          useStore.setState({ editing: node.id })
        }}

        draggable={true}
      >
        <Rect
          width={node.width}
          height={node.height}

          stroke={hovering ? "blue" : "black"}
          fill="white"
          cornerRadius={2}
          strokeWidth={1}
        />

        {node.labels?.map((lbl, i) => (
          <Label key={i} label={lbl} />
        ))}
      </Group>

      <Group>
        {node.children?.map(c => (
          <Person key={c.id} node={c} />
        ))}
        {node.edges?.map(e => (
          <Edge key={e.id} edge={e} />
        ))}
      </Group>
    </Group>
  )
}
