import React from "react"
import { Layer, Line } from "react-konva"
import Konva from 'konva'

import { arrowEndSelector, arrowStartSelector, useStore } from "../store"
import { dragTransform, stayInPlace, wheelTransform } from "../../lib/konva"
import InfiniteGrid from "./InfiniteGrid"
import { ResizingStage } from "./ResizingStage"
import Graph from "./Graph"

Konva.hitOnDragEnabled = true

const Arrows = () => {
  const start = useStore(arrowStartSelector)
  const end = useStore(arrowEndSelector)

  return start && end ? (
    <Line
      points={start.concat(end)}
      stroke="black"
      listening={false}
    />
  ) : null
}

export const Canvas = (): JSX.Element => (
  <ResizingStage
    draggable={true}
    dragBoundFunc={stayInPlace}
    onDragMove={dragTransform({
      get: () => useStore.getState().transform,
      set: transform => useStore.setState({ transform }),
    })}

    onWheel={wheelTransform({
      get: () => useStore.getState().transform,
      set: transform => useStore.setState({ transform }),
      extent: [0.3, 20],
    })}
  >
    <Layer>
      <InfiniteGrid />
      <Graph />
      <Arrows />
    </Layer>
  </ResizingStage>
)
