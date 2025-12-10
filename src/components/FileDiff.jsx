import React, { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  GitCommit,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import { useGit } from '../hooks/useGit'

const FileDiff = ({ filePath, repoPath, onClose }) => {
  const [diff, setDiff] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [view, setView] = useState('unified') // 'unified' or 'split'
  const { getFileDiff } = useGit()

  useEffect(() => {
    if (filePath && repoPath) {
      loadDiff()
    }
  }, [filePath, repoPath])

  const loadDiff = async () => {
    const result = await getFileDiff({ repoPath, filePath })
    if (result.success) {
      setDiff(result.diff)
    }
  }

  const parseDiff = (diffText) => {
    if (!diffText) return []

    const lines = diffText.split('\n')
    const chunks = []
    let currentChunk = null

    lines.forEach((line, index) => {
      if (line.startsWith('@@')) {
        // New chunk
        if (currentChunk) chunks.push(currentChunk)
        currentChunk = {
          header: line,
          oldStart: parseInt(line.match(/-\d+/)?.[0]?.slice(1) || 0),
          newStart: parseInt(line.match(/\+\d+/)?.[0]?.slice(1) || 0),
          lines: []
        }
      } else if (currentChunk) {
        const type = line.startsWith('+') ? 'added' :
                    line.startsWith('-') ? 'removed' :
                    line.startsWith(' ') ? 'context' : 'info'

        currentChunk.lines.push({
          type,
          content: line,
          lineNumber: type === 'added' ? currentChunk.newStart++ :
                     type === 'removed' ? currentChunk.oldStart++ :
                     type === 'context' ? (currentChunk.oldStart++, currentChunk.newStart++) : null
        })
      }
    })

    if (currentChunk) chunks.push(currentChunk)
    return chunks
  }

  const copyDiff = async () => {
    await navigator.clipboard.writeText(diff)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const getLineColor = (type) => {
    switch (type) {
      case 'added': return 'bg-green-500/10 border-green-500'
      case 'removed': return 'bg-red-500/10 border-red-500'
      case 'context': return 'bg-transparent border-transparent'
      default: return 'bg-blue-500/10 border-blue-500'
    }
  }

  const chunks = parseDiff(diff)

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold truncate max-w-md">{filePath}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setView('unified')}
              className={`px-3 py-1 rounded transition-colors ${
                view === 'unified' ? 'bg-background' : ''
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setView('split')}
              className={`px-3 py-1 rounded transition-colors ${
                view === 'split' ? 'bg-background' : ''
              }`}
            >
              Split
            </button>
          </div>

          <button
            onClick={copyDiff}
            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>Copy</span>
          </button>

          <button
            onClick={loadDiff}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto p-6">
        {chunks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No changes in this file
          </div>
        ) : (
          <div className="space-y-8">
            {chunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="space-y-4">
                {/* Chunk Header */}
                <div className="font-mono text-sm bg-muted/50 px-4 py-2 rounded-lg">
                  {chunk.header}
                </div>

                {/* Diff Lines */}
                <div className={`
                  font-mono text-sm rounded-lg overflow-hidden border border-border
                  ${view === 'split' ? 'grid grid-cols-2' : ''}
                `}>
                  {chunk.lines.map((line, lineIndex) => (
                    <div
                      key={lineIndex}
                      className={`
                        flex items-start group
                        ${view === 'split' && line.type === 'added' ? 'col-start-2' : ''}
                        ${view === 'split' && line.type === 'removed' ? 'col-start-1' : ''}
                        ${view === 'split' && line.type === 'context' ? 'col-span-2' : ''}
                      `}
                    >
                      {/* Line numbers */}
                      <div className={`
                        flex-shrink-0 w-16 px-3 py-1 text-right text-muted-foreground
                        border-r border-border bg-muted/30
                        ${getLineColor(line.type)}
                      `}>
                        {line.lineNumber || ' '}
                      </div>

                      {/* Line type indicator */}
                      <div className={`
                        flex-shrink-0 w-8 px-2 py-1 flex items-center justify-center
                        ${line.type === 'added' ? 'text-green-500 bg-green-500/10' : ''}
                        ${line.type === 'removed' ? 'text-red-500 bg-red-500/10' : ''}
                        ${line.type === 'context' ? 'text-muted-foreground' : ''}
                      `}>
                        {line.type === 'added' && '+'}
                        {line.type === 'removed' && '-'}
                        {line.type === 'context' && ' '}
                      </div>

                      {/* Line content */}
                      <div className={`
                        flex-1 px-3 py-1 whitespace-pre overflow-x-auto
                        ${line.type === 'added' ? 'bg-green-500/5' : ''}
                        ${line.type === 'removed' ? 'bg-red-500/5' : ''}
                        ${line.type === 'context' ? 'bg-transparent' : ''}
                      `}>
                        {line.content.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-600">+{chunks.reduce((acc, chunk) =>
                acc + chunk.lines.filter(l => l.type === 'added').length, 0
              )} additions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-600">-{chunks.reduce((acc, chunk) =>
                acc + chunk.lines.filter(l => l.type === 'removed').length, 0
              )} deletions</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>John Doe</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileDiff