import Konva from "konva";

import { PointObj, PointTuple } from "./geometry";
import { useStore } from "../app/store";
import { zoomIdentity } from "d3-zoom";

export const worldPos = (stage: Konva.Stage, screen: PointObj): PointTuple => {
  const { x, y, scaleX, scaleY } = stage.attrs

  return [
    (screen.x - x) / scaleX,
    (screen.y - y) / scaleY,
  ]
}

export const screenPos = (stage: Konva.Stage, [wx, wy]: PointTuple): PointTuple => {
  const { x, y, scaleX, scaleY } = stage.attrs

  return [
    x + wx * scaleX,
    y + wy * scaleY,
  ]
}

const defaultWheelDelta = (event: WheelEvent) =>
  -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1)

export const wheelScale = (target: Konva.Node) => ({ evt }: Konva.KonvaEventObject<WheelEvent>): void => {
  const stage = target as Konva.Stage
  evt.preventDefault();

  const screen = stage.pointerPos
  if (!screen) return

  const [wx, wy] = worldPos(stage, screen)
  const oldScale = stage.scaleX()
  const newScale = Math.max(oldScale + defaultWheelDelta(evt), 0.1)

  const x = screen.x - wx * newScale
  const y = screen.y - wy * newScale
  stage.setAttrs({
    scaleX: newScale,
    scaleY: newScale,
    x: screen.x - wx * newScale,
    y: screen.y - wy * newScale,
  })
  stage.batchDraw()

  useStore.setState({
    transform: zoomIdentity.translate(x, y).scale(newScale),
  })
}
