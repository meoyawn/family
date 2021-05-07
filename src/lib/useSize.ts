import { useEffect, useState } from "react";

import { PointTuple } from "./geometry";

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
