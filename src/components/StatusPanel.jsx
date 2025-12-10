import React from 'react'
import {
  PlusCircle,
  MinusCircle,
  Edit,
  GitCommit,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'

const StatusPanel = ({ status, onFileSelect, onStageFile, onStageAll, onUnstageAll, onAddAll }) => {
  if (!status) return null

  // Ensure arrays exist
  const staged = Array.isArray(status.staged) ? status.staged : []
  const unstaged = Array.isArray(status.unstaged) ? status.unstaged : []
  const untracked = Array.isArray(status.untracked) ? status.untracked : []

  const getStatusIcon = (status) => {
    switch (status) {
      case 'A': return <PlusCircle className="w-4 h-4 text-git-added" />
      case 'M': return <Edit className="w-4 h-4 text-git-modified" />
      case 'D': return <MinusCircle className="w-4 h-4 text-git-deleted" />
      case 'R': return <GitCommit className="w-4 h-4 text-git-renamed" />
      default: return <Edit className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'A': return 'border-git-added'
      case 'M': return 'border-git-modified'
      case 'D': return 'border-git-deleted'
      case 'R': return 'border-git-renamed'
      default: return 'border-gray-400'
    }
  }

  const handleStageFile = (e, file) => {
    e.stopPropagation()
    if (onStageFile) {
      onStageFile(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Staged Changes */}
      {staged.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Staged Changes</h3>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  {staged.length} files
                </span>
              </div>
              <button
                onClick={() => onUnstageAll && onUnstageAll()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-destructive/10 px-3 py-1 rounded"
              >
                Unstage All
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {staged.map((file, index) => (
              <div
                key={index}
                className={`px-6 py-3 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-3 border-l-4 ${getStatusColor(file.status)}`}
                onClick={() => onFileSelect && onFileSelect(file.file)}
              >
                {getStatusIcon(file.status)}
                <span className="flex-1 font-mono text-sm">{file.file}</span>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                  {file.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unstaged Changes */}
      {unstaged.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold">Unstaged Changes</h3>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  {unstaged.length} files
                </span>
              </div>
              <button
                onClick={() => onStageAll && onStageAll()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-green-500/10 px-3 py-1 rounded"
              >
                Stage All
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {unstaged.map((file, index) => (
              <div
                key={index}
                className={`px-6 py-3 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-3 border-l-4 ${getStatusColor(file.status)}`}
                onClick={() => onFileSelect && onFileSelect(file.file)}
              >
                {getStatusIcon(file.status)}
                <span className="flex-1 font-mono text-sm">{file.file}</span>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                  {file.status}
                </span>
                <button
                  onClick={(e) => handleStageFile(e, file.file)}
                  className="p-1 hover:bg-green-500/20 rounded transition-colors"
                  title="Stage this file"
                >
                  <PlusCircle className="w-4 h-4 text-green-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Untracked Files */}
      {untracked.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Untracked Files</h3>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                  {untracked.length} files
                </span>
              </div>
              <button
                onClick={() => onAddAll && onAddAll()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-blue-500/10 px-3 py-1 rounded"
              >
                Add All
              </button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {untracked.map((file, index) => {
              const fileObj = typeof file === 'string' ? { status: '??', file } : file
              return (
                <div
                  key={index}
                  className="px-6 py-3 hover:bg-accent/50 transition-colors cursor-pointer flex items-center gap-3"
                  onClick={() => onFileSelect && onFileSelect(fileObj.file)}
                >
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  <span className="flex-1 font-mono text-sm">{fileObj.file}</span>
                  <button
                    onClick={(e) => handleStageFile(e, fileObj.file)}
                    className="p-1 hover:bg-green-500/20 rounded transition-colors"
                    title="Add this file"
                  >
                    <PlusCircle className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Changes */}
      {staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="max-w-sm mx-auto">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Working directory clean</h3>
            <p className="text-muted-foreground mb-6">
              No changes to commit. Make some changes to your files or pull from remote.
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusPanel