import React from "react";
import { ElkEdge } from "elkjs/lib/elk.bundled";
import { Line } from "react-konva";

import { getPoints } from "../../lib/elk";

export default function Edge({ edge }: {
  edge: ElkEdge
}): JSX.Element {
  return (
    <Line points={getPoints(edge) ?? []} />
  )
}
