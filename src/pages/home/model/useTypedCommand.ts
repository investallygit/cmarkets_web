import { useEffect, useState } from 'react'
import { nextTyping, TYPING_START } from '../lib/typing'

/** The command on screen: typed and erased in turn while `running`, whole otherwise. */
export function useTypedCommand(commands: readonly string[], running: boolean): string {
  const [typing, setTyping] = useState(TYPING_START)

  useEffect(() => {
    if (!running) return
    const [next, delay] = nextTyping(typing, commands)
    const timer = setTimeout(() => setTyping(next), delay)
    return () => clearTimeout(timer)
  }, [typing, commands, running])

  const command = commands[typing.command]
  return running ? command.slice(0, typing.length) : command
}
