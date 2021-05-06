import { useEffect, useState } from "react";

export type PointTuple = [x: number, y: number]

export const useSize = (f: () => Element): PointTuple => {
  const [size, setSize] = useState([0, 0] as PointTuple)

  useEffect(() => {
    const el = f()

    const listener = () => {
      setSize([el.clientWidth, el.clientHeight])
    }

    window.addEventListener('resize', listener)
    listener()

    return () => window.removeEventListener('resize', listener)
  }, [])

  return size
}
