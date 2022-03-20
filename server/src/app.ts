import {Express} from 'express'
import {MongoClient} from 'mongodb'

import { DB, MESSAGES, USERS } from './constants'
import { MessageType } from '../../global/schema'

function App(app: Express, client: MongoClient) {
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
    
    const resultsCursor = client.db(DB).collection(collection).find<MessageType>(query)
    const resultsArr: MessageType[] = []
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
}

export default App