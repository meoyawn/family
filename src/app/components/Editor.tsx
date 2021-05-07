import React, { useEffect, useRef } from "react";
import { ElkNode } from "elkjs/lib/elk.bundled";
import { ZoomTransform } from "d3-zoom";

import { transformSelector, useStore } from "../store";
import { FONT_SIZE, LINE_HEIGHT } from "../font";
import { changeName } from "../modification";

const selectElementContents = (el: Element) => {
  const range = document.createRange()
  range.selectNodeContents(el)

  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

const toCSS = ({ x, y, k }: ZoomTransform): string =>
  `translate(${x}px, ${y}px) scale(${k})`

const toTransformOrigin = ({ x, y }: ElkNode): string =>
  `-${x}px -${y}px`

export const Editor = ({ node }: {
  node: ElkNode
}): JSX.Element => {

  const transform = useStore(transformSelector)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const text = node.labels?.[0]?.text

    if (!ref.current) throw Error(text)

    ref.current.innerText = text ?? ""
    ref.current.focus()
    selectElementContents(ref.current)
  }, [node])

  return (
    <div
      ref={ref}
      className="absolute focus:outline-none text-center bg-white rounded-sm table-cell align-middle"
      contentEditable={true}
      role="textbox"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,

        transformOrigin: toTransformOrigin(node),
        transform: toCSS(transform),
        fontSize: `${FONT_SIZE}px`,
        lineHeight: LINE_HEIGHT,
      }}
      onBlur={({ target }) => {
        const { tree } = useStore.getState()
        changeName(tree, node.id, target.innerText)
        useStore.setState({ editing: undefined })
      }}
    />
  )
}
