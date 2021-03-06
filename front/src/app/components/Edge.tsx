import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { Line } from "react-konva";
import { ElkEdge } from "elkjs/lib/elk-api";

import { getPoints } from "../../lib/elk";

export const Edge = ({ edge }: {
  edge: ElkEdge
}): JSX.Element => {
  const ref = useRef<Konva.Line>(null)

  const points = getPoints(edge) ?? []

  useEffect(() => {
    ref.current?.points(points)
  }, [])
  useEffect(() => {
    ref.current?.to({ points })
  }, [points])

  // noinspection RequiredAttributes
  return (
    // @ts-ignore we animate
    <Line
      ref={ref}
      // points={points}
      stroke="black"
      strokeWidth={1}
      listening={false}
    />
  )
}
