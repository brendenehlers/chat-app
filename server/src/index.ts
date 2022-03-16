import express from 'express'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'

const port = process.env.PORT
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {cors: {origin: '*'}})

type Message = {
  from: string
  to: string
  body: MessageBody
}

type MessageBody = {
  value: string
}

io.on('connection', (socket) => {
  console.log(socket.id)

  socket.on('private message', (args: Message) => {
    console.log(args)
    const recipientId = args.to
    socket.emit('private message', args)
    socket.to(recipientId).emit('private message', args)
  })

  socket.on('disconnect', (reason) => {
    console.log(`socket ${socket.id} disconnected`, reason)
  })
})

httpServer.listen(port)