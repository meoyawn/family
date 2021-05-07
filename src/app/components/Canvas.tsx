import React from "react"
import { Layer } from "react-konva"

import { useStore } from "../store"
import { dragTransform, stayInPlace, wheelTransform } from "../../lib/konva"
import InfiniteGrid from "./InfiniteGrid"
import { ResizingStage } from "./ResizingStage"
import Graph from "./Graph"

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
    </Layer>
  </ResizingStage>
)
