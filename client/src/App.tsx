import React, { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

import './App.css';
import { MessageBody, MessageType, UsernameType } from '../../global/schema'
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
  const [username, setUsername] = useState<string | undefined>(undefined)

  const recipientRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    socket.on('connect', () => {
      console.log(socket.id)
      setId(socket.id)
      socket.on('private message', handleMessageRecieve)   
      socket.on('username callback', (args: UsernameType) => {
        const { username, success } = args
        console.log(args)
        if (success) {
          setUsername(username)
        }
      })
    }) 
  })

  async function handleMessageRecieve(args: MessageType) {
    const newMessages = await (await fetch(`http://localhost:3003/messages/${args.to}/${args.from}`)).json()
    setMessages(newMessages)
  } 

  const sendMessage = async () => {
    if (socket.id != null) {
      const recipientName = recipientRef.current?.value
      const namesInDB = await (await fetch(`http://localhost:3003/users/${recipientName}/names`)).json()
      const value = messageRef.current?.value
      if (username && recipientName && value && namesInDB.length) {
        socket.emit('private message', configureMessage(username, recipientName, {value}))
        messageRef.current.value = ''
      }
    }
  }

  const handleUsername = () => {
    if (socket.id != null) {
      const username = usernameRef.current?.value
      if (username?.length) {
        socket.emit('set username', {id: socket.id, username})
      }
    }
  }

  async function handleRecipientChange() {
    const value = recipientRef.current?.value
    const messages = await (await fetch(`http://localhost:3003/messages/${value}/${username}`)).json()
    setMessages(messages)
  }

  return (
    <div className="App">
      {username ? 
        <>
          <label>Me: {id || 'waiting for socket id'}</label>
          <label>username: {username || 'waiting for username'}</label> 
          <label>Recipient Username:</label>
          <input ref={recipientRef} type='text' onChange={handleRecipientChange} />
          
          <div className='message-container'>
            {messages.map((msg, i) => {
              if (id != null) {
                return <Message 
                  key={i}
                  username={username}
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
        </> 
      :
        <div
          style={{display: 'flex', flexDirection: 'column'}}
        >
          <label>enter a username:</label>
          <input type='text' ref={usernameRef} placeholder='username' />
          <button onClick={handleUsername}>Submit</button>
        </div>
      }
    </div>
  )
}

export default App;
