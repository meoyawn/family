import React, { useEffect, useRef } from "react"
import { useForm } from "react-hook-form";
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb";
import { animated, Spring } from "react-spring";
import ELK, { ElkNode } from "elkjs/lib/elk.bundled.js";
import { FamilyTree, toELK } from "../lib/types";
import { addPerson } from "../lib/modification";

interface FormValues {
  name: string
}

function NodeComp(node: ElkNode): JSX.Element {
  return (
    <g>
      <Spring
        to={node}
        native
      >
        {props => (
          <animated.rect {...props} />
        )}
      </Spring>

      {node.labels?.map(label => (
        <Spring
          key={label.text}
          to={label}
          native
        >
          {props => (
            <animated.text {...props}>
              {label.text}
            </animated.text>
          )}
        </Spring>
      ))}
    </g>
  )
}

function NewPerson({ submit }: { submit: (x: FormValues) => void }): JSX.Element {
  const { register, handleSubmit, reset } = useForm<FormValues>({})

  return (
    <form onSubmit={handleSubmit(x => {
      submit(x)
      reset()
    })}>
      <input type="text" {...register("name", { required: true })} />
      <button type="submit">Add</button>
    </form>
  )
}

export default function Index(): JSX.Element {
  const treeRef = useRef<FamilyTree>({} as FamilyTree)

  useEffect(() => {
    const doc = new Y.Doc()
    const tree: FamilyTree = {
      people: doc.getMap('people'),
      families: doc.getMap('families'),
    }
    treeRef.current = tree

    const persistence = new IndexeddbPersistence('doc', doc)
    const undoMgr = new Y.UndoManager(Object.values(tree))
    persistence.whenSynced.then(() => undoMgr.clear())

    const elk = new ELK()
    const onDocChange = async () => {
      const layouted = await elk.layout(toELK(tree))
      console.log(layouted)
    };
    doc.on('update', onDocChange)
    return () => {
      doc.off('update', onDocChange)
    }
  }, [])

  return (
    <div>
      <NewPerson submit={x => addPerson(treeRef.current, x.name)} />
    </div>
  )
}
