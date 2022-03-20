import React, { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

import './App.css';
import { MessageBody, MessageType, UsernameType } from '../../global/schema'
import MessageBoard from './components/MessageBoard/component'
import Login from './components/Login/component'

function configureMessage(from: string, to: string, args: MessageBody): MessageType {
  return {
    from,
    to,
    body: {
      ...args
    }
  }
}

type Props = {
  socket: Socket
}

function App(props: Props) {
  const socket = props.socket
  const [messages, setMessages] = useState<MessageType[]>([])
  const [id, setId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const handleUsernameCallback = async (args: UsernameType) => {
    const { username, success } = args
    if (success) {
      setUsername(username)
    }
  }

  const handleMessageRecieve = async (args: MessageType) => {
    const newMessages = await (await fetch(`http://localhost:3003/messages/${args.to}/${args.from}`)).json()
    setMessages(newMessages)
  }

  useEffect(() => {
    socket.on('connect', () => {
      console.log(socket.id)
      setId(socket.id)
      socket.on('private message', handleMessageRecieve)   
      socket.on('username callback', handleUsernameCallback)
    }) 
  })

  const handleUsername = (username: string) => {
    if (socket.id != null) {
      if (username?.length) {
        socket.emit('set username', {id: socket.id, username})
      }
    }
  }

  if (!username?.length) {
    return (
      <Login onSubmitUsername={handleUsername} />
    )
  }

  const handleSendMessage = async (name?: string, value?: string) => {
    if (socket.id != null) {
      const namesInDB = await (await fetch(`http://localhost:3003/users/${name}/names`)).json()
      if (username && name && value && namesInDB.length) {
        socket.emit('private message', configureMessage(username, name, {value}))
      }
    }
  }

  const handleRecipientChange = async (value?: string) => {
    const messages = await (await fetch(`http://localhost:3003/messages/${value}/${username}`)).json()
    setMessages(messages)
  }

  return (
    <div className="App">
      <MessageBoard 
        id={id || ''}
        username={username || ''}
        messages={messages}
        onRecipientChange={handleRecipientChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

export default App;
