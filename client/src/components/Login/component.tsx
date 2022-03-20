import React, {useRef} from 'react'

type Props = {
  onSubmitUsername: (username: string) => void
}

function Login(props: Props) {
  const { onSubmitUsername } = props
  const usernameRef = useRef<HTMLInputElement>(null)

  return <>
    <div className='App'>
      <div
        style={{display: 'flex', flexDirection: 'column'}}
      >
        <label>enter a username:</label>
        <input type='text' ref={usernameRef} placeholder='username' />
        <button onClick={() => onSubmitUsername(usernameRef.current?.value || '')}>Submit</button>
      </div>
    </div>
  </>
}

export default Login