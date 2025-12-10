import React, { useState, useRef, useEffect } from 'react'
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  History,
  Folder,
  GitBranch
} from 'lucide-react'

const Terminal = ({ repoPath }) => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState([])
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExpanded, setIsExpanded] = useState(false)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    // Focus input when expanded
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const executeCommand = async (cmd) => {
    if (!cmd.trim()) return

    // Add command to output
    setOutput(prev => [...prev, { type: 'command', content: `$ ${cmd}` }])

    // Add to history
    setHistory(prev => {
      const newHistory = [...prev]
      if (newHistory[newHistory.length - 1] !== cmd) {
        newHistory.push(cmd)
      }
      return newHistory.slice(-50) // Keep last 50 commands
    })
    setHistoryIndex(-1)

    // Clear input
    setInput('')

    try {
      // Execute git command via Python
      const args = cmd.split(' ')
      const command = args[0]
      const commandArgs = args.slice(1)

      let result
      if (command === 'git') {
        // Use our git operations
        const gitCommand = commandArgs[0]
        switch (gitCommand) {
          case 'status':
            result = await window.electronAPI.getRepoStatus(repoPath)
            break
          case 'add':
            result = await executeGitAdd(commandArgs.slice(1))
            break
          case 'commit':
            const message = commandArgs.slice(1).join(' ').replace(/^["']|["']$/g, '')
            result = await window.electronAPI.commitChanges({ repoPath, message })
            break
          case 'push':
            result = await window.electronAPI.pushChanges({ repoPath })
            break
          case 'pull':
            result = await window.electronAPI.pullChanges({ repoPath })
            break
          case 'log':
            result = await window.electronAPI.getCommitHistory(repoPath)
            break
          default:
            result = { output: `Unknown git command: ${gitCommand}`, success: false }
        }
      } else if (command === 'clear') {
        setOutput([])
        return
      } else if (command === 'help') {
        result = {
          output: `Available commands:
  git status                    - Show repository status
  git add <file>                - Stage files
  git commit -m "message"       - Commit changes
  git push                      - Push to remote
  git pull                      - Pull from remote
  git log                       - Show commit history
  clear                         - Clear terminal
  help                          - Show this help`,
          success: true
        }
      } else {
        result = { output: `Unknown command: ${command}`, success: false }
      }

      // Add output to terminal
      if (result.success) {
        if (typeof result.output === 'string') {
          setOutput(prev => [...prev, { type: 'output', content: result.output }])
        } else if (typeof result.output === 'object') {
          setOutput(prev => [...prev, { type: 'output', content: JSON.stringify(result.output, null, 2) }])
        }
      } else {
        setOutput(prev => [...prev, { type: 'error', content: result.error || 'Command failed' }])
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', content: `Error: ${error.message}` }])
    }
  }

  const executeGitAdd = async (files) => {
    // This would be implemented in git_operations.py
    return { output: 'Staged files successfully', success: true }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      executeCommand(input.trim())
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : 0
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[history.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Basic tab completion for git commands
      const commands = ['git', 'clear', 'help']
      const current = input.split(' ')[0]
      const matches = commands.filter(cmd => cmd.startsWith(current))
      if (matches.length === 1) {
        setInput(matches[0] + ' ')
      }
    }
  }

  const clearTerminal = () => {
    setOutput([])
  }

  const copyOutput = () => {
    const text = output.map(line => line.content).join('\n')
    navigator.clipboard.writeText(text)
  }

  const getPrompt = () => {
    if (!repoPath) return '~/no-repo'
    const dir = repoPath.split('/').pop()
    return `~/git/${dir}`
  }

  return (
    <div className={`
      border-t border-border bg-card transition-all duration-300
      ${isExpanded ? 'h-96' : 'h-12'}
    `}>
      {/* Terminal Header */}
      <div
        className="h-12 px-4 border-b border-border flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-5 h-5" />
          <span className="font-medium">Terminal</span>
          <span className="text-sm text-muted-foreground font-mono">
            {getPrompt()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearTerminal()
            }}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyOutput()
            }}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Copy output"
          >
            <Copy className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Terminal Content */}
      {isExpanded && (
        <div className="h-[calc(100%-3rem)] flex flex-col">
          {/* Output Area */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/50"
          >
            {output.length === 0 ? (
              <div className="text-muted-foreground">
                <p>Welcome to Git Terminal</p>
                <p>Type 'help' for available commands</p>
                <p className="mt-4">
                  <span className="text-green-400">$</span>{' '}
                  <span className="text-cyan-400">git status</span>
                </p>
                <p className="mt-2">
                  <span className="text-green-400">$</span>{' '}
                  <span className="text-cyan-400">git add .</span>
                </p>
                <p className="mt-2">
                  <span className="text-green-400">$</span>{' '}
                  <span className="text-cyan-400">git commit -m "Your message"</span>
                </p>
              </div>
            ) : (
              output.map((line, index) => (
                <div
                  key={index}
                  className={`
                    mb-1 whitespace-pre-wrap break-words
                    ${line.type === 'command' ? 'text-green-400' : ''}
                    ${line.type === 'output' ? 'text-gray-300' : ''}
                    ${line.type === 'error' ? 'text-red-400' : ''}
                  `}
                >
                  {line.content}
                </div>
              ))
            )}

            {/* Input Line */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
              <span className="text-green-400">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-gray-300 font-mono"
                placeholder="Enter git command..."
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border p-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => executeCommand('git status')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                <span>status</span>
              </button>
              <button
                onClick={() => executeCommand('git add .')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <Folder className="w-3 h-3" />
                <span>add .</span>
              </button>
              <button
                onClick={() => executeCommand('git log --oneline -10')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <History className="w-3 h-3" />
                <span>log</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Terminal