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
  server,
  path: "/doc",
})

startHeartbeats(wsServer)

const state: State = {
  docs: {},
  persistence: mkPersistence('/tmp/yjs')
}

wsServer.on('connection', (conn, req) => {
  console.log(req.url)

  setupWSConnection(state, conn, 'foo', true)
})

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
