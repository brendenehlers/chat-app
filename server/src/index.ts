import express from 'express'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { Message } from '../../global/schema'

const port = process.env.PORT
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {cors: {origin: '*'}})

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