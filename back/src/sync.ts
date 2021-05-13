import * as Y from "yjs"
import { readSyncMessage, writeSyncStep1, writeUpdate } from "y-protocols/sync"
import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness'
import { decoding, encoding } from "lib0"
import WebSocket from "ws"

import { Persistence } from "./lib/yjs"

const messageSync = 0
const messageAwareness = 1

interface SharedDoc {
  name: string
  doc: Y.Doc
  conns: Map<WebSocket, Set<number>>
  awareness: Awareness
}

export interface State {
  docs: Map<string, SharedDoc>
  persistence: Persistence
}

const updateHandler = (state: State, doc: SharedDoc) => (update: Uint8Array): void => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => {
    send(state, doc, conn, message)
  })
}

const awarenessChangeHandler = (state: State, doc: SharedDoc) => (
  { added, updated, removed }: {
    added: ReadonlyArray<number>
    updated: ReadonlyArray<number>
    removed: ReadonlyArray<number>
  },
  conn: WebSocket
) => {
  const changedClients = added.concat(updated, removed)
  if (conn !== null) {
    const connControlledIDs = doc.conns.get(conn)
    if (connControlledIDs !== undefined) {
      added.forEach(clientID => {
        connControlledIDs.add(clientID)
      })
      removed.forEach(clientID => {
        connControlledIDs.delete(clientID)
      })
    }
  }

  // broadcast awareness update
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageAwareness)
  encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, changedClients))
  const buff = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, c) => {
    send(state, doc, c, buff)
  })
}

const getYDoc = async (state: State, docname: string, gc = true): Promise<SharedDoc> => {

  {
    const doc = state.docs.get(docname)
    if (doc) return doc
  }

  const yDoc = new Y.Doc({ gc })
  const awareness = new Awareness(yDoc)
  const doc: SharedDoc = {
    doc: yDoc,
    name: docname,
    conns: new Map(),
    awareness,
  }

  awareness.setLocalState(null)
  awareness.on('update', awarenessChangeHandler(state, doc))
  yDoc.on('update', updateHandler(state, doc))
  await state.persistence.bindState(docname, yDoc)

  state.docs.set(docname, doc)
  return doc
}

const onMessage = async (state: State, conn: WebSocket, doc: SharedDoc, message: Uint8Array) => {
  const encoder = encoding.createEncoder()
  const decoder = decoding.createDecoder(message)
  const messageType = decoding.readVarUint(decoder)
  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync)
      readSyncMessage(decoder, encoder, doc.doc, null)
      if (encoding.length(encoder) > 1) {
        await send(state, doc, conn, encoding.toUint8Array(encoder))
      }
      break

    case messageAwareness: {
      applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
      break
    }
  }
}

const closeConn = async (state: State, doc: SharedDoc, conn: WebSocket) => {
  const controlledIds = doc.conns.get(conn)
  if (controlledIds) {
    doc.conns.delete(conn)
    removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)

    if (doc.conns.size === 0) {
      // if persisted, we store state and destroy ydocument
      await state.persistence.writeState(doc.name, doc.doc)
      doc.doc.destroy()

      state.docs.delete(doc.name)
    }
  }

  conn.close()
}

const OPEN_STATES = new Set<number>([WebSocket.CONNECTING, WebSocket.OPEN])

const send = async (state: State, doc: SharedDoc, conn: WebSocket, message: Uint8Array) => {
  if (!OPEN_STATES.has(conn.readyState)) {
    await closeConn(state, doc, conn)
    return
  }

  try {
    conn.send(message, err => {
      if (err) {
        closeConn(state, doc, conn)
      }
    })
  } catch (e) {
    await closeConn(state, doc, conn)
  }
}

export const setupWSConnection = async (state: State, conn: WebSocket, docName: string, gc = true): Promise<void> => {
  conn.binaryType = 'arraybuffer'

  // get doc, initialize if it does not exist yet
  const doc = await getYDoc(state, docName, gc)
  doc.conns.set(conn, new Set())
  // listen and reply to events
  conn.on('message', message => {
    if (message instanceof ArrayBuffer) {
      onMessage(state, conn, doc, new Uint8Array(message))
    }
  })

  conn.on('close', () => {
    closeConn(state, doc, conn)
  })

  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    writeSyncStep1(encoder, doc.doc)
    await send(state, doc, conn, encoding.toUint8Array(encoder))
    const awarenessStates = doc.awareness.getStates()
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
      await send(state, doc, conn, encoding.toUint8Array(encoder))
    }
  }
}
