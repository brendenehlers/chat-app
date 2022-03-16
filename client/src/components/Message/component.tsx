import React from 'react'

import './styles.css'
import {MessageType} from '../../../../global/schema'

type Props = {
    id: string
    message: MessageType
}

function Message(props: Props) {
    const {message, id} = props
    return (
        <div
            className={`message ${message.to === id ? 'foreign' : ''} `}
        >
            <div className='message-body'>
                {message.body.value}
            </div>
        </div>
    )
}

export default Message