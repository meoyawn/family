import React, { useEffect, useMemo, useRef } from "react"
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import ELK, { ElkNode } from "elkjs/lib/elk.bundled";
import { ZoomTransform } from "d3-zoom";

import { editingSelector, rootSelector, transformSelector, useStore } from "../app/store";
import { FamilyTree } from "../app/types";
import { toELK } from "../lib/layout";
import { Canvas } from "../app/components/Canvas";
import { changeName, giveBirth } from "../app/modification";
import { elkBFS } from "../lib/elk";
import { FONT_SIZE, LINE_HEIGHT } from "../app/font";

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

const Editor = ({ node }: {
  node: ElkNode
}) => {

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

const Editing = (): JSX.Element | null => {
  const editing = useStore(editingSelector)
  const root = useStore(rootSelector)
  const node = useMemo(() => root && editing && elkBFS(root, editing), [root, editing])

  return node
    ? <Editor node={node} />
    : null
}

// noinspection JSUnusedGlobalSymbols
export default function Index(): JSX.Element {
  const canvasParent = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    const tree: FamilyTree = {
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    useStore.setState({ tree })

    const persistence = new IndexeddbPersistence('doc', doc)
    const undoMgr = new Y.UndoManager(Object.values(tree))
    persistence.whenSynced.then(() => undoMgr.clear())

    const elk = new ELK()

    const onDocChange = async () => {
      const root = await elk.layout(toELK(tree))
      useStore.setState({ root })
    }

    doc.on('update', onDocChange)
    return () => {
      doc.destroy()
    }
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <div
        ref={canvasParent}
        className="w-full h-full"
      >
        <Canvas />
        <Editing />

        <button
          className="absolute top-1 right-1 bg-blue-600 rounded-md text-white font-medium p-2"
          onClick={() => {
            const { tree } = useStore.getState()
            const editing = giveBirth(tree, "")
            useStore.setState({ editing })
          }}
        >
          New
        </button>
      </div>
    </div>
  )
}
