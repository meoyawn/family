import React from "react";
import { ElkEdge } from "elkjs/lib/elk.bundled";
import { Line } from "react-konva";

import { getPoints } from "../../lib/elk";

export const Edge = ({ edge }: {
  edge: ElkEdge
}): JSX.Element => (
  <Line
    points={getPoints(edge) ?? []}
    stroke="black"
    strokeWidth={1}
  />
)
