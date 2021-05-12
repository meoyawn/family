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

const wsServer = new WebSocket.Server({ noServer: true })

const state: State = {
  docs: new Map(),
  persistence: mkPersistence('/tmp/yjs'),
}

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith("/doc/")) {
    wsServer.handleUpgrade(req, socket, head, conn => {
      wsServer.emit('connection', conn, req)
    })
  } else {
    socket.destroy()
  }
})

wsServer.on('connection', (conn, { url }) => {
  const pathSegments = url!.split("/")
  const name = pathSegments[pathSegments.length - 1]
  setupWSConnection(state, conn, name, true)
})

startHeartbeats(wsServer)

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
