import React, { useRef } from "react"

import Canvas from "../app/components/Canvas";

// noinspection JSUnusedGlobalSymbols
export default function Index(): JSX.Element {
  const canvasParent = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-screen">
      <div
        ref={canvasParent}
        className="w-full h-full"
      >
        <Canvas
          parentEl={() => canvasParent.current!}
        />
      </div>
    </div>
  )
}
