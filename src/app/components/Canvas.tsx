import React, { useEffect } from "react"
import { Layer } from "react-konva"
import * as Y from "yjs"
import { IndexeddbPersistence } from "y-indexeddb"
import ELK from "elkjs/lib/elk.bundled"

import { useStore } from "../store"
import { FamilyTree } from "../types"
import { toELK } from "../../lib/layout"
import { giveBirth } from "../../lib/modification"
import { dragTransform, stayInPlace, wheelTransform } from "../../lib/konva"
import InfiniteGrid from "./InfiniteGrid"
import { ResizingStage } from "./ResizingStage";
import Graph from "./Graph"

export default function Canvas({ parentEl }: {
  parentEl: () => Element
}): JSX.Element {

  useEffect(() => {
    const doc = new Y.Doc()
    const tree: FamilyTree = {
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    useStore.setState({ tree })

    const persistence = new IndexeddbPersistence('doc', doc)
    const undoMgr = new Y.UndoManager(Object.values(tree))
    persistence.whenSynced.then(() => {
      if (!tree.people.size) {
        giveBirth(tree, "Me")
      }
      undoMgr.clear()
    })

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
    <ResizingStage
      parentEl={parentEl}

      draggable={true}
      dragBoundFunc={stayInPlace}
      onDragMove={dragTransform({
        get: () => useStore.getState().transform,
        set: transform => useStore.setState({ transform }),
      })}

      onWheel={wheelTransform({
        get: () => useStore.getState().transform,
        set: transform => useStore.setState({ transform }),
        extent: [0.3, 20],
      })}
    >
      <Layer>
        <InfiniteGrid />

        <Graph />
      </Layer>
    </ResizingStage>
  )
}
