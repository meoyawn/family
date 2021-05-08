import React from "react"
import { Arrow, Layer } from "react-konva"
import Konva from 'konva'

import { arrowEndSelector, arrowStartSelector, useStore } from "../store"
import { dragTransform, stayInPlace, wheelTransform } from "../../lib/konva"
import InfiniteGrid from "./InfiniteGrid"
import { ResizingStage } from "../../lib/components/ResizingStage"
import Graph from "./Graph"

// @ts-ignore https://konvajs.org/api/Konva.html#.captureTouchEventsEnabled__anchor
Konva.captureTouchEventsEnabled = true
Konva.hitOnDragEnabled = true

const Arrows = () => {
  const start = useStore(arrowStartSelector)
  const end = useStore(arrowEndSelector)

  return start && end ? (
    <Arrow
      points={start.concat(end)}
      stroke="black"
      fill="black"
      listening={false}
    />
  ) : null
}

export default function Canvas(): JSX.Element {
  return (
    <ResizingStage
      draggable={true}
      dragBoundFunc={stayInPlace}
      onDragStart={({ target }) => {
        if (target instanceof Konva.Stage) {
          useStore.setState({ zooming: true })
        }
      }}
      onDragMove={dragTransform({
        get: () => useStore.getState().transform,
        set: transform => useStore.setState({ transform }),
      })}
      onDragEnd={({ target }) => {
        if (target instanceof Konva.Stage) {
          useStore.setState({ zooming: false })
        }
      }}

      onWheel={wheelTransform({
        get: () => useStore.getState().transform,
        set: transform => useStore.setState({ transform }),
        extent: [0.3, 20],
      })}

      onClick={({ target }) => {
        if (target instanceof Konva.Stage) {
          useStore.setState({ selected: new Set() })
        }
      }}
    >
      <Layer>
        <InfiniteGrid />
        <Graph />
        <Arrows />
      </Layer>
    </ResizingStage>
  )
}
