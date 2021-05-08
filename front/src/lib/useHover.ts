import { useState } from "react";

interface HoverProps {
  onMouseEnter: () => void,
  onMouseLeave: () => void,
}

export const useHover = (): [props: HoverProps, hovering: boolean] => {
  const [hovering, setHovering] = useState(false)

  const onMouseEnter = () => setHovering(true)
  const onMouseLeave = () => setHovering(false)

  return [{ onMouseEnter, onMouseLeave }, hovering]
}
