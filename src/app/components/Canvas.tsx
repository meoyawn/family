import React, { useEffect } from "react";
import { Layer, Stage } from "react-konva";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import ELK from "elkjs/lib/elk.bundled";

import { rootSelector, useStore } from "../store";
import { FamilyTree } from "../types";
import { toELK } from "../../lib/layout";
import { giveBirth } from "../../lib/modification";
import Person from "./Person";

export default function Canvas({ width, height }: {
  width: number
  height: number
}): JSX.Element {
  const root = useStore(rootSelector)

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
    <Stage
      draggable={true}
      width={width}
      height={height}
    >
      <Layer>
        {root?.children?.map(c => (
          <Person key={c.id} node={c} />
        ))}
      </Layer>
    </Stage>
  )
}
