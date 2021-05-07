import React, { ReactNode, useEffect, useRef } from "react"
import Konva from "konva"
import { Group } from "react-konva"
import { ZoomTransform } from "d3-zoom"

import { transformSelector, useStore } from "../store";

export const ZoomingGroup = ({ children }: { children: ReactNode }): JSX.Element => {
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    const apply = ({ x, y, k }: ZoomTransform) => {
      ref.current?.setAttrs({
        x,
        y,
        scaleX: k,
        scaleY: k,
      })
      ref.current?.getLayer()?.batchDraw()
    }

    apply(useStore.getState().transform)

    return useStore.subscribe(apply, transformSelector)
  }, [])

  return (
    <Group ref={ref}>
      {children}
    </Group>
  )
}
