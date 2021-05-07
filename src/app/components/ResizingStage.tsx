import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { Stage, StageProps } from "react-konva";

import { subscribeSize } from "../../lib/useSize";

export const ResizingStage = ({ parentEl, ...props }: StageProps & { parentEl: () => Element }): JSX.Element => {
  const ref = useRef<Konva.Stage>(null)

  useEffect(() => {
    return subscribeSize(parentEl(), el => {
      ref.current?.size({ width: el.clientWidth, height: el.clientHeight })
      ref.current?.batchDraw()
    })
  }, [])

  return (
    <Stage
      ref={ref}
      {...props}
    />
  )
}
