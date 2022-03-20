import React from 'react'

import './styles.css'
import {MessageType} from '../../../../global/schema'

type Props = {
    username: string
    message: MessageType
}

function Message(props: Props) {
    const {message, username} = props
    return (
        <div
            className={`message ${message.to === username ? 'foreign' : ''} `}
        >
            <div className='message-body'>
                {message.body.value}
            </div>
        </div>
    )
}

export default Message