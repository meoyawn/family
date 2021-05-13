import React, { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/router"
import * as Y from "yjs"
import ELK from "elkjs/lib/elk-api"
import hotkeys from "hotkeys-js"
import { IndexeddbPersistence } from "y-indexeddb"
import { WebsocketProvider } from "y-websocket"

import { FamilyTree } from "../../app/types"
import { editingSelector, rootSelector, useStore } from "../../app/store"
import { toELK } from "../../app/layout"
import dynamic from "next/dynamic"
import { elkBFS } from "../../lib/elk"
import { Editor } from "../../app/components/Editor"
import { createChild, deleteStuff } from "../../app/modification"

const Canvas = dynamic(() => import("../../app/components/Canvas"), { ssr: false })

const TextEditing = (): JSX.Element | null => {
  const editing = useStore(editingSelector)
  const root = useStore(rootSelector)
  const node = useMemo(() => root && editing && elkBFS(root, editing), [root, editing])

  return node
    ? <Editor node={node} />
    : null
}

const Buttons = () => (
  <div className="absolute top-1 right-1 flex flex-col space-y-1 font-medium text-white">

    <button
      className=" bg-blue-600 hover:bg-blue-400 rounded-md p-2"
      onClick={() => {
        const { tree } = useStore.getState()
        const editing = createChild(tree, "Man", "m")
        useStore.setState({ editing })
      }}
    >
      Man
    </button>

    <button
      className=" bg-blue-600 hover:bg-blue-400 rounded-md p-2"
      onClick={() => {
        const { tree } = useStore.getState()
        const editing = createChild(tree, "Woman", "f")
        useStore.setState({ editing })
      }}
    >
      Woman
    </button>

    <button
      className="bg-blue-600 hover:bg-blue-400 rounded-md p-2"
      onClick={doDelete}
    >
      Delete
    </button>
  </div>
)

const doDelete = () => {
  const { tree, selected } = useStore.getState()
  deleteStuff(tree, selected)
  useStore.setState({ selected: new Set() })
}

export default function FamilyID(): JSX.Element {
  const { family_id } = useRouter().query
  const canvasParent = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!family_id) return
    const docName = family_id as string

    const doc = new Y.Doc()
    const tree: FamilyTree = {
      doc,
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    useStore.setState({ tree })

    const persistence = new IndexeddbPersistence(docName, doc)
    const undoMgr = new Y.UndoManager([tree.people, tree.families])
    persistence.whenSynced.then(() => undoMgr.clear())

    if (process.env.NEXT_PUBLIC_WS) {
      const wsProvider = new WebsocketProvider(`${process.env.NEXT_PUBLIC_WS}`, docName, doc)
      wsProvider.on('status', (event: unknown) => {
        console.log(event)
      })
    }

    const elk = new ELK({
      workerUrl: '/elk-worker.min.js',
    })

    const onDocChange = async () => {
      const graph = toELK(tree);
      const root = await elk.layout(graph)
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
  }, [family_id])

  return (
    <div className="flex flex-col h-screen">
      <div
        ref={canvasParent}
        className="w-full h-full"
      >
        <Canvas />
        <TextEditing />
        <Buttons />
      </div>
    </div>
  )
}
