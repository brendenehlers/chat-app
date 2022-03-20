import express from 'express'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { MongoClient } from 'mongodb'
import cors from 'cors'

import { MessageType, UsernameType } from '../../global/schema'

// constants
const http_port = process.env.HTTP_PORT
const expr_port = process.env.EXPRESS_PORT
const uri = process.env.MONGODB_URI
const db = process.env.DB
const users = 'users'
const messages = 'messages'

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
if (uri) {
  client = new MongoClient(uri)
  run()
}


io.on('connection', (socket) => {
  console.log(socket.id)

  socket.on('private message', async (args: MessageType) => {
    console.log(args)
    const recipientName = args.to
    const recipientObject = await client.db(db).collection(users).findOne<{username: string, socket_id: string}>({username: recipientName})
    if (recipientObject?.socket_id) {
      await client.db(db).collection('messages').insertOne(args)
  
      socket.emit('private message', args)
      socket.to(recipientObject?.socket_id).emit('private message', args)
    }
  })

  socket.on('set username', async (args: UsernameType) => {
    const { id, username } = args
    const dbUserEntry = await client.db(db).collection(users).findOne({username})
    console.log(dbUserEntry)
    if (dbUserEntry) {
      socket.emit('username callback', {...args, success: false})
    } else {
      await client.db(db).collection('users').insertOne({username, socket_id: id})
      socket.emit('username callback', {...args, success: true})
    }
  })

  socket.on('disconnect', async (reason) => {
    await client.db(db).collection(users).findOneAndDelete({socket_id: socket.id})
    console.log(`socket ${socket.id} disconnected`, reason)
  })
})

app.get('/:collection', async (req, res) => {
  const collection = req.params.collection
  const resultsCursor = client.db('chatapp').collection(collection).find()
  const resultsArr: any[] = []
  await resultsCursor.forEach((result) => {resultsArr.push(result)})

  res.status(200).send(resultsArr)
})

app.get('/messages/:to/:from', async (req, res) => {
  const collection = 'messages'
  const {from, to} = req.params

  const query: Record<string, any> = {'$and': []}
  let sub = {'$or': [{to: from}, {from}]}
  query['$and'].push(sub)
  sub = {'$or': [{from: to}, {to}]}
  query['$and'].push(sub)
  
  const resultsCursor = client.db('chatapp').collection(collection).find(query)
  const resultsArr: any[] = []
  await resultsCursor.forEach(result => {resultsArr.push(result)})

  res.status(200).send(resultsArr)
})

httpServer.listen(http_port)
app.listen(expr_port, () => {
  return console.log(`Express app listening on ${expr_port}`)
})

httpServer.on('close', () => {
  if (client) client.close()
})