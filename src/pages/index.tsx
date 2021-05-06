import React, { useRef } from "react"

import Canvas from "../app/components/Canvas";
import { useSize } from "../lib/useSize";

// noinspection JSUnusedGlobalSymbols
export default function Index(): JSX.Element {
  const canvasParent = useRef<HTMLDivElement>(null)

  const [width, height] = useSize(() => canvasParent.current!)

  return (
    <div className="flex flex-col h-screen">
      <div
        ref={canvasParent}
        className="w-full h-full"
      >
        <Canvas
          width={width}
          height={height}
        />
      </div>
    </div>
  )
}
