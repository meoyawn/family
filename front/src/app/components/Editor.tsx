import React, { useEffect, useRef } from "react"
import { ElkNode } from "elkjs/lib/elk-api"
import { ZoomTransform } from "d3-zoom"

import { transformSelector, useStore, zoomingSelector } from "../store"
import { FONT_SIZE, LINE_HEIGHT } from "../font"
import { changeName } from "../modification"
import { PersonID } from "../types"

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
  const zooming = useStore(zoomingSelector)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const text = node.labels?.[0]?.text

    if (!ref.current) throw Error(text)

    ref.current.innerText = text ?? ""
    ref.current.focus()
    selectElementContents(ref.current)
  }, [node])

  const pid = node.id as PersonID

  return (
    <div
      tabIndex={0}
      ref={ref}
      className="absolute focus:outline-none text-center bg-white rounded-sm overflow-visible"
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
        transitionDuration: zooming ? undefined : '400ms'
      }}
      onBlur={({ target }) => {
        const { tree } = useStore.getState()
        changeName(tree, pid, target.innerText)
        useStore.setState({ editing: undefined })
      }}
      onKeyPress={({ shiftKey, target, code }) => {
        if (code === "Enter") {
          if (shiftKey) {

          } else {
            (target as HTMLElement).blur()
          }
        }
      }}
    />
  )
}
