import Konva from "konva"
import { zoomIdentity, ZoomTransform } from "d3-zoom"

import { PointObj, PointTuple } from "./geometry"

export const worldPos = (t: ZoomTransform, { x, y }: PointObj): PointTuple =>
  t.invert([x, y])

export const screenPos = (t: ZoomTransform, world: PointTuple): PointTuple =>
  t.apply(world)

type Extent = [min: number, max: number]

const clamp = ([min, max]: Extent, n: number) =>
  Math.max(min, Math.min(max, n))

const defaultWheelDelta = (event: WheelEvent) =>
  -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1)

const wheel = (screenPos: PointObj, old: ZoomTransform, extent: Extent, evt: WheelEvent): ZoomTransform => {
  const [wx, wy] = worldPos(old, screenPos)

  const newK = clamp(extent, old.k * Math.pow(2, defaultWheelDelta(evt)))

  return zoomIdentity
    .translate(
      screenPos.x - wx * newK,
      screenPos.y - wy * newK,
    )
    .scale(newK)
}

export const wheelTransform = ({ get, set, extent }: {
  get: () => ZoomTransform
  set: (t: ZoomTransform) => void
  extent: [min: number, max: number]
}) => ({ evt, target }: Konva.KonvaEventObject<WheelEvent>): void => {
  evt.preventDefault()

  const stage = target.getStage()
  if (!stage) return

  const screenPos = stage.getPointerPosition()
  if (!screenPos) return

  set(
    wheel(screenPos, get(), extent, evt)
  )
}

const drag = (t: ZoomTransform, { movementX, movementY }: MouseEvent): ZoomTransform =>
  t.translate(movementX / t.k, movementY / t.k)

export const dragTransform = ({ get, set }: {
  get: () => ZoomTransform,
  set: (t: ZoomTransform) => void
}) =>
  ({ evt, target }: Konva.KonvaEventObject<DragEvent>): void => {
    if (target instanceof Konva.Stage) {
      set(drag(get(), evt))
    }
  }

export function stayInPlace(this: Konva.Node): Konva.Vector2d {
  return this.getAbsolutePosition()
}
