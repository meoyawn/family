import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { Stage, StageProps } from "react-konva";

import { subscribeSize } from "../useSize";

export const ResizingStage = (props: StageProps): JSX.Element | null => {
  const ref = useRef<Konva.Stage>(null)

  useEffect(() => {
    const stage = ref.current
    const parentElement = stage?.container()?.parentElement
    if (!parentElement) return

    return subscribeSize(parentElement, el => {
      stage?.size({ width: el.clientWidth, height: el.clientHeight })
      stage?.batchDraw()
    })
  }, [])

  return (
    <Stage
      ref={ref}
      {...props}
    />
  )
}
