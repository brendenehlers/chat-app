import React, { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

import './App.css';

type Message = {
  from: string
  to: string
  body: MessageBody
}

type MessageBody = {
  value: string
}

function configureMessage(from: string, to: string, args: MessageBody): Message {
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
  const [messages, setMessages] = useState<Message[]>([])
  const [id, setId] = useState<string | null>(null)

  const recipientRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    socket.on('connect', () => {
      console.log(socket.id)
      setId(socket.id)
      socket.on('private message', (body) => {
        setMessages(oldMessages => [...oldMessages, body])
      })   
    }) 
  })

  useEffect(() => {
    console.log(messages)
  })

  const sendMessage = () => {
    if (socket.id != null) {
      const recipientId = recipientRef.current?.value
      const value = messageRef.current?.value
      if (recipientId && value) {
        socket.emit('private message', configureMessage(socket.id, recipientId, {value}))
      }
    }
  }

  return (
    <div className="App">
      <label>Me: {id || 'waiting for socket id'}</label>
      <br />
      <label>Recipient Id:</label>
      <input ref={recipientRef} type='text' />
      <br />
      <label>Message content:</label>
      <input ref={messageRef} type='text' />
      <br />
      <button onClick={sendMessage}>Send a message</button>
      {messages.map((msg, i) => {
        return <p key={i}>{msg.from === id ? `to: ${msg.to}` : `from: ${msg.from}`}, message: {msg.body.value}</p>
      })}
    </div>
  );
}

export default App;
