import React, { useRef } from 'react'

import Message from './Message/component'
import { MessageType } from '../../../../global/schema'

type Props = {
    id: string
    username: string
    messages: MessageType[]
    onRecipientChange: (value?: string) => void
    onSendMessage: (name?: string, value?: string) => void
}

function MessageBoard(props: Props) {
    const { id, username, messages, onRecipientChange, onSendMessage } = props

    const recipientRef = useRef<HTMLInputElement>(null)
    const messageRef = useRef<HTMLInputElement>(null)

    function handleSendMessage() {
      const name = recipientRef.current?.value
      const value = messageRef.current?.value

      onSendMessage(name, value)
    }

    return <>
      <label>Me: {id}</label>
      <label>username: {username}</label> 
      <label>Recipient Username:</label>
      <input ref={recipientRef} type='text' onChange={(e) => onRecipientChange(recipientRef.current?.value)} />
      
      <div className='message-container'>
        {messages.map((msg, i) => {
          return <Message 
            key={i}
            username={username}
            message={msg}
          />
        })}
      </div>
      <div className='message-input'>
        <input ref={messageRef} type='text' className='text' placeholder='Send a message...' />
        <button onClick={handleSendMessage}>Send a message</button>
      </div>
  </> 
}

export default MessageBoard