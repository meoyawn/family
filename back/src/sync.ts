import Y from "yjs"
import syncProtocol from "y-protocols/sync"
import { encoding } from "lib0"
import WebSocket from "ws"

const messageSync = 0
const messageAwareness = 1

interface SharedDoc {
  name: string
  doc: Y.Doc
  conns: Set<WebSocket>
}

const docs: Partial<Record<string, Y.Doc>> = {}

const closeConn = (doc: SharedDoc, conn: WebSocket) => {
  if (doc.conns.has(conn)) {
    doc.conns.delete(conn)

    if (doc.conns.size === 0 && persistence !== null) {
      // if persisted, we store state and destroy ydocument
      persistence.writeState(doc.name, doc).then(() => {
        doc.doc.destroy()
      })

      delete docs[doc.name]
    }
  }
  conn.close()
}

const send = (doc: Y.Doc, conn: WebSocket, m: Uint8Array) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn)
  }
  try {
    conn.send(m, err => {
      err !== null && closeConn(doc, conn)
    })
  } catch (e) {
    closeConn(doc, conn)
  }
}

const updateHandler = (update: Uint8Array, origin: number, doc: Y.Doc, conns: Set<WebSocket>) => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)

  const message = encoding.toUint8Array(encoder)
  conns.forEach(conn => {
    send(doc, conn, message);
  })
}
