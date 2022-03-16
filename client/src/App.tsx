import React, { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

import './App.css';
import { MessageBody, MessageType } from '../../global/schema'
import Message from './components/Message/component'

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
        messageRef.current.value = ''
      }
    }
  }

  return (
    <div className="App">
      <label>Me: {id || 'waiting for socket id'}</label>
      <label>Recipient Id:</label>
      <input ref={recipientRef} type='text' />
      
      <div className='message-container'>
        {messages.map((msg, i) => {
          if (id != null) {
            return <Message 
              id={id}
              message={msg}
            />
          }
          return <></>
        })}
      </div>
      <div className='message-input'>
        <input ref={messageRef} type='text' className='text' placeholder='Send a message...' />
        <button onClick={sendMessage}>Send a message</button>
      </div>
    </div>
  );
}

export default App;
