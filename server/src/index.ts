import express from 'express'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { MongoClient } from 'mongodb'
import cors from 'cors'

import { MessageType, UsernameType } from '../../global/schema'

// constants
const HTTP_PORT = process.env.HTTP_PORT
const EXPRESS_PORT = process.env.EXPRESS_PORT
const URI = process.env.MONGODB_URI
const DB = process.env.DB
const USERS = 'users'
const MESSAGES = 'messages'

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

app.get('/:collection', async (req, res) => {
  const collection = req.params.collection
  const resultsCursor = client.db(DB).collection(collection).find()
  const resultsArr: any[] = []
  await resultsCursor.forEach((result) => {resultsArr.push(result)})

  res.status(200).send(resultsArr)
})

app.get('/messages/:to/:from', async (req, res) => {
  const collection = MESSAGES
  const {from, to} = req.params

  const query: Record<string, any> = {'$and': []}
  let sub = {'$or': [{to: from}, {from}]}
  query['$and'].push(sub)
  sub = {'$or': [{from: to}, {to}]}
  query['$and'].push(sub)
  
  const resultsCursor = client.db(DB).collection(collection).find(query)
  const resultsArr: any[] = []
  await resultsCursor.forEach(result => {resultsArr.push(result)})

  res.status(200).send(resultsArr)
})

app.get('/users/:username/names', async (req, res) => {
  const { username } = req.params
  const usersCursor = client.db(DB).collection(USERS).find<{username: string, socket_id: string}>({username})
  const usersArr: string[] = []
  await usersCursor.forEach(user => {
    usersArr.push(user.username)
  })

  res.send(usersArr)
})

httpServer.listen(HTTP_PORT)
app.listen(EXPRESS_PORT, () => {
  return console.log(`Express app listening on ${EXPRESS_PORT}`)
})

httpServer.on('close', () => {
  if (client) client.close()
})