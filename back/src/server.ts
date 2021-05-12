import restana from "restana"
import http from "http"
import WebSocket from 'ws'

import { startHeartbeats } from "./lib/ws"
import { setupWSConnection, State } from "./sync"
import { mkPersistence } from "./lib/yjs"

const app = restana()
  .get("/", (req, res) => {
    res.end("foo")
  })

const PORT = 4000

// @ts-ignore restana types
const server = http.createServer(app)

const wsServer = new WebSocket.Server({
  noServer: true
})

startHeartbeats(wsServer)

const state: State = {
  docs: {},
  persistence: mkPersistence('/tmp/yjs')
}

server.on('upgrade', (req, socket, head) => {
  wsServer.handleUpgrade(req, socket, head, conn => {
    wsServer.emit('connection', conn, req)
  })
})

wsServer.on('connection', (conn, { url }) => {
  if (url?.startsWith("/doc/")) {
    const pathSegments = url.split("/")
    const name = pathSegments[pathSegments.length - 1]
    setupWSConnection(state, conn, name, true)
  } else {
    conn.close()
  }
})

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
