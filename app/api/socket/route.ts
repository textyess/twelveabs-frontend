import { createServer } from "http"
import { Server } from "socket.io"
import { NextApiRequest } from "next"
import { NextApiResponse } from "next"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ["GET", "POST"],
  },
})

io.on("connection", (socket) => {
  console.log("Client connected")

  socket.on("join-workout", (sessionId) => {
    socket.join(`workout-${sessionId}`)
  })

  socket.on("form-feedback", (data) => {
    io.to(`workout-${data.sessionId}`).emit("feedback", data)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  res.socket.server.io = io
  httpServer.listen(3001)
  return new Response("Socket server running")
}