import { useEffect, useState } from "react"

import { PointTuple } from "./geometry"

export const subscribeSize = (el: Element, cb: (el: Element) => void): () => void => {

  const listener = () => cb(el)

  window.addEventListener('resize', listener)
  listener()

  return () => window.removeEventListener('resize', listener)
}

export const useSize = (f: () => Element): PointTuple => {
  const [size, setSize] = useState([0, 0] as PointTuple)

  useEffect(() => {
    return subscribeSize(f(), ({ clientHeight, clientWidth }) => {
      setSize([clientWidth, clientHeight])
    })
  }, [])

  return size
}
