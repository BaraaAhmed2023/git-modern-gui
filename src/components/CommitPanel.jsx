import React, { useState } from 'react'
import {
  Send,
  Sparkles,
  User,
  Calendar,
  GitCommit as CommitIcon,
  Copy,
  Check
} from 'lucide-react'

const CommitPanel = ({ onCommit, status, onGenerateAI }) => {
  const [message, setMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [commitType, setCommitType] = useState('feat')

  const commitTypes = [
    { value: 'feat', label: 'Feature', emoji: '✨', color: 'bg-purple-500' },
    { value: 'fix', label: 'Fix', emoji: '🐛', color: 'bg-red-500' },
    { value: 'docs', label: 'Documentation', emoji: '📚', color: 'bg-blue-500' },
    { value: 'style', label: 'Style', emoji: '💎', color: 'bg-pink-500' },
    { value: 'refactor', label: 'Refactor', emoji: '♻️', color: 'bg-green-500' },
    { value: 'test', label: 'Test', emoji: '✅', color: 'bg-yellow-500' },
    { value: 'chore', label: 'Chore', emoji: '🔧', color: 'bg-gray-500' },
  ]

  const handleCommit = () => {
    if (message.trim()) {
      const stagedFiles = status?.staged?.map(f => f.file) || []
      onCommit(message, stagedFiles)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleCommit()
    }
  }

  const generateSummary = () => {
    const changes = []
    if (status?.staged?.length) changes.push(`${status.staged.length} staged`)
    if (status?.unstaged?.length) changes.push(`${status.unstaged.length} unstaged`)
    if (status?.untracked?.length) changes.push(`${status.untracked.length} untracked`)
    return changes.join(', ')
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CommitIcon className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Commit Changes</h3>
          <span className="text-sm text-muted-foreground">
            {generateSummary()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateAI}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={() => setMessage('')}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Commit Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {commitTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setCommitType(type.value)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                ${commitType === type.value
                  ? `${type.color} text-white border-transparent`
                  : 'border-border hover:bg-accent'
                }
              `}
            >
              <span>{type.emoji}</span>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Commit Message Input */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your commit message here...
Use Ctrl/Cmd + Enter to commit"
            className="w-full h-32 p-4 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
          />

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={copyMessage}
              className="p-2 hover:bg-accent rounded transition-colors"
              title="Copy message"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleCommit}
              disabled={!message.trim() || !status?.staged?.length}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${message.trim() && status?.staged?.length
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              <Send className="w-4 h-4" />
              <span>Commit Changes</span>
            </button>
          </div>
        </div>

        {/* Commit Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>John Doe</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl/Cmd</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
            <span>to commit</span>
          </div>
        </div>

        {/* Commit Preview */}
        {message.trim() && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Commit Preview</h4>
            <div className="font-mono text-sm bg-background p-3 rounded">
              <span className="text-purple-500">
                {commitTypes.find(t => t.value === commitType)?.emoji} {commitType}:
              </span>{' '}
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommitPanel