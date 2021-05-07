import React, { useEffect, useMemo, useRef } from "react"
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import ELK from "elkjs/lib/elk.bundled";

import { editingSelector, rootSelector, useStore } from "../app/store";
import { FamilyTree } from "../app/types";
import { toELK } from "../lib/layout";
import { Canvas } from "../app/components/Canvas";
import { giveBirth } from "../app/modification";
import { elkBFS } from "../lib/elk";
import { Editor } from "../app/components/Editor";

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
