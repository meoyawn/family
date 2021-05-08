import React, { ReactNode, useEffect, useRef } from "react"
import Konva from "konva"
import { Group } from "react-konva"
import { ZoomTransform } from "d3-zoom"

import { transformSelector, useStore } from "../store";

const toKonva = ({ x, y, k }: ZoomTransform): Partial<Konva.NodeConfig> => (
  {
    x,
    y,
    scaleX: k,
    scaleY: k,
  }
)

export const ZoomingGroup = ({ children }: { children: ReactNode }): JSX.Element => {
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    const apply = (t: ZoomTransform) => {
      ref.current?.setAttrs(toKonva(t))
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
