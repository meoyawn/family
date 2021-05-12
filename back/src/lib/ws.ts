import WebSocket from "ws"

const getPings = (conn: WebSocket): number =>
  // @ts-ignore custom prop
  conn.pingsSent

const setPings = (conn: WebSocket, num: number) => {
  // @ts-ignore custom prop
  conn.pingsSent = num
}

function onPong(this: WebSocket) {
  setPings(this, 0)
}

export const startHeartbeats = (server: WebSocket.Server, onTerminate?: (conn: WebSocket) => void): void => {

  server.on('connection', conn => {
    setPings(conn, 0)
    conn.on('pong', onPong)
  })

  const interval = setInterval(() => {
    server.clients.forEach(conn => {
      const pings = getPings(conn)
      if (pings > 1) {
        conn.terminate()
        onTerminate?.(conn)
      } else {
        setPings(conn, pings + 1)
        conn.ping()
      }
    })
  }, 30000)

  server.on('close', () => clearInterval(interval))
}
