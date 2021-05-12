import Y from "yjs"
import { LeveldbPersistence } from "y-leveldb"

export interface Persistence {
  provider: unknown
  bindState: (name: string, doc: Y.Doc) => Promise<void>
  writeState: (name: string, doc: Y.Doc) => Promise<void>
}

export const mkPersistence = (dir: string): Persistence => {
  const ldb = new LeveldbPersistence(dir)

  return {
    provider: ldb,

    async bindState(name: string, doc: Y.Doc) {
      const persistedDoc = await ldb.getYDoc(name)
      const newUpdates = Y.encodeStateAsUpdate(doc)
      await ldb.storeUpdate(name, newUpdates)
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(persistedDoc))
      doc.on('update', (update: Uint8Array) => {
        ldb.storeUpdate(name, update)
      })
    },
    async writeState() {
    },
  }
}
