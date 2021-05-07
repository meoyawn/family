import React, { useMemo } from "react";
import { ScaleContinuousNumeric, scaleLinear } from "d3-scale";
import { Group, Line } from "react-konva";
import { transformSelector, useStore } from "../store";

const Grid = ({ xScale, numTicksColumns, width, height, stroke, strokeOpacity, yScale, numTicksRows }: {
  xScale: ScaleContinuousNumeric<number, number>
  yScale: ScaleContinuousNumeric<number, number>

  width: number
  height: number

  numTicksColumns: number
  numTicksRows: number

  stroke: string
  strokeOpacity: number
}): JSX.Element => (
  <Group>
    {xScale.ticks(numTicksColumns).map((x, i) => (
      <Line
        key={i}
        points={[xScale(x), 0, xScale(x), height]}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        listening={false}
      />
    ))}

    {yScale.ticks(numTicksRows).map((y, i) => (
      <Line
        key={i + 1000}
        points={[0, yScale(y), width, yScale(y)]}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        listening={false}
      />
    ))}
  </Group>
)

export default function InfiniteGrid(): JSX.Element | null {
  const screen = window.screen
  const k = screen.height / screen.width

  const screenX = useMemo(() => (
    scaleLinear()
      .domain([0, 1])
      .range([0, screen.width])
  ), [screen.width])

  const screenY = useMemo(() => (
    scaleLinear()
      .domain([0, k])
      .range([0, screen.height])
  ), [k, screen.height])

  const transform = useStore(transformSelector)

  const [scaleX, scaleY] = useMemo(() => [
    transform.rescaleX(screenX),
    transform.rescaleY(screenY),
  ], [screenX, screenY, transform])

  return (
    <Grid
      width={screen.width}
      height={screen.height}

      xScale={scaleX}
      yScale={scaleY}

      numTicksColumns={12}
      numTicksRows={12 * k}

      stroke="black"
      strokeOpacity={0.1}
    />
  )
}
