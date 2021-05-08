import React, { useEffect, useMemo, useRef } from "react"
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
import ELK from "elkjs/lib/elk-api"
import hotkeys from "hotkeys-js";
import dynamic from "next/dynamic";

import { editingSelector, rootSelector, useStore } from "../app/store"
import { FamilyTree } from "../app/types"
import { toELK } from "../app/layout"
import { createPerson, deleteStuff } from "../app/modification"
import { elkBFS } from "../lib/elk"
import { Editor } from "../app/components/Editor"

const Canvas = dynamic(() => import("../app/components/Canvas"), { ssr: false })

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
      doc,
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    useStore.setState({ tree })

    const persistence = new IndexeddbPersistence('doc', doc)
    const undoMgr = new Y.UndoManager([tree.people, tree.families])
    persistence.whenSynced.then(() => undoMgr.clear())

    const elk = new ELK({
      workerUrl: './elk-worker.min.js',
    })

    const onDocChange = async () => {
      const root = await elk.layout(toELK(tree))
      useStore.setState({ root })
    }
    doc.on('update', onDocChange)

    hotkeys('delete, backspace', doDelete)
    hotkeys('ctrl+z, cmd+z', () => {
      if (!undoMgr.undoing) {
        undoMgr.undo()
      }
    })
    hotkeys('ctrl+shift+z, cmd+shift+z', () => {
      if (!undoMgr.redoing) {
        undoMgr.redo()
      }
    })

    return () => {
      hotkeys.unbind()
      undoMgr.destroy()
      persistence.destroy()
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

        <div className="absolute top-1 right-1 flex flex-col space-y-1 font-medium text-white">
          <button
            className=" bg-blue-600 hover:bg-blue-400 rounded-md  p-2"
            onClick={() => {
              const { tree } = useStore.getState()
              const editing = createPerson(tree, "")
              useStore.setState({ editing })
            }}
          >
            New
          </button>

          <button
            className="bg-blue-600 hover:bg-blue-400 rounded-md p-2"
            onClick={doDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const doDelete = () => {
  const { tree, selected } = useStore.getState()
  deleteStuff(tree, selected)
  useStore.setState({ selected: new Set() })
}
