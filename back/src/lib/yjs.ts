import * as Y from "yjs"
import { LeveldbPersistence } from "y-leveldb"

export interface Persistence {
  provider: unknown
  bindState: (docName: string, ydoc: Y.Doc) => Promise<void>
  writeState: (docName: string, ydoc: Y.Doc) => Promise<void>
}

export const mkPersistence = (dir: string): Persistence => {
  const ldb = new LeveldbPersistence(dir)

  return {
    provider: ldb,

    async bindState(docName: string, ydoc: Y.Doc) {
      const persistedYdoc = await ldb.getYDoc(docName)
      const newUpdates = Y.encodeStateAsUpdate(ydoc)
      await ldb.storeUpdate(docName, newUpdates)
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
      ydoc.on('update', (update: Uint8Array) => {
        ldb.storeUpdate(docName, update)
      })
    },
    async writeState() {
    },
  }
}
