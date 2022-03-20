import express from 'express'

import { createServer } from 'http'
import { Server } from 'socket.io'
import { MongoClient } from 'mongodb'
import cors from 'cors'

import { MessageType, UsernameType } from '../../global/schema'
import { DB, URI, USERS, MESSAGES, HTTP_PORT, EXPRESS_PORT } from './constants'
import App from './app'

const app = express()
app.use(cors())
const httpServer = createServer(app)
const io = new Server(httpServer, {cors: {origin: '*'}})


let client: MongoClient
async function run() {
  if (client) {
    try {
      await client.connect()
  
      await client.db('admin').command({ping: 1})
      console.log('Connected to db successfully')
    } catch (e) {
      console.error(e)
    }
  }
}
if (URI) {
  client = new MongoClient(URI)
  run()
  App(app, client)
}


io.on('connection', (socket) => {
  console.log(socket.id)

  socket.on('private message', async (args: MessageType) => {
    console.log(args)
    const recipientName = args.to
    const recipientObject = await client.db(DB).collection(USERS).findOne<{username: string, socket_id: string}>({username: recipientName})
    if (recipientObject?.socket_id) {
      await client.db(DB).collection(MESSAGES).insertOne(args)
  
      socket.emit('private message', args)
      socket.to(recipientObject?.socket_id).emit('private message', args)
    }
  })

  socket.on('set username', async (args: UsernameType) => {
    const { id, username } = args
    const dbUserEntry = await client.db(DB).collection(USERS).findOne({username})
    console.log(dbUserEntry)
    if (dbUserEntry) {
      socket.emit('username callback', {...args, success: false})
    } else {
      await client.db(DB).collection(USERS).insertOne({username, socket_id: id})
      socket.emit('username callback', {...args, success: true})
    }
  })

  socket.on('disconnect', async (reason) => {
    await client.db(DB).collection(USERS).findOneAndDelete({socket_id: socket.id})
    console.log(`socket ${socket.id} disconnected`, reason)
  })
})

httpServer.listen(HTTP_PORT)
app.listen(EXPRESS_PORT, () => {
  return console.log(`Express app listening on ${EXPRESS_PORT}`)
})

httpServer.on('close', () => {
  if (client) client.close()
})