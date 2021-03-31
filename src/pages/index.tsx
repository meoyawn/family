import React from "react"
import { useForm } from "react-hook-form";
import * as Y from 'yjs'
import { IndexeddbPersistence } from "y-indexeddb";

interface FormValues {
  name: string
}

function Foo() {
  const { register, handleSubmit } = useForm<FormValues>()
  const submit = (x: FormValues) => {
    console.log(x)
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <input ref={register} name="name" />
      <input type="submit" />
    </form>
  )
}

export default function Index(): JSX.Element {
  const doc = new Y.Doc()
  const persistence = new IndexeddbPersistence('doc', doc)
  const undoMgr = new Y.UndoManager([doc])
  persistence.whenSynced.then(() => undoMgr.clear())
  return (
    <>
      Index
    </>
  )
}
