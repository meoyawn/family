import restana from "restana"
import http from "http"
import WebSocket from 'ws'

const app = restana()
  .get("/", (req, res) => {
    res.end("foo")
  })

const PORT = 4000

// @ts-ignore restana types
const server = http.createServer(app)

const wsServer = new WebSocket.Server({ server })

wsServer.on('connection', ws => {

})

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})
