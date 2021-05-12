import * as Y from "yjs"
import * as syncProtocol from "y-protocols/sync"
import { decoding, encoding } from "lib0"
import WebSocket from "ws"

import { Persistence } from "./lib/yjs";

const messageSync = 0
const messageAwareness = 1

interface SharedDoc {
  name: string
  doc: Y.Doc
  conns: Set<WebSocket>
}


export interface State {
  docs: Partial<Record<string, SharedDoc>>
  persistence: Persistence
}

const broadcastUpdates = (state: State, doc: SharedDoc) => (update: Uint8Array): void => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => {
    send(state, doc, conn, message);
  })
}

const getYDoc = async (state: State, docname: string, gc = true): Promise<SharedDoc> => {
  {
    const doc = state.docs[docname]
    if (doc) return doc
  }

  const yDoc = new Y.Doc({
    guid: docname,
    gc,
  })
  const doc = {
    doc: yDoc,
    name: docname,
    conns: new Set<WebSocket>(),
  }

  await state.persistence.bindState(docname, yDoc)
  yDoc.on('update', broadcastUpdates(state, doc))

  state.docs[docname] = doc

  return doc
}

const onMessage = async (state: State, conn: WebSocket, doc: SharedDoc, message: Uint8Array) => {
  const encoder = encoding.createEncoder()
  const decoder = decoding.createDecoder(message)
  const messageType = decoding.readVarUint(decoder)
  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync)
      syncProtocol.readSyncMessage(decoder, encoder, doc.doc, null)
      if (encoding.length(encoder) > 1) {
        await send(state, doc, conn, encoding.toUint8Array(encoder))
      }
      break

    case messageAwareness: {
      // TODO maybe?
      break
    }
  }
}

const closeConn = async (state: State, doc: SharedDoc, conn: WebSocket) => {
  doc.conns.delete(conn)

  if (doc.conns.size === 0) {
    // if persisted, we store state and destroy ydocument
    await state.persistence.writeState(doc.name, doc.doc)
    doc.doc.destroy()

    delete state.docs[doc.name]
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
    syncProtocol.writeSyncStep1(encoder, doc.doc)
    await send(state, doc, conn, encoding.toUint8Array(encoder))
  }
}
