/**
 * This is a global schema file that contains types for both the client and the server.
 * This file will not exist at runtime, so make sure nothing in here is needed then
 */

export type MessageType = {
  from: string
  to: string
  body: MessageBody
}

export type MessageBody = {
  value: string
}

export type UsernameType = {
  username: string
  id: string
  success?: boolean // sent to the callback
}